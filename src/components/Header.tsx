import React from 'react';
import { User } from '../types/wallet';
import { TrustWalletShield } from './TrustWalletShield';
import { Bell, ShieldCheck, Globe, QrCode, Settings, User as UserIcon, LogOut, MessageSquare } from 'lucide-react';
import { WalletDatabase } from '../services/walletDb';

interface HeaderProps {
  currentUser: User | null;
  unreadNotificationsCount: number;
  isArabic: boolean;
  onToggleLanguage: () => void;
  onOpenNotifications: () => void;
  onOpenChat: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onOpenWalletSwitcher?: () => void;
  onOpenQrScanner: () => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  unreadNotificationsCount,
  isArabic,
  onToggleLanguage,
  onOpenNotifications,
  onOpenChat,
  onOpenAdmin,
  onLogout,
  onOpenWalletSwitcher,
  onOpenQrScanner,
  onOpenSettings,
  onOpenLogin
}) => {
  const isOwner = WalletDatabase.isAuthorizedOwner(currentUser);

  return (
    <header className="sticky top-0 z-40 bg-[#070b13]/95 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-4 py-2.5">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Left */}
        <div className="flex items-center gap-2 shrink-0">
          <TrustWalletShield size={32} />
          <span className="font-extrabold text-sm sm:text-base tracking-wide bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent hidden sm:inline">
            TRUST WALLET
          </span>
        </div>

        {/* Center: Current Account Badge & Direct Logout Button */}
        {currentUser ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div 
              onClick={isOwner ? onOpenWalletSwitcher : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-sm max-w-[150px] sm:max-w-xs ${
                isOwner ? 'cursor-pointer hover:border-slate-700 transition-colors' : 'cursor-default'
              }`}
              title={isOwner ? (isArabic ? 'تبديل الحساب / المحفظة' : 'Switch Wallet') : undefined}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-bold text-xs text-slate-100 truncate">
                {currentUser.displayName}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer"
              title={isArabic ? 'تسجيل الخروج' : 'Log Out'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isArabic ? 'تسجيل الخروج' : 'Log Out'}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
          >
            <UserIcon className="w-3 h-3" />
            <span>{isArabic ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>
        )}

        {/* Action Controls Right */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Chat / Messages Button */}
          {currentUser && (
            <button
              onClick={onOpenChat}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
              title={isArabic ? 'المحادثات والرسائل' : 'Messages'}
            >
              <MessageSquare className="w-4 h-4 text-blue-400" />
            </button>
          )}

          {/* QR Scanner Icon */}
          <button
            onClick={onOpenQrScanner}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
            title={isArabic ? 'مسح رمز QR' : 'Scan QR'}
          >
            <QrCode className="w-4 h-4 text-slate-300" />
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
            title={isArabic ? 'الإشعارات' : 'Notifications'}
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 ring-2 ring-[#070b13]">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
            title={isArabic ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-[10px]">{isArabic ? 'EN' : 'عربي'}</span>
          </button>

          {/* Owner Badge shortcut if owner */}
          {isOwner && (
            <button
              onClick={onOpenAdmin}
              className="p-2 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 transition-colors"
              title={isArabic ? 'لوحة تحكم المالك' : 'Owner Dashboard'}
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* Settings button on desktop */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors hidden sm:block"
            title={isArabic ? 'الإعدادات' : 'Settings'}
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
