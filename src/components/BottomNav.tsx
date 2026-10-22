import React from 'react';
import { Wallet as WalletIcon, Lock, History, Compass, Settings, ShieldCheck } from 'lucide-react';

export type MainTabType = 'wallet' | 'locked' | 'history' | 'browser' | 'settings' | 'admin';

interface BottomNavProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  isArabic: boolean;
  isOwner: boolean;
  lockedCount: number;
  unreadCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  isArabic,
  isOwner,
  lockedCount,
  unreadCount
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070b13]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-2xl">
      <div className={`grid ${isOwner ? 'grid-cols-6' : 'grid-cols-5'} items-center max-w-lg mx-auto`}>
        {/* Tab 1: Wallet */}
        <button
          onClick={() => onChangeTab('wallet')}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'wallet' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <WalletIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{isArabic ? 'المحفظة' : 'Wallet'}</span>
        </button>

        {/* Tab 2: History */}
        <button
          onClick={() => onChangeTab('history')}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'history' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{isArabic ? 'النشاط' : 'Activity'}</span>
        </button>

        {/* Tab 3: Locked */}
        <button
          onClick={() => onChangeTab('locked')}
          className={`relative flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'locked' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-5 h-5 mb-0.5" />
          {lockedCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center animate-pulse">
              {lockedCount}
            </span>
          )}
          <span className="text-[10px] tracking-tight">{isArabic ? 'المقيد' : 'Locked'}</span>
        </button>

        {/* Tab 4: Browser (DApps) */}
        <button
          onClick={() => onChangeTab('browser')}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'browser' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{isArabic ? 'المتصفح' : 'Browser'}</span>
        </button>

        {/* Tab 5: Settings */}
        <button
          onClick={() => onChangeTab('settings')}
          className={`relative flex flex-col items-center justify-center py-1 transition-all ${
            activeTab === 'settings' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <span className="text-[10px] tracking-tight">{isArabic ? 'الإعدادات' : 'Settings'}</span>
        </button>

        {/* Optional Owner Tab */}
        {isOwner && (
          <button
            onClick={() => onChangeTab('admin')}
            className={`flex flex-col items-center justify-center py-1 transition-all ${
              activeTab === 'admin' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="text-[10px] tracking-tight text-amber-300">{isArabic ? 'المالك' : 'Owner'}</span>
          </button>
        )}
      </div>
    </nav>
  );
};
