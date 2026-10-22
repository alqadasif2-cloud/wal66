import React from 'react';
import { Wallet } from '../types/wallet';
import { formatCurrency, formatCountdown } from '../utils/formatters';
import { ArrowUpRight, ArrowDownLeft, Clock, Lock, ArrowDownUp, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

interface BalanceCardProps {
  wallet: Wallet | null;
  isArabic: boolean;
  nextLockRemainingMs?: number;
  isFeedLive?: boolean;
  onOpenSend: () => void;
  onOpenReceive: () => void;
  onOpenDeposit: () => void;
  onOpenSwap: () => void;
  onOpenLocked: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  wallet,
  isArabic,
  nextLockRemainingMs = 0,
  isFeedLive = true,
  onOpenSend,
  onOpenReceive,
  onOpenDeposit,
  onOpenSwap,
  onOpenLocked
}) => {
  const totalBalance = wallet?.totalDemoBalance ?? 0;
  const availableBalance = wallet?.availableDemoBalance ?? 0;
  const lockedBalance = wallet?.lockedDemoBalance ?? 0;

  // Real-time calculation of portfolio 24h performance based on live asset changes
  const changeAmount = wallet?.assets?.reduce((sum, a) => {
    return sum + (a.usdValue * (a.change24h / 100));
  }, 0) ?? 0;
  const changePercent = totalBalance > 0 ? (changeAmount / totalBalance) * 100 : 0;
  const isPositive = changeAmount >= 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-[#0d1627] to-[#09101d] border border-slate-800/90 p-5 sm:p-6 shadow-2xl shadow-blue-950/30 text-center">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-16 w-64 h-32 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Label with Live indicator */}
      <div className="relative flex items-center justify-center gap-2 mb-1">
        <span className="text-xs font-semibold text-slate-400">
          {isArabic ? 'إجمالي رصيد المحفظة' : 'Total Balance'}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isFeedLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
          <span>{isFeedLive ? 'Binance Live' : 'BEP20'}</span>
        </span>
      </div>

      {/* Big Number */}
      <div className="relative mb-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono-numbers">
          {formatCurrency(totalBalance)}
        </h1>
        <div className={`mt-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold ${
          isPositive ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          <span className="flex items-center gap-0.5">
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isPositive ? '+' : ''}{formatCurrency(changeAmount)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </span>
          <span className="text-slate-400 font-normal">{isArabic ? 'خلال 24 ساعة' : '24h'}</span>
        </div>
      </div>

      {/* Breakdown: Available vs Locked */}
      <div className="relative mt-4 mb-6 grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-850">
        <div className="flex flex-col items-center">
          <span className="text-[11px] text-slate-400">
            {isArabic ? 'الرصيد المتاح' : 'Available'}
          </span>
          <span className="text-sm font-bold text-emerald-400 font-mono-numbers">
            {formatCurrency(availableBalance)}
          </span>
        </div>

        <div 
          onClick={lockedBalance > 0 ? onOpenLocked : undefined}
          className={`flex flex-col items-center ${lockedBalance > 0 ? 'cursor-pointer hover:bg-slate-900/60 rounded-xl transition-colors' : ''}`}
        >
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400">
              {isArabic ? 'الرصيد المقيد' : 'Time-Locked'}
            </span>
            {lockedBalance > 0 && (
              <Lock className="w-3 h-3 text-amber-400 animate-pulse" />
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold font-mono-numbers ${lockedBalance > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {formatCurrency(lockedBalance)}
            </span>

            {lockedBalance > 0 && nextLockRemainingMs > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center gap-1 border border-amber-500/30">
                <Clock className="w-2.5 h-2.5" />
                {formatCountdown(nextLockRemainingMs)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Trust Wallet Iconic 5 Circular Action Buttons */}
      <div className="relative flex items-center justify-between sm:justify-around max-w-md mx-auto pt-1">
        {/* Send */}
        <button
          onClick={onOpenSend}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-active:scale-95 transition-all">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
            {isArabic ? 'إرسال' : 'Send'}
          </span>
        </button>

        {/* Receive */}
        <button
          onClick={onOpenReceive}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-active:scale-95 transition-all">
            <ArrowDownLeft className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
            {isArabic ? 'استقبال' : 'Receive'}
          </span>
        </button>

        {/* Buy / Deposit */}
        <button
          onClick={onOpenDeposit}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700/80 shadow-md group-active:scale-95 transition-all">
            <CreditCard className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
            {isArabic ? 'شراء' : 'Buy'}
          </span>
        </button>

        {/* Swap */}
        <button
          onClick={onOpenSwap}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700/80 shadow-md group-active:scale-95 transition-all">
            <ArrowDownUp className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-xs font-semibold text-slate-200 group-hover:text-purple-400 transition-colors">
            {isArabic ? 'تبديل' : 'Swap'}
          </span>
        </button>

        {/* Locked */}
        <button
          onClick={onOpenLocked}
          className="flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-md group-active:scale-95 transition-all ${
            lockedBalance > 0
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700/80 text-slate-300'
          }`}>
            <Lock className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
            {isArabic ? 'المقيد' : 'Locked'}
          </span>
        </button>
      </div>
    </div>
  );
};
