import React, { useState, useEffect, useRef } from 'react';
import { User, Wallet } from '../types/wallet';
import { WalletDatabase } from '../services/walletDb';
import { WalletCloudService } from '../services/walletCloudService';
import { formatCurrency, shortenAddress } from '../utils/formatters';
import { X, Send, Lock, AlertCircle, CheckCircle2, UserCheck, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

interface SendModalProps {
  currentUser: User;
  wallet: Wallet | null;
  isArabic: boolean;
  initialRecipient?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const LOCK_DURATIONS = [
  { labelAr: 'دون تقييد', labelEn: 'No Lock', minutes: 0 },
  { labelAr: '5 دقائق', labelEn: '5 min', minutes: 5 },
  { labelAr: '15 دقيقة', labelEn: '15 min', minutes: 15 },
  { labelAr: '30 دقيقة', labelEn: '30 min', minutes: 30 },
  { labelAr: 'ساعة واحدة', labelEn: '1 hour', minutes: 60 },
  { labelAr: '6 ساعات', labelEn: '6 hours', minutes: 360 },
  { labelAr: '12 ساعة', labelEn: '12 hours', minutes: 720 },
  { labelAr: '24 ساعة', labelEn: '24 hours', minutes: 1440 },
  { labelAr: 'مدة مخصصة', labelEn: 'Custom', minutes: -1 }
];

export const SendModal: React.FC<SendModalProps> = ({
  currentUser,
  wallet,
  isArabic,
  initialRecipient = '',
  onClose,
  onSuccess
}) => {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [amountStr, setAmountStr] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState<string>('45');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Cloud Recipient Lookup State
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);
  const [verifiedRecipient, setVerifiedRecipient] = useState<User | null>(null);
  const [isCloudVerified, setIsCloudVerified] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const availableBalance = wallet?.availableDemoBalance ?? 0;
  const lookupDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced Cloud Recipient Lookup
  useEffect(() => {
    const raw = recipient.trim();
    if (!raw) {
      setVerifiedRecipient(null);
      setIsCloudVerified(false);
      setLookupError(null);
      setIsSearchingRecipient(false);
      return;
    }

    if (lookupDebounceTimer.current) {
      clearTimeout(lookupDebounceTimer.current);
    }

    setIsSearchingRecipient(true);
    setLookupError(null);

    lookupDebounceTimer.current = setTimeout(async () => {
      try {
        const res = await WalletDatabase.lookupRecipientCloud(raw);
        if (res.found && res.user) {
          if (res.user.userId === currentUser.userId || res.user.demoAddress.toLowerCase() === currentUser.demoAddress.toLowerCase()) {
            setVerifiedRecipient(null);
            setLookupError(isArabic ? 'تنبيه: هذا عنوان محفظتك الخاصة، لا يمكنك إرسال الأموال لنفسك' : 'Cannot send funds to your own wallet');
          } else {
            setVerifiedRecipient(res.user);
            setIsCloudVerified(res.isCloudVerified);
            setLookupError(null);
          }
        } else {
          setVerifiedRecipient(null);
          setIsCloudVerified(false);
          setLookupError(isArabic ? 'لم يتم العثور على صاحب هذا الرابط أو العنوان في قاعدة البيانات السحابية' : 'Recipient not found in cloud database');
        }
      } catch {
        setVerifiedRecipient(null);
        setLookupError(isArabic ? 'تعذر التحقق من المستلم سحابياً حالياً' : 'Could not verify recipient');
      } finally {
        setIsSearchingRecipient(false);
      }
    }, 350);

    return () => {
      if (lookupDebounceTimer.current) {
        clearTimeout(lookupDebounceTimer.current);
      }
    };
  }, [recipient, currentUser, isArabic]);

  const handleSetMax = () => {
    setAmountStr(availableBalance.toString());
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg(isArabic ? 'يرجى إدخال مبلغ صحيح أكبر من 0' : 'Please enter a valid amount');
      return;
    }

    if (amount > availableBalance) {
      setErrorMsg(
        isArabic
          ? `المبلغ يتجاوز الرصيد المتاح ($${availableBalance.toFixed(2)}). الرصيد المقيد لا يمكن إرساله.`
          : `Amount exceeds available balance ($${availableBalance.toFixed(2)}).`
      );
      return;
    }

    if (!recipient.trim()) {
      setErrorMsg(isArabic ? 'يرجى تحديد رابط المحفظة أو اسم المستلم' : 'Please specify a recipient');
      return;
    }

    if (lookupError) {
      setErrorMsg(lookupError);
      return;
    }

    let finalLockMinutes = selectedDuration;
    if (selectedDuration === -1) {
      const parsedCustom = parseInt(customMinutes, 10);
      if (isNaN(parsedCustom) || parsedCustom <= 0) {
        setErrorMsg(isArabic ? 'يرجى إدخال مدة تقييد مخصصة صحيحة بالدقائق' : 'Please enter valid custom minutes');
        return;
      }
      finalLockMinutes = parsedCustom;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = `tx_${currentUser.userId}_${Date.now()}_${amount}`;
      const res = await WalletDatabase.executeSendTransferAsync({
        senderUserId: currentUser.userId,
        recipientIdentifier: recipient.trim(),
        amount,
        lockDurationMinutes: finalLockMinutes,
        notes: notes.trim(),
        idempotencyKey
      });

      if (!res.success) {
        setErrorMsg(res.message);
        setIsSubmitting(false);
        return;
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || (isArabic ? 'حدث خطأ أثناء تنفيذ التحويل' : 'Transfer error'));
      setIsSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(amountStr) || 0;
  const remainingAfterTransfer = Math.max(0, availableBalance - parsedAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0d1424] border border-slate-800 p-6 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              {isArabic ? 'إرسال أموال سحابي' : 'Send Funds (Cloud)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Recipient Input (Supports Address, Link, or Username) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>{isArabic ? 'رابط المحفظة، العنوان أو اسم المستلم' : 'Wallet Link, Address or Username'}</span>
              </label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setRecipient(text.trim());
                  } catch {
                    // Ignore
                  }
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                {isArabic ? 'لصق' : 'Paste'}
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={isArabic ? 'ألصق رابط المحفظة https://... أو العنوان 0x...' : 'Paste wallet link https://... or address 0x...'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-white placeholder-slate-500 outline-none transition-colors font-mono text-xs pr-9"
                dir="ltr"
              />
              {isSearchingRecipient && (
                <div className="absolute left-3 top-2.5 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>

            {/* Recipient Real-time Cloud Verification Card */}
            {verifiedRecipient && (
              <div className="mt-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 animate-in fade-in flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {verifiedRecipient.displayName?.charAt(0).toUpperCase() || verifiedRecipient.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs font-bold text-white truncate flex items-center gap-1">
                      {verifiedRecipient.displayName || verifiedRecipient.username}
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                      {shortenAddress(verifiedRecipient.demoAddress, 8, 6)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isCloudVerified ? (isArabic ? 'سحابي موثق' : 'Cloud Verified') : (isArabic ? 'محفظة معتمدة' : 'Verified')}</span>
                </div>
              </div>
            )}

            {/* Recipient Lookup Error */}
            {lookupError && !isSearchingRecipient && recipient.trim() && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}
          </div>

          {/* Amount Input with Max Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {isArabic ? 'المبلغ المراد إرساله ($)' : 'Amount ($)'}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  {isArabic ? 'المتاح:' : 'Available:'}{' '}
                  <span className="font-bold text-emerald-400 font-mono-numbers">
                    {formatCurrency(availableBalance)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20"
                >
                  {isArabic ? 'الحد الأقصى' : 'MAX'}
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base font-bold text-white placeholder-slate-600 outline-none font-mono-numbers"
              />
              <span className="absolute left-3 top-3 text-xs font-bold text-slate-400 font-mono">
                USD
              </span>
            </div>
          </div>

          {/* Time Lock Feature (مدة تقييد المبلغ) */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-bold text-slate-200">
                {isArabic ? 'مدة تقييد المبلغ (اختياري)' : 'Lock Duration (Optional)'}
              </label>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-2.5">
              {isArabic
                ? 'عند تفعيل التقييد، يظهر المبلغ في رصيد المستلم الإجمالي ولكنه لا يستطيع إعادة إرساله حتى انتهاء المدة.'
                : 'Locked funds appear in recipient total balance but cannot be re-sent until timer expires.'}
            </p>

            {/* Duration pill buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {LOCK_DURATIONS.map((dur) => (
                <button
                  key={dur.minutes}
                  type="button"
                  onClick={() => setSelectedDuration(dur.minutes)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-xl border transition-all ${
                    selectedDuration === dur.minutes
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {isArabic ? dur.labelAr : dur.labelEn}
                </button>
              ))}
            </div>

            {/* Custom Minutes Input */}
            {selectedDuration === -1 && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="30"
                  className="w-24 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none font-mono"
                />
                <span className="text-xs text-slate-400">
                  {isArabic ? 'دقيقة (التحقق من الخادم)' : 'Minutes'}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              {isArabic ? 'ملاحظات إضافية (اختياري)' : 'Notes (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isArabic ? 'ملاحظات المعاملة' : 'Transaction notes'}
              className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Pre-Confirmation Summary Card */}
          {verifiedRecipient && parsedAmount > 0 && (
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>{isArabic ? 'المستلم المؤكد:' : 'Recipient:'}</span>
                <span className="font-bold text-white">{verifiedRecipient.displayName || verifiedRecipient.username}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isArabic ? 'المبلغ الصافي:' : 'Amount:'}</span>
                <span className="font-bold text-emerald-400 font-mono-numbers">{formatCurrency(parsedAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>{isArabic ? 'رصيدك المتبقي بعد التحويل:' : 'Balance After:'}</span>
                <span className="font-mono-numbers">{formatCurrency(remainingAfterTransfer)}</span>
              </div>
              {selectedDuration !== 0 && (
                <div className="flex items-center justify-between text-amber-300 text-[11px] pt-1 border-t border-slate-800">
                  <span>{isArabic ? 'حالة التقييد:' : 'Locking:'}</span>
                  <span className="font-bold">{isArabic ? `مقيد لمدة ${selectedDuration === -1 ? customMinutes : selectedDuration} دقيقة` : 'Locked'}</span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !recipient.trim() || !!lookupError || isSearchingRecipient}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isArabic ? 'جاري التحقق والخصم السحابي الذري...' : 'Processing Cloud Transfer...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isArabic ? 'تأكيد الإرسال الفوري' : 'Confirm & Send'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
