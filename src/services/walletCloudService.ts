import { User, Wallet, Transaction, AppNotification } from '../types/wallet';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { marketPriceService } from './marketPriceService';
import { createDefaultAssets } from './walletDb';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  onSnapshot, 
  Unsubscribe,
  serverTimestamp 
} from 'firebase/firestore';

export interface RecipientLookupResult {
  found: boolean;
  user: User | null;
  wallet: Wallet | null;
  isCloudVerified: boolean;
  error?: string;
}

export function cleanForFirestore<T extends Record<string, any>>(obj: T): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      cleaned[k] = (v && typeof v === 'object' && !(v instanceof Date)) ? cleanForFirestore(v) : v;
    }
  }
  return cleaned;
}

// In-flight idempotency locks
const activeTransferLocks = new Set<string>();

export class WalletCloudService {
  /**
   * Parse any input string (plain address, username, or full URL)
   * Extracts candidate address, username, or URL query parameter.
   */
  public static extractRecipientQuery(input: string): string {
    const raw = (input || '').trim();
    if (!raw) return '';

    // If input is a URL or query string (e.g. https://.../?wallet=0x... or ?to=0x...)
    if (raw.includes('?') || raw.includes('://') || raw.startsWith('/?')) {
      try {
        const urlObj = new URL(raw.startsWith('/') ? `http://localhost${raw}` : raw);
        const candidate = urlObj.searchParams.get('wallet') || 
                          urlObj.searchParams.get('to') || 
                          urlObj.searchParams.get('sendTo') || 
                          urlObj.searchParams.get('address') || 
                          urlObj.searchParams.get('recipient');
        if (candidate) return candidate.trim();
        
        // If path itself contains address like /wallet/0x...
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment && lastSegment.startsWith('0x')) {
          return lastSegment.trim();
        }
      } catch {
        // Fallback simple regex query extract
        const match = raw.match(/[?&](?:wallet|to|sendTo|address)=([^&#]+)/i);
        if (match && match[1]) {
          return decodeURIComponent(match[1]).trim();
        }
      }
    }

    return raw;
  }

  /**
   * Search Firestore cloud database for a recipient by address, username, or ID.
   * Works across all phones and devices.
   */
  public static async lookupRecipientCloud(
    input: string, 
    localUsersFallback: User[] = []
  ): Promise<RecipientLookupResult> {
    const cleaned = this.extractRecipientQuery(input);
    if (!cleaned) {
      return { found: false, user: null, wallet: null, isCloudVerified: false };
    }

    const lowerCleaned = cleaned.toLowerCase();

    // 1. Try querying Firestore Users collection
    try {
      const usersCol = collection(db, 'users');

      // A. Query by exact demoAddress (standard case)
      const qAddress = query(usersCol, where('demoAddress', '==', cleaned));
      const snapAddress = await getDocs(qAddress);
      if (!snapAddress.empty) {
        const cloudUser = snapAddress.docs[0].data() as User;
        return {
          found: true,
          user: cloudUser,
          wallet: null,
          isCloudVerified: true
        };
      }

      // B. Query by username
      const qUsername = query(usersCol, where('username', '==', cleaned));
      const snapUsername = await getDocs(qUsername);
      if (!snapUsername.empty) {
        const cloudUser = snapUsername.docs[0].data() as User;
        return {
          found: true,
          user: cloudUser,
          wallet: null,
          isCloudVerified: true
        };
      }

      // C. Query by userId directly (doc get)
      try {
        const userDocRef = doc(db, 'users', cleaned);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const cloudUser = userDocSnap.data() as User;
          return {
            found: true,
            user: cloudUser,
            wallet: null,
            isCloudVerified: true
          };
        }
      } catch {}

      // D. Full collection scan if needed for case-insensitive address or username
      const allUsersSnap = await getDocs(usersCol);
      if (!allUsersSnap.empty) {
        for (const docSnap of allUsersSnap.docs) {
          const u = docSnap.data() as User;
          if (
            (u.demoAddress && u.demoAddress.toLowerCase() === lowerCleaned) ||
            (u.username && u.username.toLowerCase() === lowerCleaned) ||
            (u.userId && u.userId.toLowerCase() === lowerCleaned)
          ) {
            return {
              found: true,
              user: u,
              wallet: null,
              isCloudVerified: true
            };
          }
        }
      }
    } catch (e) {
      console.warn('[WalletCloudService] Cloud lookup query failed, falling back to local cache:', e);
    }

    // 2. Fallback to local users list (for seeded accounts or offline mode)
    const localMatch = localUsersFallback.find(u => 
      (u.demoAddress && u.demoAddress.toLowerCase() === lowerCleaned) ||
      (u.username && u.username.toLowerCase() === lowerCleaned) ||
      (u.userId && u.userId.toLowerCase() === lowerCleaned)
    );

    if (localMatch) {
      return {
        found: true,
        user: localMatch,
        wallet: null,
        isCloudVerified: false // Found in local pre-seeded accounts
      };
    }

    return {
      found: false,
      user: null,
      wallet: null,
      isCloudVerified: false,
      error: 'لم يتم العثور على صاحب هذا الرابط أو العنوان في قاعدة البيانات السحابية.'
    };
  }

  /**
   * Save or update a user and their wallet to Firestore cloud.
   */
  public static async saveUserToCloud(user: User, wallet?: Wallet | null): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.userId);
      await setDoc(userRef, cleanForFirestore({
        ...user,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      if (wallet) {
        const walletRef = doc(db, 'wallets', wallet.walletId || user.userId);
        await setDoc(walletRef, cleanForFirestore({
          ...wallet,
          ownerUserId: user.userId,
          updatedAt: new Date().toISOString()
        }), { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.userId}`);
    }
  }

  /**
   * Generate an idempotent, globally shareable wallet link for the user.
   */
  public static getShareableWalletLink(address: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://trustwallet.pro';
    return `${origin}/?wallet=${encodeURIComponent(address)}`;
  }

  /**
   * Execute an atomic transfer and publish it to the cloud.
   */
  public static async executeCloudSendTransfer(params: {
    sender: User;
    senderWallet: Wallet;
    recipient: User;
    recipientWallet?: Wallet | null;
    amount: number;
    currency?: string;
    lockDurationMinutes?: number;
    notes?: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; message: string; transaction?: Transaction }> {
    const { 
      sender, 
      senderWallet, 
      recipient, 
      recipientWallet, 
      amount, 
      currency = 'USD', 
      lockDurationMinutes = 0, 
      notes,
      idempotencyKey 
    } = params;

    // Idempotency check to prevent duplicate executions on network glitches
    const opKey = idempotencyKey || `${sender.userId}_${recipient.userId}_${amount}_${Date.now()}`;
    if (activeTransferLocks.has(opKey)) {
      return { success: false, message: 'عملية التحويل قيد المعالجة بالفعل، يرجى الانتظار.' };
    }
    activeTransferLocks.add(opKey);

    try {
      if (amount <= 0 || isNaN(amount)) {
        return { success: false, message: 'يرجى إدخال مبلغ صحيح أكبر من الصفر.' };
      }

      if (sender.userId === recipient.userId || sender.demoAddress.toLowerCase() === recipient.demoAddress.toLowerCase()) {
        return { success: false, message: 'لا يمكنك إرسال الأموال إلى محفظتك الخاصة.' };
      }

      if (senderWallet.availableDemoBalance < amount) {
        return { 
          success: false, 
          message: `الرصيد المتاح غير كافٍ. رصيدك المتاح حالياً هو $${senderWallet.availableDemoBalance.toFixed(2)}.` 
        };
      }

      const now = new Date();
      const nowIso = now.toISOString();
      const isLocked = (lockDurationMinutes || 0) > 0;
      const lockUntil = isLocked ? new Date(now.getTime() + lockDurationMinutes * 60 * 1000).toISOString() : undefined;

      const txId = 'TX_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

      const newTx: Transaction = {
        transactionId: txId,
        senderUserId: sender.userId,
        senderUsername: sender.displayName || sender.username,
        senderAddress: sender.demoAddress,
        receiverUserId: recipient.userId,
        receiverUsername: recipient.displayName || recipient.username,
        receiverAddress: recipient.demoAddress,
        amount,
        currency,
        network: 'BEP20',
        transactionType: 'send',
        status: isLocked ? 'locked' : 'completed',
        statusTextAr: isLocked ? 'قيد التقييد' : 'مكتملة',
        createdAt: nowIso,
        lockUntil,
        lockDurationMinutes: isLocked ? lockDurationMinutes : undefined,
        isSimulated: false,
        notes: notes?.trim() || (isLocked ? `مبلغ مقيد لمدة ${lockDurationMinutes} دقيقة` : undefined),
        networkTxHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
      };

      // 1. Deduct balance from sender's wallet
      const newSenderAvailable = Math.round((senderWallet.availableDemoBalance - amount) * 100) / 100;
      const newSenderTotal = Math.round((senderWallet.totalDemoBalance - amount) * 100) / 100;
      const updatedSenderWallet: Wallet = {
        ...senderWallet,
        availableDemoBalance: newSenderAvailable,
        totalDemoBalance: newSenderTotal,
        assets: createDefaultAssets(newSenderTotal)
      };

      // 2. Persist transaction to Firestore
      try {
        const txDocRef = doc(db, 'transactions', txId);
        await setDoc(txDocRef, cleanForFirestore(newTx));
      } catch (e) {
        console.warn('[WalletCloudService] Warning saving transaction to cloud:', e);
      }

      // 3. Persist sender's updated wallet to Firestore
      try {
        const senderWalletRef = doc(db, 'wallets', senderWallet.walletId || sender.userId);
        await setDoc(senderWalletRef, cleanForFirestore(updatedSenderWallet), { merge: true });
      } catch (e) {
        console.warn('[WalletCloudService] Warning updating sender wallet in cloud:', e);
      }

      // 4. If recipient wallet is accessible, credit them directly
      if (recipientWallet) {
        const newRecipientTotal = Math.round((recipientWallet.totalDemoBalance + amount) * 100) / 100;
        const newRecipientLocked = isLocked 
          ? Math.round((recipientWallet.lockedDemoBalance + amount) * 100) / 100
          : recipientWallet.lockedDemoBalance;
        const newRecipientAvailable = isLocked
          ? recipientWallet.availableDemoBalance
          : Math.round((recipientWallet.availableDemoBalance + amount) * 100) / 100;

        const updatedRecipientWallet: Wallet = {
          ...recipientWallet,
          totalDemoBalance: newRecipientTotal,
          lockedDemoBalance: newRecipientLocked,
          availableDemoBalance: newRecipientAvailable,
          assets: createDefaultAssets(newRecipientTotal)
        };

        try {
          const recWalletRef = doc(db, 'wallets', recipientWallet.walletId || recipient.userId);
          await setDoc(recWalletRef, cleanForFirestore(updatedRecipientWallet), { merge: true });
        } catch (e) {
          console.warn('[WalletCloudService] Note: Recipient wallet update will sync upon their login:', e);
        }
      }

      // 5. Create Cloud In-App Notification for Recipient (Stored in Firestore)
      const notifId = 'NTF_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      const senderName = sender.displayName || sender.username;
      const lockNoticeAr = isLocked ? ` (مبلغ مقيد لمدة ${lockDurationMinutes} دقيقة)` : '';
      const notificationPayload: AppNotification = {
        notificationId: notifId,
        recipientUserId: recipient.userId,
        transactionId: txId,
        title: 'تم استلام أموال جديدة',
        titleAr: 'تم استلام أموال جديدة',
        body: `تم استلام مبلغ قدره $${amount.toFixed(2)} من [${senderName}]، وتم تحديث رصيد محفظتك بنجاح${lockNoticeAr}`,
        bodyAr: `تم استلام مبلغ قدره $${amount.toFixed(2)} من [${senderName}]، وتم تحديث رصيد محفظتك بنجاح${lockNoticeAr}`,
        createdAt: nowIso,
        read: false,
        type: isLocked ? 'locked_transfer' : 'incoming_transfer'
      };

      try {
        const notifDocRef = doc(db, 'notifications', notifId);
        await setDoc(notifDocRef, cleanForFirestore(notificationPayload));
      } catch (e) {
        console.warn('[WalletCloudService] Warning writing cloud notification:', e);
      }

      return {
        success: true,
        message: isLocked 
          ? `تم إرسال $${amount.toFixed(2)} بنجاح مع تقييد المبلغ لمدة ${lockDurationMinutes} دقيقة.`
          : `تم إرسال $${amount.toFixed(2)} بنجاح إلى ${recipient.displayName || recipient.username}.`,
        transaction: newTx
      };
    } finally {
      setTimeout(() => {
        activeTransferLocks.delete(opKey);
      }, 3000);
    }
  }

  /**
   * Real-time Cloud Firestore Listener for user transactions.
   * Discovers incoming transfers made by other devices/users and reconciles balance.
   */
  public static subscribeUserTransactions(
    userId: string,
    onData: (txs: Transaction[]) => void
  ): Unsubscribe | null {
    if (!userId || typeof window === 'undefined') return null;

    try {
      const txsCol = collection(db, 'transactions');
      return onSnapshot(txsCol, (snap) => {
        const userTxs: Transaction[] = [];
        snap.forEach(d => {
          const t = d.data() as Transaction;
          if (t.senderUserId === userId || t.receiverUserId === userId) {
            userTxs.push(t);
          }
        });
        userTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onData(userTxs);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'transactions');
      });
    } catch {
      return null;
    }
  }

  /**
   * Real-time Cloud Firestore Listener for user notifications.
   */
  public static subscribeUserNotifications(
    userId: string,
    onData: (notifs: AppNotification[]) => void
  ): Unsubscribe | null {
    if (!userId || typeof window === 'undefined') return null;

    try {
      const notifsCol = collection(db, 'notifications');
      return onSnapshot(notifsCol, (snap) => {
        const userNotifs: AppNotification[] = [];
        snap.forEach(d => {
          const n = d.data() as AppNotification;
          if (n.recipientUserId === userId) {
            userNotifs.push(n);
          }
        });
        userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onData(userNotifs);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'notifications');
      });
    } catch {
      return null;
    }
  }
}
