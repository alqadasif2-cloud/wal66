import React, { useState } from 'react';
import { Transaction } from '../types/wallet';
import { formatCurrency, formatDateTime, shortenAddress } from '../utils/formatters';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  currentUserId: string;
  isArabic: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'sent' | 'received' | 'locked';

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  currentUserId,
  isArabic,
  onClose,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Filter transactions
  const filteredTxs = transactions.filter(tx => {
    const isSender = tx.senderUserId === currentUserId;
    const isReceiver = tx.receiverUserId === currentUserId;

    if (!isSender && !isReceiver) return false;

    if (activeFilter === 'sent' && !isSender) return false;
    if (activeFilter === 'received' && !isReceiver) return false;
    if (activeFilter === 'locked' && tx.status !== 'locked') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRecipient = tx.receiverUsername?.toLowerCase().includes(q) || tx.receiverAddress?.toLowerCase().includes(q);
      const matchSender = tx.senderUsername?.toLowerCase().includes(q) || tx.senderAddress?.toLowerCase().includes(q);
      const matchHash = tx.networkTxHash?.toLowerCase().includes(q);
      const matchId = tx.transactionId?.toLowerCase().includes(q);
      const matchNotes = tx.notes?.toLowerCase().includes(q);
      if (!matchRecipient && !matchSender && !matchHash && !matchId && !matchNotes) {
        return false;
      }
    }

    return true;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {isArabic ? 'سجل المعاملات والنشاط' : 'Activity & Transactions'}
            </h2>
            <p className="text-xs text-slate-400">
              {isArabic ? `${filteredTxs.length} معاملة مسجلة` : `${filteredTxs.length} transactions`}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors"
          title={isArabic ? 'إغلاق' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-900/70 border border-slate-800">
          {(['all', 'sent', 'received', 'locked'] as FilterTab[]).map(tab => {
            const labels: Record<FilterTab, { ar: string; en: string }> = {
              all: { ar: 'الكل', en: 'All' },
              sent: { ar: 'صادر', en: 'Sent' },
              received: { ar: 'وارد', en: 'Received' },
              locked: { ar: 'مقيد', en: 'Locked' },
            };
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {isArabic ? labels[tab].ar : labels[tab].en}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 rtl:right-3.5 rtl:left-auto ltr:left-3.5 ltr:right-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isArabic ? 'بحث بالاسم أو العنوان أو المعرّف...' : 'Search by name, address or hash...'}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-2.5 px-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-3.5 rtl:right-auto ltr:right-3.5 ltr:left-auto text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2.5">
        {filteredTxs.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-slate-900/40 border border-slate-800/60">
            <RefreshCw className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-slate-400">
              {isArabic ? 'لا توجد معاملات مطابقة للبحث' : 'No transactions found'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isArabic ? 'يمكنك استخدام خيارات الإرسال أو الشحن لتنفيذ عمليات' : 'Try sending or receiving funds'}
            </p>
          </div>
        ) : (
          filteredTxs.map(tx => {
            const isSender = tx.senderUserId === currentUserId;
            const isLocked = tx.status === 'locked';
            const isCompleted = tx.status === 'completed';

            return (
              <div
                key={tx.transactionId}
                onClick={() => setSelectedTx(tx)}
                className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700/80 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isLocked
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : isSender
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="w-5 h-5" />
                    ) : isSender ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {isSender
                          ? isArabic
                            ? `تحويل إلى ${tx.receiverUsername || shortenAddress(tx.receiverAddress)}`
                            : `To ${tx.receiverUsername || shortenAddress(tx.receiverAddress)}`
                          : isArabic
                          ? `استلام من ${tx.senderUsername || shortenAddress(tx.senderAddress)}`
                          : `From ${tx.senderUsername || shortenAddress(tx.senderAddress)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatDateTime(tx.createdAt, isArabic)}</span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-semibold tracking-wider text-slate-500">
                        {tx.network || 'BEP20'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-extrabold font-mono-numbers ${
                      isLocked
                        ? 'text-amber-400'
                        : isSender
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {isSender ? '-' : '+'}
                    {formatCurrency(tx.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center justify-end gap-1">
                    {isLocked ? (
                      <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                        <Lock className="w-2.5 h-2.5" />
                        {isArabic ? 'مقيدة مؤقتاً' : 'Locked'}
                      </span>
                    ) : isCompleted ? (
                      <span className="text-emerald-400/90 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {isArabic ? 'مكتملة' : 'Completed'}
                      </span>
                    ) : (
                      <span className="text-slate-400">{tx.status}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {isArabic ? 'تفاصيل المعاملة' : 'Transaction Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2">
              <span className="text-xs text-slate-400 block mb-1">
                {isArabic ? 'المبلغ الإجمالي' : 'Total Amount'}
              </span>
              <span className="text-3xl font-extrabold text-white font-mono-numbers">
                {formatCurrency(selectedTx.amount)}
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                {selectedTx.currency || 'USDT'} ({selectedTx.network || 'BEP20'})
              </span>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isArabic ? 'الحالة' : 'Status'}</span>
                <span className="font-bold text-white">
                  {selectedTx.statusTextAr && isArabic ? selectedTx.statusTextAr : selectedTx.status}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isArabic ? 'التاريخ والوقت' : 'Date & Time'}</span>
                <span className="text-slate-200 font-mono">
                  {formatDateTime(selectedTx.createdAt, isArabic)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isArabic ? 'المرسل' : 'Sender'}</span>
                <span className="text-slate-200 font-medium">
                  {selectedTx.senderUsername} ({shortenAddress(selectedTx.senderAddress)})
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">{isArabic ? 'المستلم' : 'Recipient'}</span>
                <span className="text-slate-200 font-medium">
                  {selectedTx.receiverUsername} ({shortenAddress(selectedTx.receiverAddress)})
                </span>
              </div>

              {selectedTx.lockUntil && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60 text-amber-400">
                  <span>{isArabic ? 'وقت فك التقييد' : 'Unlock Time'}</span>
                  <span className="font-mono">{formatDateTime(selectedTx.lockUntil, isArabic)}</span>
                </div>
              )}

              {selectedTx.notes && (
                <div className="py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 block mb-1">{isArabic ? 'ملاحظات' : 'Notes'}</span>
                  <p className="text-slate-300 text-xs italic">{selectedTx.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">{isArabic ? 'معرف المعاملة' : 'Tx Hash'}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-slate-300">
                    {shortenAddress(selectedTx.networkTxHash || selectedTx.transactionId, 8, 6)}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedTx.networkTxHash || selectedTx.transactionId)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              {isArabic ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
