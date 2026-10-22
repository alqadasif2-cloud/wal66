import React, { useState } from 'react';
import { User, Wallet } from '../types/wallet';
import { formatCurrency, shortenAddress } from '../utils/formatters';
import { 
  User as UserIcon, 
  Wallet as WalletIcon, 
  Shield, 
  Globe, 
  Bell, 
  LogOut, 
  Copy, 
  Check, 
  ShieldAlert, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Smartphone,
  Lock,
  KeyRound,
  FileText
} from 'lucide-react';
import { WalletDatabase } from '../services/walletDb';

interface SettingsViewProps {
  currentUser: User | null;
  wallet: Wallet | null;
  isArabic: boolean;
  onToggleLanguage: () => void;
  onOpenWalletSwitcher: () => void;
  onOpenAdmin: () => void;
  onOpenReceive: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  wallet,
  isArabic,
  onToggleLanguage,
  onOpenWalletSwitcher,
  onOpenAdmin,
  onOpenReceive,
  onLogout,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showSecurityPhrase, setShowSecurityPhrase] = useState(false);
  const [notificationTestStatus, setNotificationTestStatus] = useState<string | null>(null);

  const Chevron = isArabic ? ChevronLeft : ChevronRight;

  const handleCopyAddress = () => {
    if (!wallet?.demoAddress) return;
    navigator.clipboard.writeText(wallet.demoAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleTestNotification = async () => {
    try {
      const granted = await WalletDatabase.requestNotificationPermission();
      if (granted) {
        WalletDatabase.sendSystemNotification(
          isArabic ? 'إشعار تجريبي من المحفظة' : 'Wallet Test Notification',
          isArabic ? 'نظام الإشعارات المباشرة يعمل بنجاح!' : 'Push notifications are working properly!'
        );
        setNotificationTestStatus(isArabic ? 'تم إرسال الإشعار بنجاح!' : 'Notification sent!');
      } else {
        setNotificationTestStatus(isArabic ? 'تم رفض إذن الإشعارات' : 'Permission denied');
      }
    } catch {
      setNotificationTestStatus(isArabic ? 'تعذر إرسال الإشعار' : 'Failed to send');
    }
    setTimeout(() => setNotificationTestStatus(null), 3000);
  };

  // Simulated 12-word recovery phrase for demo wallet security inspection
  const demoSeedPhrase = [
    'ocean', 'crystal', 'venture', 'glory', 'silver', 'shield', 
    'falcon', 'planet', 'harvest', 'matrix', 'beacon', 'trust'
  ];

  const isOwner = WalletDatabase.isAuthorizedOwner(currentUser);

  return (
    <div className="space-y-4">
      {/* Account Profile Card */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-extrabold text-xl shadow-lg shadow-emerald-500/20">
            {currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.username?.charAt(0).toUpperCase() || 'W'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white truncate">
                {currentUser?.displayName || currentUser?.username || (isArabic ? 'محفظة رئيسية' : 'Main Wallet')}
              </h2>
              {isOwner && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                  {isArabic ? 'مالك النظام' : 'Owner'}
                </span>
              )}
            </div>
            
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              @{currentUser?.username || 'wallet'}
            </p>

            <button
              onClick={handleCopyAddress}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-[11px] text-slate-300 font-mono border border-slate-700/60 transition-colors"
            >
              <span>{shortenAddress(wallet?.demoAddress || '', 8, 6)}</span>
              {copiedAddress ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Balance Snapshot */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[11px] text-slate-400 block mb-0.5">
              {isArabic ? 'الرصيد المتاح' : 'Available Balance'}
            </span>
            <span className="text-base font-extrabold text-emerald-400 font-mono-numbers">
              {formatCurrency(wallet?.availableDemoBalance ?? 0)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[11px] text-slate-400 block mb-0.5">
              {isArabic ? 'الرصيد المقيد' : 'Locked Balance'}
            </span>
            <span className="text-base font-extrabold text-amber-400 font-mono-numbers">
              {formatCurrency(wallet?.lockedDemoBalance ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Quick Action (Only for Verified Owner) */}
      {isOwner && (
        <button
          onClick={onOpenAdmin}
          className="w-full p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 hover:border-amber-500/50 flex items-center justify-between text-start transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-300">
                {isArabic ? 'لوحة تحكم المالك والإدارة' : 'Owner Admin Dashboard'}
              </h3>
              <p className="text-xs text-amber-200/70">
                {isArabic ? 'تعديل الأرصدة، فك التقييد، وإدارة الحسابات' : 'Adjust balances, override locks & manage users'}
              </p>
            </div>
          </div>
          <Chevron className="w-5 h-5 text-amber-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
        </button>
      )}

      {/* Main Settings Group */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 divide-y divide-slate-800/80 overflow-hidden">
        {/* Switch & Manage Wallets (Strictly for Verified Owner only) */}
        {isOwner && (
          <button
            onClick={onOpenWalletSwitcher}
            className="w-full p-4 hover:bg-slate-800/40 flex items-center justify-between text-start transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <WalletIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  {isArabic ? 'تبديل وإدارة المحافظ' : 'Switch & Manage Wallets'}
                </span>
                <span className="text-xs text-slate-400">
                  {isArabic ? 'إدارة محافظ وحسابات النظام للمالك' : 'Manage system wallets'}
                </span>
              </div>
            </div>
            <Chevron className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        )}

        {/* Language Toggle */}
        <button
          onClick={onToggleLanguage}
          className="w-full p-4 hover:bg-slate-800/40 flex items-center justify-between text-start transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {isArabic ? 'لغة الواجهة' : 'Language'}
              </span>
              <span className="text-xs text-slate-400">
                {isArabic ? 'العربية (الحالية)' : 'English (Current)'}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
            {isArabic ? 'English' : 'العربية'}
          </span>
        </button>

        {/* Security & Backup Phrase */}
        <button
          onClick={() => setShowSecurityPhrase(!showSecurityPhrase)}
          className="w-full p-4 hover:bg-slate-800/40 flex items-center justify-between text-start transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {isArabic ? 'عبارة الاسترداد والأمان' : 'Secret Recovery Phrase'}
              </span>
              <span className="text-xs text-slate-400">
                {isArabic ? '12 كلمة سرية لحماية المحفظة' : '12-word recovery seed backup'}
              </span>
            </div>
          </div>
          <Chevron className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
        </button>

        {/* Notification Test */}
        <button
          onClick={handleTestNotification}
          className="w-full p-4 hover:bg-slate-800/40 flex items-center justify-between text-start transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {isArabic ? 'إشعارات النظام اللحظية' : 'Push Notifications'}
              </span>
              <span className="text-xs text-slate-400">
                {notificationTestStatus || (isArabic ? 'اضغط لاختبار إشعارات المتصفح' : 'Click to test push notifications')}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-400">
            {isArabic ? 'اختبار' : 'Test'}
          </span>
        </button>

        {/* Network & Protocol Info */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {isArabic ? 'الشبكة الافتراضية' : 'Default Network'}
              </span>
              <span className="text-xs text-slate-400">
                BNB Smart Chain (BEP20)
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {isArabic ? 'متصل' : 'Connected'}
          </span>
        </div>
      </div>

      {/* Recovery Seed Phrase Reveal Box */}
      {showSecurityPhrase && (
        <div className="p-5 rounded-3xl bg-slate-950/80 border border-purple-500/30 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
              <Shield className="w-4 h-4" />
              <span>{isArabic ? 'الكلمات السرية للمحفظة' : '12-Word Recovery Phrase'}</span>
            </div>
            <button
              onClick={() => setShowSecurityPhrase(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              {isArabic ? 'إخفاء' : 'Hide'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {demoSeedPhrase.map((word, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono text-xs text-slate-200 flex items-center justify-between px-2.5"
              >
                <span className="text-[10px] text-slate-500 font-sans">{idx + 1}.</span>
                <span>{word}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            {isArabic ? 'لا تشارك هذه الكلمات أبداً مع أي شخص لحماية أصولك الرقمية' : 'Never share your recovery phrase with anyone.'}
          </p>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full p-4 rounded-3xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-sm flex items-center justify-center gap-2 transition-all"
      >
        <LogOut className="w-4 h-4" />
        <span>{isArabic ? 'تسجيل الخروج من المحفظة' : 'Disconnect / Log Out'}</span>
      </button>

      {/* Footer Info */}
      <div className="text-center pt-2 pb-6 space-y-1">
        <p className="text-xs font-bold text-slate-400 tracking-wider">
          TRUST WALLET PRO v4.2
        </p>
        <p className="text-[10px] text-slate-600">
          Secure decentralized multi-asset wallet simulation
        </p>
      </div>
    </div>
  );
};
