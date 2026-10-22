import React, { useState } from 'react';
import { User } from '../types/wallet';
import { WalletDatabase } from '../services/walletDb';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { TrustWalletShield } from './TrustWalletShield';
import { 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

interface AuthModalProps {
  isArabic: boolean;
  onSuccess: (user: User) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isArabic,
  onSuccess,
  onClose
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Native Google Firebase Authentication
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsGoogleLoading(true);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        const res = await WalletDatabase.loginWithGoogle({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName
        });

        if (res.success && res.user) {
          setSuccessMsg(res.message);
          setTimeout(() => {
            onSuccess(res.user!);
          }, 400);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg(isArabic ? 'تم إغلاق نافذة تسجيل الدخول' : 'Popup closed by user');
      } else {
        setErrorMsg(err?.message || (isArabic ? 'فشل تسجيل الدخول عبر Google' : 'Google sign in failed'));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !password) {
      setErrorMsg(isArabic ? 'يرجى إدخال اسم المستخدم وكلمة المرور' : 'Please enter username and password');
      return;
    }

    setIsLoading(true);
    const res = WalletDatabase.loginUser(username, password);
    setIsLoading(false);

    if (!res.success || !res.user) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessMsg(res.message);
    setTimeout(() => {
      onSuccess(res.user!);
    }, 400);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim()) {
      setErrorMsg(isArabic ? 'يرجى إدخال اسم المستخدم' : 'Username required');
      return;
    }

    if (password.length < 4) {
      setErrorMsg(isArabic ? 'كلمة المرور يجب ألا تقل عن 4 خانات' : 'Password too short');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(isArabic ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    const res = WalletDatabase.registerUser(username, password, displayName);
    setIsLoading(false);

    if (!res.success || !res.user) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessMsg(res.message);
    setTimeout(() => {
      onSuccess(res.user!);
    }, 500);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0b111e] border border-slate-800 p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <TrustWalletShield size={48} className="mb-2" />
          <h1 className="text-xl font-extrabold text-white tracking-wide bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
            TRUST WALLET PRO
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isArabic ? 'محفظة العملات المشفرة مع المزامنة السحابية' : 'Cloud Synchronized Crypto Wallet'}
          </p>


          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 left-4 sm:left-6 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary 1-Click Google Sign-In (Firebase Native Auth) */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg shadow-white/10 transition-all active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {isGoogleLoading
                ? (isArabic ? 'جاري فتح تسجيل الدخول...' : 'Opening Sign-In...')
                : (isArabic ? 'تسجيل الدخول السريع عبر Google (مزامنة فورية)' : 'Sign In with Google (Cloud Sync)')}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-[#0b111e] px-3 text-[10px] text-slate-500 uppercase tracking-wider">
            {isArabic ? 'أو عبر الحساب المحلي / المسجل' : 'Or with username'}
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-4">
          <button
            onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isArabic ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>

          <button
            onClick={() => { setTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isArabic ? 'إنشاء حساب جديد' : 'Sign Up'}</span>
          </button>
        </div>

        {/* Form: Sign In */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                {isArabic ? 'اسم المستخدم' : 'Username'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isArabic ? 'اسم المستخدم' : 'Username'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                {isArabic ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (isArabic ? 'جاري التحقق...' : 'Signing In...') : (isArabic ? 'تسجيل الدخول' : 'Sign In')}
            </button>

          </form>
        )}

        {/* Form: Register */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                {isArabic ? 'الاسم الظاهر (اختياري)' : 'Display Name'}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isArabic ? 'الاسم الظاهر' : 'Display name'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                {isArabic ? 'اسم المستخدم' : 'Username'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isArabic ? 'اسم المستخدم' : 'Username'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                {isArabic ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                {isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (isArabic ? 'جاري إنشاء الحساب والمحفظة...' : 'Creating Account...') : (isArabic ? 'إنشاء الحساب ومزامنته بالسحابة' : 'Create & Sync Account')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
