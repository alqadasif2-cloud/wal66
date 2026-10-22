import React, { useState, useMemo } from 'react';
import { User, Wallet, CryptoAsset } from '../types/wallet';
import { marketPriceService } from '../services/marketPriceService';
import { WalletDatabase } from '../services/walletDb';
import { formatCurrency, formatCryptoAmount } from '../utils/formatters';
import { 
  X, 
  ArrowUpDown, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Check
} from 'lucide-react';

interface SwapModalProps {
  currentUser: User;
  wallet: Wallet | null;
  isArabic: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SwapModal: React.FC<SwapModalProps> = ({
  currentUser,
  wallet,
  isArabic,
  onClose,
  onSuccess,
}) => {
  const assets: CryptoAsset[] = useMemo(() => {
    if (wallet?.assets && wallet.assets.length > 0) {
      return wallet.assets;
    }
    return [
      { symbol: 'USDT', name: 'Tether USD', nameAr: 'تيثر دولار', balance: 1000, usdPrice: 1, usdValue: 1000, change24h: 0.01, icon: '₮', network: 'BEP20' },
      { symbol: 'BTC', name: 'Bitcoin', nameAr: 'بيتكوين', balance: 0.05, usdPrice: 96000, usdValue: 4800, change24h: 2.5, icon: '₿', network: 'BTC' },
      { symbol: 'ETH', name: 'Ethereum', nameAr: 'إيثيريوم', balance: 0.8, usdPrice: 3500, usdValue: 2800, change24h: 1.8, icon: 'Ξ', network: 'ERC20' },
      { symbol: 'BNB', name: 'BNB Smart Chain', nameAr: 'بي إن بي', balance: 2.5, usdPrice: 640, usdValue: 1600, change24h: 3.2, icon: '◈', network: 'BEP20' },
      { symbol: 'SOL', name: 'Solana', nameAr: 'سولانا', balance: 5, usdPrice: 185, usdValue: 925, change24h: -0.8, icon: '◎', network: 'SOL' },
    ];
  }, [wallet]);

  const [fromSymbol, setFromSymbol] = useState<string>('USDT');
  const [toSymbol, setToSymbol] = useState<string>('BNB');
  const [fromAmountStr, setFromAmountStr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const livePrices = marketPriceService.getPrices();

  const fromAsset = assets.find(a => a.symbol === fromSymbol) || assets[0];
  const toAsset = assets.find(a => a.symbol === toSymbol) || assets[1];

  // Get current USD rate for tokens
  const getPrice = (sym: string): number => {
    if (sym === 'USDT') return 1.0;
    return livePrices[sym]?.price || assets.find(a => a.symbol === sym)?.usdPrice || 1.0;
  };

  const fromPrice = getPrice(fromSymbol);
  const toPrice = getPrice(toSymbol);

  // Rate: how many "toAsset" per 1 "fromAsset"
  const exchangeRate = toPrice > 0 ? fromPrice / toPrice : 0;

  const fromAmount = parseFloat(fromAmountStr) || 0;
  const toAmount = fromAmount * exchangeRate;
  const toAmountFormatted = toAmount > 0 ? (toAmount < 0.0001 ? toAmount.toFixed(6) : toAmount.toFixed(4)) : '0.00';

  const handleFlip = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setFromAmountStr('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleMax = () => {
    if (fromAsset) {
      setFromAmountStr(fromAsset.balance.toString());
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  const handleSwap = () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!fromAmount || isNaN(fromAmount) || fromAmount <= 0) {
      setErrorMsg(isArabic ? 'يرجى إدخال مبلغ صحيح للمبادلة.' : 'Please enter a valid swap amount.');
      return;
    }

    if (fromAmount > (fromAsset?.balance || 0)) {
      setErrorMsg(
        isArabic 
          ? `الرصيد المتاح غير كافٍ. رصيدك الحالي هو ${formatCryptoAmount(fromAsset?.balance || 0)} ${fromSymbol}.` 
          : `Insufficient balance. Available: ${formatCryptoAmount(fromAsset?.balance || 0)} ${fromSymbol}.`
      );
      return;
    }

    if (fromSymbol === toSymbol) {
      setErrorMsg(isArabic ? 'يرجى اختيار عملتين مختلفتين للمبادلة.' : 'Please select two different assets.');
      return;
    }

    setIsSwapping(true);

    setTimeout(() => {
      const res = WalletDatabase.executeSwap({
        userId: currentUser.userId,
        fromSymbol,
        toSymbol,
        fromAmount,
        toAmount,
      });

      setIsSwapping(false);

      if (res.success) {
        setSuccessMsg(
          isArabic 
            ? `تمت المبادلة بنجاح! تم تبديل ${fromAmount} ${fromSymbol} بـ ${toAmountFormatted} ${toSymbol}` 
            : `Swap successful! Exchanged ${fromAmount} ${fromSymbol} for ${toAmountFormatted} ${toSymbol}`
        );

        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.message);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isArabic ? 'تبديل العملات الفوري' : 'Instant Crypto Swap'}
              </h2>
              <span className="text-[11px] text-slate-400">
                {isArabic ? 'أفضل أسعار الصرف الحية ومسارات السيولة المباشرة' : 'Live exchange rates & liquidity routing'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Message Banner */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in zoom-in-95">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-bold block">{successMsg}</span>
              <span className="text-[10px] text-emerald-200/70 block">
                {isArabic ? 'جاري تحديث الأرصدة وإغلاق النافذة...' : 'Updating balances...'}
              </span>
            </div>
          </div>
        )}

        {/* Error Message Banner */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Swap Form */}
        <div className="space-y-3 relative">
          {/* FROM Asset Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex justify-between items-center mb-1.5 text-xs text-slate-400">
              <span>{isArabic ? 'أنت تدفع' : 'You Pay'}</span>
              <span>
                {isArabic ? 'المتاح: ' : 'Balance: '}
                <span className="text-slate-200 font-mono">
                  {formatCryptoAmount(fromAsset?.balance || 0)} {fromSymbol}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                value={fromAmountStr}
                onChange={e => {
                  setFromAmountStr(e.target.value);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl font-extrabold text-white font-mono placeholder-slate-600 focus:outline-none"
              />

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleMax}
                  className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[10px] transition-colors cursor-pointer"
                >
                  MAX
                </button>

                <select
                  value={fromSymbol}
                  onChange={e => {
                    setFromSymbol(e.target.value);
                    setErrorMsg('');
                  }}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl py-1.5 px-3 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {assets.map(a => (
                    <option key={a.symbol} value={a.symbol} className="bg-slate-900">
                      {a.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              ≈ {formatCurrency(fromAmount * fromPrice)}
            </div>
          </div>

          {/* Flip / Invert Button in Center */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleFlip}
              className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-400 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-lg shadow-black/40 cursor-pointer"
              title={isArabic ? 'عكس العملات' : 'Switch tokens'}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* TO Asset Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex justify-between items-center mb-1.5 text-xs text-slate-400">
              <span>{isArabic ? 'أنت تستلم (تقديري)' : 'You Receive (Est.)'}</span>
              <span>
                {isArabic ? 'الرصيد الحالي: ' : 'Current Balance: '}
                <span className="text-slate-200 font-mono">
                  {formatCryptoAmount(toAsset?.balance || 0)} {toSymbol}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {toAmountFormatted}
              </span>

              <select
                value={toSymbol}
                onChange={e => {
                  setToSymbol(e.target.value);
                  setErrorMsg('');
                }}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl py-1.5 px-3 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {assets.map(a => (
                  <option key={a.symbol} value={a.symbol} className="bg-slate-900">
                    {a.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              ≈ {formatCurrency(toAmount * toPrice)}
            </div>
          </div>
        </div>

        {/* Exchange Rate & Fee Info */}
        <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 space-y-1.5 text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>{isArabic ? 'سعر الصرف اللحظي' : 'Live Rate'}</span>
            <span className="font-mono text-slate-200">
              1 {fromSymbol} ≈ {exchangeRate < 0.0001 ? exchangeRate.toFixed(8) : exchangeRate.toFixed(4)} {toSymbol}
            </span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>{isArabic ? 'رسوم الشبكة المقدرة' : 'Est. Network Fee'}</span>
            <span className="font-mono text-emerald-400 font-bold">
              $0.00 (Zero Gas Promo)
            </span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>{isArabic ? 'مسار السيولة' : 'Routing'}</span>
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Trust Smart DEX Router v2
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleSwap}
          disabled={isSwapping || !!successMsg}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg shadow-purple-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSwapping ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{isArabic ? 'جاري تنفيذ المبادلة...' : 'Executing Swap...'}</span>
            </>
          ) : successMsg ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>{isArabic ? 'تمت المبادلة' : 'Swap Completed'}</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 text-white" />
              <span>
                {fromAmount > 0 
                  ? (isArabic ? `مبادلة ${fromAmount} ${fromSymbol} بـ ${toSymbol}` : `Swap ${fromAmount} ${fromSymbol} for ${toSymbol}`)
                  : (isArabic ? 'تبديل العملات الآن' : 'Swap Now')}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
