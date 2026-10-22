import React from 'react';
import { User, Wallet } from '../types/wallet';
import { WalletDatabase } from '../services/walletDb';
import { formatCurrency, shortenAddress } from '../utils/formatters';
import { 
  X, 
  Wallet as WalletIcon, 
  Check, 
  Plus, 
  Shield, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  UserCheck
} from 'lucide-react';

interface WalletSwitcherModalProps {
  currentUser: User | null;
  isArabic: boolean;
  onSelectUser: (user: User) => void;
  onOpenAuth: () => void;
  onClose: () => void;
}

export const WalletSwitcherModal: React.FC<WalletSwitcherModalProps> = ({
  currentUser,
  isArabic,
  onSelectUser,
  onOpenAuth,
  onClose,
}) => {
  const isOwner = WalletDatabase.isAuthorizedOwner(currentUser);

  // Unauthorized access guard
  if (!isOwner) {
    return null;
  }

  const users = WalletDatabase.getUsers();
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <WalletIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isArabic ? 'المحافظ والحسابات' : 'Wallets & Accounts'}
              </h2>
              <span className="text-[11px] text-slate-400">
                {isArabic ? 'اختر المحفظة النشطة للتداول' : 'Select active wallet'}
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

        {/* Wallets List */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {users.map(user => {
            const isCurrent = currentUser?.userId === user.userId;
            const wallet = WalletDatabase.getWalletByUserId(user.userId);
            const isSuspended = user.accountStatus === 'suspended';

            return (
              <div
                key={user.userId}
                onClick={() => {
                  if (!isSuspended) {
                    onSelectUser(user);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                    : isSuspended
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                    : 'bg-slate-950/60 hover:bg-slate-800/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-sm ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {user.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {user.displayName || user.username}
                      </span>
                      {user.role === 'owner' && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                          {isArabic ? 'المالك' : 'Owner'}
                        </span>
                      )}
                      {isSuspended && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold">
                          {isArabic ? 'موقوف' : 'Suspended'}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {shortenAddress(wallet?.demoAddress || user.demoAddress, 6, 4)}
                    </div>

                    {wallet && wallet.lockedDemoBalance > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold mt-1">
                        <Lock className="w-3 h-3" />
                        <span>
                          {isArabic ? 'مقيد: ' : 'Locked: '}
                          {formatCurrency(wallet.lockedDemoBalance)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-white font-mono-numbers">
                    {formatCurrency(wallet?.totalDemoBalance ?? 0)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isCurrent ? (
                      <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {isArabic ? 'النشطة' : 'Active'}
                      </span>
                    ) : (
                      <span className="text-slate-500">{isArabic ? 'تبديل' : 'Switch'}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add / Login New Account */}
        <button
          onClick={() => {
            onClose();
            onOpenAuth();
          }}
          className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>{isArabic ? 'إضافة محفظة أو حساب جديد' : 'Add or Connect Another Wallet'}</span>
        </button>
      </div>
    </div>
  );
};
