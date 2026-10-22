import React, { useState } from 'react';
import { User, Transaction } from '../types/wallet';
import { WalletDatabase } from '../services/walletDb';
import { formatCurrency, shortenAddress, formatDateTime } from '../utils/formatters';
import { 
  ShieldCheck, 
  Users, 
  DollarSign, 
  Lock, 
  Unlock, 
  FileText, 
  Search, 
  PlusCircle, 
  MinusCircle, 
  AlertTriangle, 
  X, 
  Check, 
  RotateCcw,
  Activity,
  UserX,
  UserCheck
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  isArabic: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  isArabic,
  onClose,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'locked' | 'audit' | 'overview'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Balance adjustment modal state
  const [targetUserForAdjustment, setTargetUserForAdjustment] = useState<User | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  const users = WalletDatabase.getUsers();
  const wallets = WalletDatabase.getWallets();
  const allTxs = WalletDatabase.getTransactions();
  const auditLogs = WalletDatabase.getAuditLogs();

  const totalSystemBalance = wallets.reduce((sum, w) => sum + w.totalDemoBalance, 0);
  const totalLockedVolume = wallets.reduce((sum, w) => sum + w.lockedDemoBalance, 0);
  const activeLocks = allTxs.filter(t => t.status === 'locked');

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.demoAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdjustBalance = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!targetUserForAdjustment) return;

    const amt = parseFloat(adjustmentAmount);
    if (isNaN(amt) || amt <= 0) {
      setActionError(isArabic ? 'يرجى إدخال مبلغ صحيح' : 'Invalid amount');
      return;
    }

    if (!adjustmentReason.trim() || adjustmentReason.trim().length < 4) {
      setActionError(isArabic ? 'يجب إدخال سبب رسمي وموثق للتعديل الإداري' : 'Reason required');
      return;
    }

    const delta = adjustmentType === 'add' ? amt : -amt;

    const res = WalletDatabase.adminAdjustBalance({
      adminUserId: currentUser.userId,
      targetUserId: targetUserForAdjustment.userId,
      amountDelta: delta,
      reason: adjustmentReason.trim()
    });

    if (!res.success) {
      setActionError(res.message);
      return;
    }

    setActionSuccess(res.message);
    setAdjustmentAmount('');
    setAdjustmentReason('');
    onRefresh();
    setTimeout(() => {
      setTargetUserForAdjustment(null);
      setActionSuccess('');
    }, 1500);
  };

  const handleToggleUserStatus = (target: User) => {
    const reason = window.prompt(
      isArabic 
        ? `أدخل سبب ${target.accountStatus === 'active' ? 'إيقاف' : 'تنشيط'} حساب ${target.username}:` 
        : 'Enter reason for status change:'
    );
    if (reason === null) return;

    const res = WalletDatabase.adminToggleUserStatus(currentUser.userId, target.userId, reason || 'قرار إداري');
    if (res.success) {
      onRefresh();
    } else {
      alert(res.message);
    }
  };

  const handleReleaseLock = (tx: Transaction) => {
    const reason = window.prompt(
      isArabic 
        ? `فك تقييد مبلغ $${tx.amount} لحساب ${tx.receiverUsername}. أدخل السبب الإداري:` 
        : 'Enter administrative reason for releasing lock:'
    );
    if (reason === null) return;

    const res = WalletDatabase.adminReleaseLock(currentUser.userId, tx.transactionId, reason || 'فك تقييد استثنائي بقرار المالك');
    if (res.success) {
      alert(isArabic ? 'تم فك التقييد بنجاح وتحويل المبلغ للرصيد المتاح' : 'Lock released');
      onRefresh();
    } else {
      alert(res.message);
    }
  };

  const handleResetData = () => {
    if (confirm(isArabic ? 'هل تريد استعادة البيانات التجريبية الأولية وسجلات الحساب الاستثنائي؟' : 'Reset all data to seed?')) {
      WalletDatabase.resetToSeed();
      onRefresh();
      alert(isArabic ? 'تمت استعادة البيانات الأولية بنجاح' : 'Database reset to seed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#0b111e] border border-blue-500/30 p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white">
                  {isArabic ? 'لوحة تحكم المالك الإدارية' : 'Owner Admin Dashboard'}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  {currentUser.username} (Super Admin)
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {isArabic ? 'إدارة المستخدمين والأرصدة وسجلات التدقيق الموثقة' : 'User management & audit trails'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title={isArabic ? 'استعادة البيانات الأولية' : 'Reset Seed Data'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إعادة ضبط البيانات' : 'Reset Data'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
          {[
            { id: 'overview', icon: Activity, labelAr: 'نظرة عامة', labelEn: 'Overview' },
            { id: 'users', icon: Users, labelAr: 'المستخدمون والأرصدة', labelEn: 'Users & Balances' },
            { id: 'locked', icon: Lock, labelAr: 'المبالغ المقيدة', labelEn: `Locks (${activeLocks.length})` },
            { id: 'audit', icon: FileText, labelAr: 'سجل التدقيق الإداري', labelEn: 'Audit Log' }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isArabic ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">
                    {isArabic ? 'إجمالي المستخدمين' : 'Total Users'}
                  </span>
                  <span className="text-2xl font-extrabold text-white font-mono-numbers">
                    {users.length}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">
                    {isArabic ? 'إجمالي السيولة' : 'Total System Volume'}
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono-numbers">
                    {formatCurrency(totalSystemBalance)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">
                    {isArabic ? 'المبالغ المقيدة حالياً' : 'Active Locked Volume'}
                  </span>
                  <span className="text-2xl font-extrabold text-amber-400 font-mono-numbers">
                    {formatCurrency(totalLockedVolume)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">
                    {isArabic ? 'إجمالي المعاملات' : 'Total Transactions'}
                  </span>
                  <span className="text-2xl font-extrabold text-blue-400 font-mono-numbers">
                    {allTxs.length}
                  </span>
                </div>
              </div>

              {/* Owner Info & Rules */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/20">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  {isArabic ? 'صلاحيات حساب المالك (Sami)' : 'Owner Credentials & Access'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isArabic
                    ? 'يتمتع المالك بصلاحية مراقبة جميع المحافظ، وضبط الأرصدة عبر عمليات تدقيق موثقة، وفك التقييد المبكر، واستعراض سجلات التدقيق غير القابلة للتلاعب. الحساب الأولي مزود برصيد 3000$.'
                    : 'The owner has full administrative access to manage balances with documented reasons, view all user records, and inspect the immutable audit log.'}
                </p>
              </div>

              {/* Quick User List preview */}
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
                <span className="text-xs font-bold text-slate-200 block mb-3">
                  {isArabic ? 'أحدث المعاملات عبر النظام' : 'Recent System Transactions'}
                </span>
                <div className="space-y-2">
                  {allTxs.slice(0, 5).map(tx => (
                    <div key={tx.transactionId} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">
                          {tx.senderUsername} ➔ {tx.receiverUsername}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tx.transactionId} · {tx.formattedTimeAr || formatDateTime(tx.createdAt, isArabic)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400 font-mono-numbers">
                          {formatCurrency(tx.amount)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tx.statusTextAr || tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isArabic ? 'بحث باسم المستخدم أو المعرف الفريد أو العنوان...' : 'Search by username or address...'}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              {/* Users Table */}
              <div className="space-y-2.5">
                {filteredUsers.map((user) => {
                  const userWallet = wallets.find(w => w.ownerUserId === user.userId);
                  const isOwner = user.role === 'owner';
                  const isSuspended = user.accountStatus === 'suspended';

                  return (
                    <div
                      key={user.userId}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">
                            {user.displayName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            @{user.username}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isOwner ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {isOwner ? (isArabic ? 'مالك النظام' : 'Owner') : (isArabic ? 'مستخدم' : 'User')}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isSuspended ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {isSuspended ? (isArabic ? 'موقوف' : 'Suspended') : (isArabic ? 'نشط' : 'Active')}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                          <span>{isArabic ? 'المعرف:' : 'ID:'} <span className="font-mono text-slate-300">{user.userId}</span></span>
                          <span>{isArabic ? 'العنوان:' : 'Address:'} <span className="font-mono text-slate-300" dir="ltr">{shortenAddress(user.demoAddress, 6)}</span></span>
                          <span>{isArabic ? 'تاريخ التسجيل:' : 'Created:'} <span className="font-mono text-slate-300">{formatDateTime(user.createdAt, isArabic)}</span></span>
                        </div>
                      </div>

                      {/* Balances & Admin Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        <div className="flex flex-col sm:items-end">
                          <span className="text-[10px] text-slate-400">
                            {isArabic ? 'الرصيد' : 'Balance'}
                          </span>
                          <span className="text-sm font-extrabold text-emerald-400 font-mono-numbers">
                            {formatCurrency(userWallet?.totalDemoBalance ?? 0)}
                          </span>
                          {userWallet && userWallet.lockedDemoBalance > 0 && (
                            <span className="text-[10px] font-bold text-amber-400 font-mono-numbers">
                              ({formatCurrency(userWallet.lockedDemoBalance)} {isArabic ? 'مقيد' : 'locked'})
                            </span>
                          )}
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center gap-1.5">
                          {/* Adjust Balance Button */}
                          <button
                            onClick={() => {
                              setTargetUserForAdjustment(user);
                              setActionError('');
                              setActionSuccess('');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors"
                            title={isArabic ? 'تعديل الرصيد' : 'Adjust balance'}
                          >
                            {isArabic ? 'تعديل الرصيد' : 'Adjust'}
                          </button>

                          {/* Suspend / Activate Toggle */}
                          {!isOwner && (
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className={`p-1.5 rounded-xl border transition-colors ${
                                isSuspended
                                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                                  : 'bg-rose-600/20 text-rose-400 border-rose-500/30 hover:bg-rose-600/30'
                              }`}
                              title={isSuspended ? (isArabic ? 'تنشيط الحساب' : 'Activate') : (isArabic ? 'إيقاف الحساب' : 'Suspend')}
                            >
                              {isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. LOCKED TRANSFERS TAB */}
          {activeTab === 'locked' && (
            <div className="space-y-3">
              {activeLocks.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  {isArabic ? 'لا توجد مبالغ مقيدة حالياً في النظام بأكمله.' : 'No active locks in system.'}
                </div>
              ) : (
                activeLocks.map(tx => (
                  <div key={tx.transactionId} className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-sm text-white font-mono-numbers">
                          {formatCurrency(tx.amount)}
                        </span>
                        <span className="text-xs text-slate-300">
                          {tx.senderUsername} ➔ {tx.receiverUsername}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                        <span>{isArabic ? 'المعرف:' : 'TxID:'} <span className="font-mono text-slate-300">{tx.transactionId}</span></span>
                        <span>{isArabic ? 'تاريخ التحرير:' : 'Expires:'} <span className="font-mono text-amber-300">{tx.lockUntil ? formatDateTime(tx.lockUntil, isArabic) : '-'}</span></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReleaseLock(tx)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'فك التقييد مبكراً (إداري)' : 'Release Early'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. AUDIT LOG TAB */}
          {activeTab === 'audit' && (
            <div className="space-y-2.5">
              <span className="text-xs text-slate-400 block mb-2">
                {isArabic ? 'سجل غير قابل للتعديل يوثق جميع التعديلات والقرارات الإدارية:' : 'Immutable audit trail of all owner operations:'}
              </span>

              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  {isArabic ? 'سجل التدقيق فارغ حالياً.' : 'No audit entries.'}
                </div>
              ) : (
                auditLogs.map(log => (
                  <div key={log.logId} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-400 font-mono">
                          {log.actionType}
                        </span>
                        <span className="text-slate-300">
                          {isArabic ? `بواسطة ${log.adminUsername}` : `by ${log.adminUsername}`} ➔ {log.targetUsername}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(log.timestamp, isArabic)}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs">
                      <span className="text-slate-400">{isArabic ? 'السبب الموثق:' : 'Reason:'} </span>
                      {log.reason}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>{isArabic ? 'القيمة السابقة:' : 'Prev:'} {log.previousValue}</span>
                      <span>➔</span>
                      <span className="text-emerald-400">{isArabic ? 'القيمة الجديدة:' : 'New:'} {log.newValue}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal: Adjust User Balance */}
        {targetUserForAdjustment && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-3xl bg-[#0e1627] border border-blue-500/40 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  {isArabic ? `تعديل رصيد: ${targetUserForAdjustment.username}` : `Adjust Balance: ${targetUserForAdjustment.username}`}
                </h3>
                <button
                  onClick={() => setTargetUserForAdjustment(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdjustBalance} className="space-y-3.5">
                {/* Type: Add or Deduct */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('add')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustmentType === 'add'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isArabic ? 'إضافة رصيد (+)' : 'Add (+)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustmentType('deduct')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      adjustmentType === 'deduct'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>{isArabic ? 'خصم رصيد (-)' : 'Deduct (-)'}</span>
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    {isArabic ? 'المبلغ المراد تعديله ($)' : 'Adjustment Amount ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="100.00"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white outline-none font-mono-numbers"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    {isArabic ? 'السبب الرسمي الموثق (إلزامي للتدقيق):' : 'Official Audit Reason (Mandatory):'}
                  </label>
                  <textarea
                    rows={2}
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder={isArabic ? 'السبب الموثق للتعديل الإداري' : 'Official audit reason'}
                    className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none resize-none"
                  />
                </div>

                {actionError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {actionSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-colors"
                  >
                    {isArabic ? 'تنفيذ التعديل وتوثيقه' : 'Confirm & Log'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetUserForAdjustment(null)}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
