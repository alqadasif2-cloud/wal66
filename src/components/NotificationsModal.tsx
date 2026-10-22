import React, { useEffect, useState } from 'react';
import { AppNotification } from '../types/wallet';
import { WalletDatabase } from '../services/walletDb';
import { formatDateTime } from '../utils/formatters';
import { Bell, CheckCheck, X, ArrowDownLeft, Lock, Unlock, ShieldAlert, Sparkles, Smartphone } from 'lucide-react';

interface NotificationsModalProps {
  userId: string;
  isArabic: boolean;
  onClose: () => void;
  onSelectTransaction?: (txId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  userId,
  isArabic,
  onClose,
  onSelectTransaction
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const loadNotifications = () => {
    setNotifications(WalletDatabase.getNotifications(userId));
  };

  useEffect(() => {
    loadNotifications();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, [userId]);

  const handleMarkAllRead = () => {
    WalletDatabase.markAllNotificationsRead(userId);
    loadNotifications();
  };

  const handleEnableWebNotifications = async () => {
    const granted = await WalletDatabase.requestNotificationPermission();
    setHasPermission(granted);
    if (granted) {
      WalletDatabase.sendSystemNotification(
        isArabic ? 'تم تفعيل الإشعارات بنجاح' : 'Notifications Enabled',
        isArabic ? 'ستتلقى تنبيهات فورية عند وصول أي مبالغ جديدة لمحفظتك.' : 'You will receive alerts for new incoming transfers.'
      );
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'incoming_transfer':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'locked_transfer':
        return <Lock className="w-4 h-4 text-amber-400" />;
      case 'lock_unlocked':
        return <Unlock className="w-4 h-4 text-cyan-400" />;
      case 'admin':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0d1424] border border-slate-800 p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              {isArabic ? 'مركز الإشعارات' : 'Notifications'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تحديد الكل كمقروء' : 'Read All'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* System Outside-App Notification Permission Banner */}
        {!hasPermission && (
          <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-blue-900/30 to-emerald-900/20 border border-blue-500/20 shrink-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">
                  {isArabic ? 'إشعارات الهاتف خارج التطبيق' : 'Device Notifications'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isArabic ? 'لتنبيهك عند استلام مبالغ جديدة والتطبيق مغلق' : 'Get alerted when app is closed'}
                </span>
              </div>
            </div>

            <button
              onClick={handleEnableWebNotifications}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 transition-colors shadow-md shadow-blue-600/30"
            >
              {isArabic ? 'تفعيل الآن' : 'Enable'}
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="mt-3 overflow-y-auto space-y-2.5 flex-1 pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {isArabic ? 'لا توجد إشعارات جديدة حالياً.' : 'No notifications.'}
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.notificationId}
                onClick={() => {
                  WalletDatabase.markNotificationRead(notif.notificationId);
                  loadNotifications();
                  if (notif.transactionId && onSelectTransaction) {
                    onSelectTransaction(notif.transactionId);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-slate-900/50 border-slate-800/70 hover:bg-slate-900'
                    : 'bg-slate-800/70 border-blue-500/30 hover:bg-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotifIcon(notif.type)}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${notif.read ? 'text-slate-200' : 'text-white'}`}>
                        {isArabic ? notif.titleAr : notif.title}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {isArabic ? notif.bodyAr : notif.body}
                    </p>

                    <span className="text-[10px] text-slate-400 font-mono-numbers mt-2">
                      {formatDateTime(notif.createdAt, isArabic)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <div className="pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
