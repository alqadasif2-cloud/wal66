import React, { useState } from 'react';
import { User } from '../types/wallet';
import { WalletDatabase } from '../services/walletDb';
import { CreditCard, X, CheckCircle2, Loader2, ShieldCheck, ArrowRight, Wallet as WalletIcon } from 'lucide-react';

interface FaucetModalProps {
  currentUser: User;
  isArabic: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FaucetModal: React.FC<FaucetModalProps> = ({
  currentUser,
  isArabic,
  onClose,
  onSuccess,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'crypto'>('card');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAmount <= 0 || isProcessing) return;

    setIsProcessing(true);
    setSuccessMessage('');

    // Simulate instant secure fiat-to-crypto gateway confirmation
    setTimeout(() => {
      const res = WalletDatabase.depositFunds({
        userId: currentUser.userId,
        amount: selectedAmount,
        currency: 'USDT'
      });

      setIsProcessing(false);

      if (res.success) {
        setSuccessMessage(
          isArabic 
            ? `تمت عملية الشراء بنجاح! تمت إضافة $${selectedAmount} (USDT) إلى محفظتك.` 
            : `Purchase successful! $${selectedAmount} (USDT) credited to your wallet.`
        );

        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0b111e] border border-cyan-500/30 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isArabic ? 'شراء العملات الرقمية' : 'Buy Crypto'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isArabic ? 'شراء فوري عبر البطاقة البنكية أو الدفع السريع' : 'Instant purchase via card or quick pay'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {successMessage ? (
          <div className="my-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex flex-col items-center justify-center text-center gap-2 animate-in zoom-in-95">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <span className="font-bold text-sm">{successMessage}</span>
            <span className="text-[11px] text-emerald-200/70">
              {isArabic ? 'جاري تحديث الرصيد وإغلاق النافذة...' : 'Updating balance and closing...'}
            </span>
          </div>
        ) : (
          <form onSubmit={handleBuy} className="space-y-4 my-3">
            {/* Amount Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                {isArabic ? 'حدد المبلغ المطلوب شراؤه:' : 'Select Purchase Amount:'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(amt)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedAmount === amt
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-500/20 scale-[1.02]'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">
                  {isArabic ? 'المبلغ المستلم التقديري' : 'Estimated Crypto Received'}
                </span>
                <span className="text-xl font-black text-white font-mono">
                  {selectedAmount.toFixed(2)} <span className="text-cyan-400 text-sm font-sans">USDT</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold">
                  {isArabic ? 'بدون رسوم إضافية' : 'Zero Extra Fee'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  1 USD ≈ 1.00 USDT
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                {isArabic ? 'طريقة الدفع:' : 'Payment Method:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-cyan-500/80 bg-cyan-950/30 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                  <span className="text-[11px] font-bold block">Visa/Master</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'apple_pay'
                      ? 'border-cyan-500/80 bg-cyan-950/30 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <WalletIcon className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                  <span className="text-[11px] font-bold block">Apple/Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'crypto'
                      ? 'border-cyan-500/80 bg-cyan-950/30 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <span className="text-[11px] font-bold block">Crypto Pay</span>
                </button>
              </div>
            </div>

            {/* Guarantee note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{isArabic ? 'معاملة آمنة ومحمية بشهادة تشفير SSL 256-bit' : 'Secure & encrypted 256-bit SSL transaction'}</span>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{isArabic ? 'جاري معالجة الشراء...' : 'Processing Purchase...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {isArabic ? `شراء $${selectedAmount} (USDT) الآن` : `Buy $${selectedAmount} (USDT) Now`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
