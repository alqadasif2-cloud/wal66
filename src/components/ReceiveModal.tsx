import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { User, Wallet, Transaction } from '../types/wallet';
import { WalletCloudService } from '../services/walletCloudService';
import { formatCurrency, formatCountdown, shortenAddress } from '../utils/formatters';
import { X, Copy, Check, QrCode, AlertCircle, Clock, ShieldAlert, Share2, Link as LinkIcon, Globe } from 'lucide-react';

interface ReceiveModalProps {
  user: User;
  wallet: Wallet | null;
  lockedTransactions: Transaction[];
  isArabic: boolean;
  onClose: () => void;
}

export const ReceiveModal: React.FC<ReceiveModalProps> = ({
  user,
  wallet,
  lockedTransactions,
  isArabic,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<'BEP20' | 'ERC20' | 'TRC20'>('BEP20');
  const [remainingTimeMap, setRemainingTimeMap] = useState<Record<string, number>>({});

  const address = user.demoAddress;
  const shareableWalletLink = WalletCloudService.getShareableWalletLink(address);

  // Render QR code onto canvas
  useEffect(() => {
    if (canvasRef.current && shareableWalletLink) {
      QRCode.toCanvas(
        canvasRef.current,
        shareableWalletLink,
        {
          width: 180,
          margin: 1.5,
          color: {
            dark: '#070b13',
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error('QR code render error', error);
        }
      );
    }
  }, [shareableWalletLink]);

  // Update countdown timers every second
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const map: Record<string, number> = {};
      lockedTransactions.forEach(tx => {
        if (tx.lockUntil) {
          const exp = new Date(tx.lockUntil).getTime();
          map[tx.transactionId] = Math.max(0, exp - now);
        }
      });
      setRemainingTimeMap(map);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockedTransactions]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableWalletLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `محفظة ${user.displayName || user.username} - TRUST WALLET PRO`,
          text: `رابط استلام الأموال لمحفظة ${user.displayName || user.username}:`,
          url: shareableWalletLink
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0d1424] border border-slate-800 p-6 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                {isArabic ? 'استقبال الأموال والرابط السحابي' : 'Receive Funds & Cloud Link'}
              </h2>
              <span className="text-[11px] text-slate-400">
                {isArabic ? 'متاح لجميع المستخدمين عبر السحابة' : 'Accessible by all cloud users'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Network Selector Tabs */}
        <div className="mt-4 flex items-center justify-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
          {(['BEP20', 'ERC20', 'TRC20'] as const).map((net) => (
            <button
              key={net}
              onClick={() => setSelectedNetwork(net)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedNetwork === net
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {net}
            </button>
          ))}
        </div>

        {/* QR Code Canvas Frame */}
        <div className="mt-5 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl shadow-xl shadow-emerald-500/10">
            <canvas ref={canvasRef} className="rounded-lg block" />
          </div>

          <span className="mt-2 text-xs font-semibold text-slate-300">
            {user.displayName} (@{user.username})
          </span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <Globe className="w-3 h-3" />
            <span>{isArabic ? 'رمز QR يحتوي على رابط المحفظة السحابي' : 'QR contains universal cloud link'}</span>
          </span>
        </div>

        {/* Shareable Cloud Wallet Link Card (Requirement 3) */}
        <div className="mt-4 p-3 rounded-2xl bg-blue-950/40 border border-blue-800/50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-300 uppercase tracking-wider font-bold flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-blue-400" />
              <span>{isArabic ? 'رابط المحفظة السحابي الفريد' : 'Cloud Wallet Link'}</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {isArabic ? 'صالح لكل الأجهزة' : 'Cross-Device'}
            </span>
          </div>

          <div className="text-xs font-mono text-slate-200 truncate select-all bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800" dir="ltr">
            {shareableWalletLink}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleCopyLink}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                copiedLink
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تم نسخ الرابط' : 'Link Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'نسخ رابط المحفظة' : 'Copy Link'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{isArabic ? 'مشاركة' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Address Card & Copy Button */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              {isArabic ? 'عنوان المحفظة (الرمز العام)' : 'Wallet Address'}
            </span>
            <span className="text-xs font-mono text-slate-200 truncate select-all" dir="ltr">
              {address}
            </span>
          </div>

          <button
            onClick={handleCopyAddress}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              copiedAddress
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
          >
            {copiedAddress ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تم النسخ' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{isArabic ? 'نسخ العنوان' : 'Copy Address'}</span>
              </>
            )}
          </button>
        </div>

        {/* Explanatory Notice */}
        <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-emerald-200/90">
            {isArabic
              ? 'ميزة السحابة الحقيقية: يمكنك إرسال هذا الرابط أو العنوان لأي مستخدم آخر على هاتف مختلف، وسيتمكن من إرسال الأموال إليك مباشرة عبر قاعدة البيانات السحابية.'
              : 'Cross-device feature: You can share this link with any user on another device, and they can send funds directly to your cloud wallet.'}
          </p>
        </div>

        {/* Locked funds status section if any */}
        {wallet && wallet.lockedDemoBalance > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{isArabic ? 'حالة المبالغ المقيدة' : 'Time-Locked Funds'}</span>
              </div>
              <span className="text-xs font-bold text-amber-300 font-mono-numbers">
                {formatCurrency(wallet.lockedDemoBalance)}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-2">
              {isArabic 
                ? 'لديك مبالغ مستلمة مقيدة مؤقتاً بواسطة المرسل. ستصبح متاحة تلقائياً عند انتهاء المؤقت.'
                : 'You have incoming funds locked by sender. They will unlock automatically when countdown expires.'}
            </p>

            {/* List active locks */}
            <div className="space-y-2 mt-2">
              {lockedTransactions.map((tx) => {
                const remainingMs = remainingTimeMap[tx.transactionId] || 0;
                return (
                  <div key={tx.transactionId} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">
                        {formatCurrency(tx.amount)} {isArabic ? `من ${tx.senderUsername}` : `from ${tx.senderUsername}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {tx.notes || tx.transactionId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px]">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{formatCountdown(remainingMs)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Close Button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
