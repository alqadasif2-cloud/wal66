import { LiveMarketData } from '../types/wallet';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

type PriceListener = (prices: Record<string, LiveMarketData>, isConnected: boolean) => void;

const ASSETS_CONFIG = [
  { symbol: 'BTC', ticker: 'BTCUSDT', name: 'Bitcoin', nameAr: 'بيتكوين' },
  { symbol: 'ETH', ticker: 'ETHUSDT', name: 'Ethereum', nameAr: 'إيثيريوم' },
  { symbol: 'BNB', ticker: 'BNBUSDT', name: 'BNB Smart Chain', nameAr: 'بي إن بي سمارت شين' },
  { symbol: 'SOL', ticker: 'SOLUSDT', name: 'Solana', nameAr: 'سولانا' },
  { symbol: 'TRX', ticker: 'TRXUSDT', name: 'TRON', nameAr: 'ترون' },
  { symbol: 'USDT', ticker: 'USDT', name: 'Tether USD', nameAr: 'تيثر دولار' },
];

class MarketPriceService {
  private static instance: MarketPriceService;
  private prices: Record<string, LiveMarketData> = {};
  private listeners: Set<PriceListener> = new Set();
  private isConnected = false;
  private ws: WebSocket | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastFetchTime: number = 0;
  private isInitialized = false;

  private constructor() {
    // Initial fallback baseline prices while fetching
    this.initDefaultPrices();
  }

  public static getInstance(): MarketPriceService {
    if (!MarketPriceService.instance) {
      MarketPriceService.instance = new MarketPriceService();
    }
    return MarketPriceService.instance;
  }

  private initDefaultPrices() {
    const now = new Date().toISOString();
    this.prices = {
      USDT: {
        symbol: 'USDT',
        tickerSymbol: 'USDT',
        name: 'Tether USD',
        nameAr: 'تيثر دولار',
        price: 1.00,
        bidPrice: 0.9999,
        askPrice: 1.0001,
        spread: 0.0002,
        change24h: 0.01,
        change24hAmount: 0.0001,
        high24h: 1.001,
        low24h: 0.999,
        volume24h: 45000000000,
        lastUpdated: now,
        isLive: false,
        source: 'Binance Market Feed'
      },
      BNB: {
        symbol: 'BNB',
        tickerSymbol: 'BNBUSDT',
        name: 'BNB Smart Chain',
        nameAr: 'بي إن بي سمارت شين',
        price: 640.00,
        bidPrice: 639.90,
        askPrice: 640.10,
        spread: 0.20,
        change24h: 2.45,
        change24hAmount: 15.30,
        high24h: 652.00,
        low24h: 628.00,
        volume24h: 980000000,
        lastUpdated: now,
        isLive: false,
        source: 'Binance Market Feed'
      },
      ETH: {
        symbol: 'ETH',
        tickerSymbol: 'ETHUSDT',
        name: 'Ethereum',
        nameAr: 'إيثيريوم',
        price: 3500.00,
        bidPrice: 3499.50,
        askPrice: 3500.50,
        spread: 1.00,
        change24h: -1.15,
        change24hAmount: -40.50,
        high24h: 3580.00,
        low24h: 3420.00,
        volume24h: 15000000000,
        lastUpdated: now,
        isLive: false,
        source: 'Binance Market Feed'
      },
      BTC: {
        symbol: 'BTC',
        tickerSymbol: 'BTCUSDT',
        name: 'Bitcoin',
        nameAr: 'بيتكوين',
        price: 96000.00,
        bidPrice: 95995.00,
        askPrice: 96005.00,
        spread: 10.00,
        change24h: 3.82,
        change24hAmount: 3500.00,
        high24h: 97200.00,
        low24h: 92800.00,
        volume24h: 38000000000,
        lastUpdated: now,
        isLive: false,
        source: 'Binance Market Feed'
      },
      SOL: {
        symbol: 'SOL',
        tickerSymbol: 'SOLUSDT',
        name: 'Solana',
        nameAr: 'سولانا',
        price: 185.00,
        bidPrice: 184.95,
        askPrice: 185.05,
        spread: 0.10,
        change24h: 4.20,
        change24hAmount: 7.45,
        high24h: 192.00,
        low24h: 178.00,
        volume24h: 4200000000,
        lastUpdated: now,
        isLive: false,
        source: 'Binance Market Feed'
      },
      TRX: {
        symbol: 'TRX',
        tickerSymbol: 'TRXUSDT',
        name: 'TRON',
        nameAr: 'ترون',
        price: 0.28,
        bidPrice: 0.2799,
        askPrice: 0.2801,
        spread: 0.0002,
        change24h: 1.10,
        change24hAmount: 0.003,
        high24h: 0.29,
        low24h: 0.27,
        volume24h: 890000000,
        lastUpdated: now,
        isLive: false,
        source: 'Binance Market Feed'
      }
    };
  }

  public start() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Initial REST fetch
    this.fetchLivePrices();

    // 2. Set up recurring REST polling (every 12 seconds)
    this.pollingInterval = setInterval(() => {
      this.fetchLivePrices();
    }, 12000);

    // 3. Try to establish real-time WebSocket connection for live tick-by-tick updates
    this.connectWebSocket();
  }

  public stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isInitialized = false;
  }

  public subscribe(listener: PriceListener): () => void {
    this.listeners.add(listener);
    // Emit current cache immediately
    listener(this.prices, this.isConnected);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public getPrices(): Record<string, LiveMarketData> {
    return { ...this.prices };
  }

  public getPrice(symbol: string): LiveMarketData | undefined {
    return this.prices[symbol.toUpperCase()];
  }

  public isFeedLive(): boolean {
    return this.isConnected;
  }

  public getLastFetchTime(): number {
    return this.lastFetchTime;
  }

  // REST API fetcher with detailed Bid, Ask, Spread, 24h change & volume
  public async fetchLivePrices(): Promise<void> {
    try {
      const symbolsParam = JSON.stringify(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'TRXUSDT']);
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`;
      
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) {
        throw new Error(`Market API returned ${res.status}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) return;

      const nowIso = new Date().toISOString();
      const updated: Record<string, LiveMarketData> = { ...this.prices };

      for (const item of data) {
        const symbolMatch = ASSETS_CONFIG.find(c => c.ticker === item.symbol);
        if (!symbolMatch) continue;

        const lastPrice = parseFloat(item.lastPrice);
        const bidPrice = parseFloat(item.bidPrice) || lastPrice;
        const askPrice = parseFloat(item.askPrice) || lastPrice;
        const spread = Math.max(0, askPrice - bidPrice);
        const changePercent = parseFloat(item.priceChangePercent);
        const changeAmount = parseFloat(item.priceChange);
        const high = parseFloat(item.highPrice);
        const low = parseFloat(item.lowPrice);
        const volume = parseFloat(item.volume);

        updated[symbolMatch.symbol] = {
          symbol: symbolMatch.symbol,
          tickerSymbol: item.symbol,
          name: symbolMatch.name,
          nameAr: symbolMatch.nameAr,
          price: lastPrice,
          bidPrice: Math.round(bidPrice * 10000) / 10000,
          askPrice: Math.round(askPrice * 10000) / 10000,
          spread: Math.round(spread * 10000) / 10000,
          change24h: Math.round(changePercent * 100) / 100,
          change24hAmount: Math.round(changeAmount * 100) / 100,
          high24h: high,
          low24h: low,
          volume24h: volume,
          lastUpdated: nowIso,
          isLive: true,
          source: 'Binance Real-Time Market'
        };
      }

      // Keep USDT fixed at $1.00
      updated['USDT'] = {
        ...updated['USDT'],
        price: 1.00,
        bidPrice: 0.9999,
        askPrice: 1.0001,
        spread: 0.0002,
        lastUpdated: nowIso,
        isLive: true
      };

      this.prices = updated;
      this.isConnected = true;
      this.lastFetchTime = Date.now();
      this.notifyListeners();

      // Opportunistically sync public prices to Firestore
      this.syncPricesToFirestore(updated).catch(() => {});
    } catch (err) {
      console.warn('Live price fetch warning (using last cached):', err);
      // Mark as not connected/stale but preserve last known prices
      this.isConnected = false;
      this.notifyListeners();
    }
  }

  // WebSocket Live Streaming connection
  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const streams = 'btcusdt@ticker/ethusdt@ticker/bnbusdt@ticker/solusdt@ticker/trxusdt@ticker';
      const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyListeners();
      };

      this.ws.onmessage = (event) => {
        try {
          const tick = JSON.parse(event.data);
          if (!tick.s) return;

          const symbolMatch = ASSETS_CONFIG.find(c => c.ticker === tick.s);
          if (!symbolMatch) return;

          const lastPrice = parseFloat(tick.c);
          const bidPrice = parseFloat(tick.b) || lastPrice;
          const askPrice = parseFloat(tick.a) || lastPrice;
          const spread = Math.max(0, askPrice - bidPrice);
          const changePercent = parseFloat(tick.P);
          const changeAmount = parseFloat(tick.p);
          const high = parseFloat(tick.h);
          const low = parseFloat(tick.l);
          const volume = parseFloat(tick.v);
          const nowIso = new Date().toISOString();

          this.prices[symbolMatch.symbol] = {
            ...this.prices[symbolMatch.symbol],
            price: lastPrice,
            bidPrice: Math.round(bidPrice * 10000) / 10000,
            askPrice: Math.round(askPrice * 10000) / 10000,
            spread: Math.round(spread * 10000) / 10000,
            change24h: Math.round(changePercent * 100) / 100,
            change24hAmount: Math.round(changeAmount * 100) / 100,
            high24h: high,
            low24h: low,
            volume24h: volume,
            lastUpdated: nowIso,
            isLive: true,
            source: 'Binance Live WebSocket'
          };

          this.isConnected = true;
          this.lastFetchTime = Date.now();
          this.notifyListeners();
        } catch {
          // ignore parsing error
        }
      };

      this.ws.onerror = () => {
        // Fallback gracefully to REST polling
        this.isConnected = false;
        this.notifyListeners();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Attempt reconnection after 8 seconds
        setTimeout(() => {
          if (this.isInitialized) {
            this.connectWebSocket();
          }
        }, 8000);
      };
    } catch {
      // WebSocket not permitted in certain iframe contexts, fallback to REST
    }
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.prices, this.isConnected);
    }
  }

  private async syncPricesToFirestore(prices: Record<string, LiveMarketData>) {
    try {
      const symbols = Object.keys(prices);
      for (const sym of symbols) {
        const item = prices[sym];
        await setDoc(doc(db, 'marketPrices', sym), {
          ...item,
          updatedAt: item.lastUpdated
        }, { merge: true });
      }
    } catch {
      // Fire-and-forget; client already has latest data
    }
  }
}

export const marketPriceService = MarketPriceService.getInstance();
