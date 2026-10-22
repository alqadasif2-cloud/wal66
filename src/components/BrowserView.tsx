import React, { useState } from 'react';
import { Search, Compass, ExternalLink, ShieldCheck, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface BrowserViewProps {
  isArabic: boolean;
}

interface DApp {
  name: string;
  category: string;
  categoryAr: string;
  desc: string;
  descAr: string;
  url: string;
  iconBg: string;
  letter: string;
}

const DAPPS: DApp[] = [
  {
    name: 'PancakeSwap',
    category: 'DeFi',
    categoryAr: 'تبديل لامركزي',
    desc: 'The leading DEX on BNB Smart Chain for token swaps and liquidity.',
    descAr: 'المنصة اللامركزية الأولى على شبكة BNB Smart Chain لمبادلة العملات والسيولة.',
    url: 'https://pancakeswap.finance',
    iconBg: 'bg-amber-500',
    letter: '🥞'
  },
  {
    name: 'Uniswap',
    category: 'DeFi',
    categoryAr: 'تبديل لامركزي',
    desc: 'Swap, earn, and build on the leading decentralized crypto trading protocol.',
    descAr: 'البروتوكول اللامركزي الأشهر لمبادلة رموز Ethereum والشبكات المتوافقة.',
    url: 'https://uniswap.org',
    iconBg: 'bg-pink-500',
    letter: '🦄'
  },
  {
    name: 'OpenSea',
    category: 'NFTs',
    categoryAr: 'سوق NFTs',
    desc: 'The world\'s first and largest digital marketplace for crypto collectibles.',
    descAr: 'سوق الأصول الرقمية والرموز غير القابلة للاستبدال الأول عالمياً.',
    url: 'https://opensea.io',
    iconBg: 'bg-blue-500',
    letter: '⛵'
  },
  {
    name: '1inch Network',
    category: 'Aggregator',
    categoryAr: 'مجمّع سيولة',
    desc: 'DeFi / DEX aggregator for best prices across all liquidity pools.',
    descAr: 'مجمّع بروتوكولات التبادل للحصول على أفضل سعر صرف دون انزلاق سعري.',
    url: 'https://1inch.io',
    iconBg: 'bg-indigo-600',
    letter: '🦄'
  },
  {
    name: 'Binance Bridge',
    category: 'Cross-chain',
    categoryAr: 'جسر متعدد الشبكات',
    desc: 'Seamless cross-chain liquidity transfers across BNB, Ethereum, and TRON.',
    descAr: 'نقل السيولة بين شبكة BNB و Ethereum وشبكات البلوكشين المختلفة.',
    url: 'https://binance.org/bridge',
    iconBg: 'bg-amber-600',
    letter: '🌉'
  }
];

export const BrowserView: React.FC<BrowserViewProps> = ({ isArabic }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDApp, setActiveDApp] = useState<DApp | null>(null);
  const [connected, setConnected] = useState(false);

  const filteredDApps = DAPPS.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDApp = (dapp: DApp) => {
    setActiveDApp(dapp);
    setConnected(false);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-10">
      {/* Search Bar matching Trust Wallet Web3 Browser */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5 rtl:right-3.5 rtl:left-auto ltr:left-3.5 ltr:right-auto" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isArabic ? 'ابحث في تطبيقات Web3 أو أدخل عنوان URL...' : 'Search Web3 DApps or enter URL...'}
          className="w-full py-3 px-10 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Hero Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-transparent border border-blue-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              {isArabic ? 'متصفح تطبيقات Web3 اللامركزية' : 'Web3 DApps Browser'}
            </span>
            <span className="text-[11px] text-slate-400">
              {isArabic ? 'اتصال آمن ومباشر بمحفظتك' : 'Secure direct connection to your wallet'}
            </span>
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
          BEP20 / EVM
        </span>
      </div>

      {/* DApps List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-300 px-1 uppercase tracking-wider">
          {isArabic ? 'أشهر التطبيقات المعتمدة' : 'Verified DApps'}
        </h3>

        {filteredDApps.map((dapp) => (
          <div
            key={dapp.name}
            onClick={() => handleOpenDApp(dapp)}
            className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                {dapp.letter}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                    {dapp.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                    {isArabic ? dapp.categoryAr : dapp.category}
                  </span>
                </div>
                <span className="text-xs text-slate-400 line-clamp-1">
                  {isArabic ? dapp.descAr : dapp.desc}
                </span>
              </div>
            </div>

            <div className="w-7 h-7 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

      {/* DApp Connection Simulator Modal */}
      {activeDApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0b111e] border border-slate-800 p-6 shadow-2xl text-center">
            <div className="text-4xl mb-3">{activeDApp.letter}</div>
            <h3 className="text-base font-bold text-white mb-1">{activeDApp.name}</h3>
            <p className="text-xs text-slate-400 mb-5">
              {isArabic 
                ? `يرغب التطبيق ${activeDApp.name} في الاتصال بمحفظتك لعرض الرصيد وتوقيع المعاملات.` 
                : `${activeDApp.name} wants to connect to your wallet to view balance and request approvals.`}
            </p>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 mb-5 text-xs text-slate-300 flex items-center gap-2 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isArabic ? 'اتصال آمن ومشفر بالكامل' : 'End-to-end encrypted connection'}</span>
            </div>

            {connected ? (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 justify-center mb-4">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isArabic ? 'تم الاتصال بالمحفظة بنجاح!' : 'Connected successfully!'}</span>
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                onClick={() => setActiveDApp(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => setConnected(true)}
                disabled={connected}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
              >
                {connected ? (isArabic ? 'متصل' : 'Connected') : (isArabic ? 'اتصال' : 'Connect')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
