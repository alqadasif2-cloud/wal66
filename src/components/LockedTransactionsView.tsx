import React, { useEffect, useState } from 'react';
import { Transaction } from '../types/wallet';
import { formatCurrency, formatCountdown, formatDateTime } from '../utils/formatters';
import { Lock, Clock, ShieldCheck, AlertCircle, X, Sparkles } from 'lucide-react';

interface LockedTransactionsViewProps {
  transactions: Transaction[];
  isArabic: boolean;
  onClose?: () => void;
  onRefresh: () => void;
}

export const LockedTransactionsView: React.FC<LockedTransactionsViewProps> = ({
  transactions,
  isArabic,
  onClose,
  onRefresh
}) => {
  const [remainingMap, setRemainingMap] = useState<Record<string, number>>({});

  const lockedTxs = transactions.filter(t => t.status === 'locked' && t.lockUntil);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const map: Record<string, number> = {};
      let anyExpired = false;

      lockedTxs.forEach(tx => {
        if (tx.lockUntil) {
          const exp = new Date(tx.lockUntil).getTime();
          const diff = exp - now;
          if (diff <= 0) {
            anyExpired = true;
          }
          map[tx.transactionId] = Math.max(0, diff);
        }
      });

      setRemainingMap(map);

      // If any expired, trigger refresh to unlock funds atomically
      if (anyExpired) {
        onRefresh();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockedTxs, onRefresh]);

  const totalLockedAmount = lockedTxs.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-5">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              {isArabic ? 'المعاملات المقيدة مؤقتاً' : 'Time-Locked Transfers'}
            </h2>
            <span className="text-[11px] text-slate-400">
              {lockedTxs.length} {isArabic ? 'معاملات قيد الانتظار' : 'pending locks'}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Overview Stat Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 mb-4 flex items-center justify-between">
        <div>
          <span className="text-xs text-amber-300/80 block">
            {isArabic ? 'إجمالي الرصيد المقيد حالياً' : 'Total Locked Balance'}
          </span>
          <span className="text-2xl font-extrabold text-amber-400 font-mono-numbers">
            {formatCurrency(totalLockedAmount)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">
            {isArabic ? 'حالة التحرير' : 'Unlock Status'}
          </span>
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-end">
            <Sparkles className="w-3 h-3" />
            {isArabic ? 'تلقائي فوري' : 'Instant Auto'}
          </span>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 mb-4 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-300 leading-relaxed">
          {isArabic
            ? 'نظام التقييد الزمني: يتم حظر المبلغ المحدد من قبل المرسل ويظهر في رصيدك الإجمالي، ويصبح متاحاً تلقائياً فور انتهاء المؤقت.'
            : 'Time-Lock System: Funds are locked by the sender and will automatically transition to available balance when the countdown reaches zero.'}
        </p>
      </div>

      {/* List of Locked Transactions */}
      {lockedTxs.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-2 text-slate-500">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {isArabic ? 'لا توجد مبالغ مقيدة حالياً في محفظتك.' : 'No active locks at this moment.'}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {isArabic ? 'جميع مبالغك متاحة بالكامل للتصرف.' : 'All funds are fully available for transfer.'}
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {lockedTxs.map((tx) => {
            const remaining = remainingMap[tx.transactionId] || 0;
            return (
              <div
                key={tx.transactionId}
                className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/20 hover:border-amber-500/40 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white font-mono-numbers">
                      +{formatCurrency(tx.amount)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {isArabic ? 'مقيد' : 'Locked'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>{formatCountdown(remaining)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <div>
                    <span>{isArabic ? 'المرسل:' : 'Sender:'} </span>
                    <span className="text-slate-200 font-semibold">{tx.senderUsername}</span>
                  </div>

                  <div className="text-right">
                    <span>{isArabic ? 'وقت التحرير:' : 'Unlock Time:'} </span>
                    <span className="text-slate-200 font-mono">
                      {tx.lockUntil ? formatDateTime(tx.lockUntil, isArabic) : '-'}
                    </span>
                  </div>
                </div>

                {tx.notes && (
                  <p className="text-[11px] text-slate-400 italic">
                    {tx.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
