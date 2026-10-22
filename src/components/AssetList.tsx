import React, { useState } from 'react';
import { CryptoAsset } from '../types/wallet';
import { formatCurrency, formatCryptoAmount } from '../utils/formatters';
import { TrendingUp, TrendingDown, SlidersHorizontal, Plus, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface AssetListProps {
  assets: CryptoAsset[];
  isArabic: boolean;
  isFeedLive?: boolean;
  lastUpdatedText?: string;
  onSelectAsset?: (asset: CryptoAsset) => void;
}

export const AssetList: React.FC<AssetListProps> = ({ 
  assets, 
  isArabic, 
  isFeedLive = true,
  lastUpdatedText,
  onSelectAsset 
}) => {
  const [activeTab, setActiveTab] = useState<'crypto' | 'nfts'>('crypto');
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  // Realistic token icons matching official Trust Wallet coin badges
  const renderTokenIcon = (symbol: string) => {
    switch (symbol) {
      case 'USDT':
        return (
          <div className="w-10 h-10 rounded-full bg-[#26A17B] flex items-center justify-center font-black text-white text-base shadow-md shadow-emerald-950/40 shrink-0">
            ₮
          </div>
        );
      case 'BNB':
        return (
          <div className="w-10 h-10 rounded-full bg-[#F3BA2F] flex items-center justify-center font-black text-slate-950 text-xs shadow-md shadow-amber-950/40 shrink-0">
            BNB
          </div>
        );
      case 'ETH':
        return (
          <div className="w-10 h-10 rounded-full bg-[#627EEA] flex items-center justify-center font-black text-white text-sm shadow-md shadow-indigo-950/40 shrink-0">
            Ξ
          </div>
        );
      case 'BTC':
        return (
          <div className="w-10 h-10 rounded-full bg-[#F7931A] flex items-center justify-center font-black text-white text-base shadow-md shadow-orange-950/40 shrink-0">
            ₿
          </div>
        );
      case 'SOL':
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#9945FF] to-[#14F195] flex items-center justify-center font-black text-white text-xs shadow-md shrink-0">
            SOL
          </div>
        );
      case 'TRX':
        return (
          <div className="w-10 h-10 rounded-full bg-[#EF0027] flex items-center justify-center font-black text-white text-xs shadow-md shrink-0">
            TRX
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-md shrink-0">
            {symbol.substring(0, 3)}
          </div>
        );
    }
  };

  const toggleExpand = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setExpandedSymbol(prev => prev === symbol ? null : symbol);
  };

  return (
    <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-4 sm:p-5">
      {/* Live Market Bar Header */}
      <div className="flex items-center justify-between px-1 mb-3 pb-2.5 border-b border-slate-800/60 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isFeedLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-bold text-slate-200">
              {isFeedLive 
                ? (isArabic ? 'أسعار السوق المباشرة (Live)' : 'Live Market Feed') 
                : (isArabic ? 'آخر سعر محفوظ (مؤقت)' : 'Cached Market Data')}
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
            Binance Real-Time
          </span>
        </div>

        {lastUpdatedText && (
          <span className="text-[10px] text-slate-500 font-mono">
            {lastUpdatedText}
          </span>
        )}
      </div>

      {/* Trust Wallet Tabs: Crypto vs NFTs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('crypto')}
            className={`text-xs sm:text-sm font-bold pb-1 transition-colors relative cursor-pointer ${
              activeTab === 'crypto'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{isArabic ? 'العملات الرقمية والأصول' : 'Crypto Assets'}</span>
            {activeTab === 'crypto' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('nfts')}
            className={`text-xs sm:text-sm font-bold pb-1 transition-colors relative cursor-pointer ${
              activeTab === 'nfts'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{isArabic ? 'الرموز غير القابلة للاستبدال' : 'NFTs'}</span>
            {activeTab === 'nfts' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        <button 
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={isArabic ? 'إدارة العملات' : 'Manage Tokens'}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {activeTab === 'crypto' ? (
        <div className="divide-y divide-slate-800/50">
          {assets.map((asset) => {
            const isPositive = asset.change24h >= 0;
            const isExpanded = expandedSymbol === asset.symbol;

            return (
              <div
                key={asset.symbol}
                className="py-3 px-2 rounded-2xl hover:bg-slate-800/50 transition-colors group cursor-pointer"
                onClick={() => onSelectAsset && onSelectAsset(asset)}
              >
                <div className="flex items-center justify-between">
                  {/* Left: Icon, Name, Network & Live Unit Price */}
                  <div className="flex items-center gap-3 min-w-0">
                    {renderTokenIcon(asset.symbol)}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                          {asset.symbol}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                          {asset.network}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="truncate max-w-[100px] sm:max-w-[140px]">
                          {isArabic ? asset.nameAr : asset.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-300 font-semibold">
                          ${asset.usdPrice >= 1 ? asset.usdPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : asset.usdPrice.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Balance, Value & 24h change */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-sm font-bold text-slate-100 font-mono-numbers">
                        {formatCryptoAmount(asset.balance, asset.symbol)}
                      </span>
                      
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 font-mono-numbers">
                          {formatCurrency(asset.usdValue)}
                        </span>
                        
                        <span className={`inline-flex items-center gap-0.5 font-semibold text-[11px] font-mono ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => toggleExpand(e, asset.symbol)}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                      title={isArabic ? 'بيانات السوق التفصيلية' : 'Market Details'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Live Order Book & 24h Statistics */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-950/40 p-2.5 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-slate-500">{isArabic ? 'سعر الشراء (Bid)' : 'Bid Price'}</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ${asset.bidPrice ? asset.bidPrice.toLocaleString() : asset.usdPrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-slate-500">{isArabic ? 'سعر البيع (Ask)' : 'Ask Price'}</span>
                      <span className="font-mono font-bold text-rose-400">
                        ${asset.askPrice ? asset.askPrice.toLocaleString() : asset.usdPrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-slate-500">{isArabic ? 'الفارق (Spread)' : 'Spread'}</span>
                      <span className="font-mono font-bold text-slate-300">
                        ${asset.spread !== undefined ? asset.spread.toFixed(4) : '0.0000'}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-slate-500">{isArabic ? 'أعلى / أدنى 24ساعة' : '24h High/Low'}</span>
                      <span className="font-mono text-slate-400 text-[10px]">
                        {asset.high24h ? `$${asset.high24h.toLocaleString()}` : '-'} / {asset.low24h ? `$${asset.low24h.toLocaleString()}` : '-'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Manage crypto tokens button at bottom */}
          <div className="pt-3 text-center">
            <button
              onClick={() => onSelectAsset && assets[0] && onSelectAsset(assets[0])}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 py-1.5 px-3 rounded-xl hover:bg-blue-500/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إدارة العملات الرقمية' : 'Manage Crypto'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-bold text-slate-300">
            {isArabic ? 'لا توجد رموز NFTs حتى الآن' : 'No NFTs yet'}
          </h4>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            {isArabic 
              ? 'يمكنك استقبال أصولك الرقمية ومجموعات الـ NFT الخاصة بك عبر عنوان المحفظة.' 
              : 'You can receive and view your digital collectibles via your wallet address.'}
          </p>
        </div>
      )}
    </div>
  );
};
