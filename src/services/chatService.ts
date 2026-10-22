import { ChatMessage, Conversation, User } from '../types/wallet';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit
} from 'firebase/firestore';

const LOCAL_STORAGE_CONVERSATIONS = 'twp_conversations_v4';
const LOCAL_STORAGE_MESSAGES = 'twp_chat_messages_v4';

export class ChatService {
  // Helper to compute deterministic conversation ID between two users
  public static getConversationId(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort();
    return `conv_${sorted[0]}_${sorted[1]}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  // Get or initialize conversation between current user and target user
  public static async getOrCreateConversation(
    currentUser: User,
    targetUser: User
  ): Promise<Conversation> {
    const convId = this.getConversationId(currentUser.userId, targetUser.userId);
    const convRef = doc(db, 'conversations', convId);

    try {
      const snap = await getDoc(convRef);
      if (snap.exists()) {
        return snap.data() as Conversation;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `conversations/${convId}`);
    }

    // Create new conversation
    const newConv: Conversation = {
      conversationId: convId,
      participantIds: [currentUser.userId, targetUser.userId],
      participantNames: {
        [currentUser.userId]: currentUser.displayName || currentUser.username,
        [targetUser.userId]: targetUser.displayName || targetUser.username,
      },
      lastMessageText: '',
      lastMessageAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(convRef, newConv, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `conversations/${convId}`);
      // Fallback local save
      this.saveLocalConversation(newConv);
    }

    return newConv;
  }

  // Send a message
  public static async sendMessage(params: {
    conversationId: string;
    sender: User;
    receiver: User;
    text: string;
  }): Promise<ChatMessage | null> {
    const { conversationId, sender, receiver, text } = params;
    const cleanText = text.trim();
    if (!cleanText) return null;

    const messageId = 'msg_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const nowIso = new Date().toISOString();

    const newMsg: ChatMessage = {
      messageId,
      conversationId,
      senderUserId: sender.userId,
      senderUsername: sender.username,
      receiverUserId: receiver.userId,
      text: cleanText,
      createdAt: nowIso,
      read: false,
    };

    // 1. Save message to subcollection in Firestore
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    try {
      await setDoc(msgRef, newMsg);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `conversations/${conversationId}/messages/${messageId}`);
    }

    // 2. Update parent conversation snippet
    const convRef = doc(db, 'conversations', conversationId);
    try {
      await setDoc(convRef, {
        lastMessageText: cleanText,
        lastMessageAt: nowIso,
        updatedAt: nowIso,
        participantIds: [sender.userId, receiver.userId],
        participantNames: {
          [sender.userId]: sender.displayName || sender.username,
          [receiver.userId]: receiver.displayName || receiver.username,
        }
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `conversations/${conversationId}`);
    }

    // Local mirror backup
    this.saveLocalMessage(newMsg);

    return newMsg;
  }

  // Real-time listener for messages in a conversation
  public static subscribeToMessages(
    conversationId: string,
    onMessages: (msgs: ChatMessage[]) => void
  ): () => void {
    const messagesCol = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'), limit(100));

    // First load local cached messages
    const localMsgs = this.getLocalMessages(conversationId);
    if (localMsgs.length > 0) {
      onMessages(localMsgs);
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((d) => {
          msgs.push(d.data() as ChatMessage);
        });
        if (msgs.length > 0) {
          this.setLocalMessages(conversationId, msgs);
          onMessages(msgs);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `conversations/${conversationId}/messages`);
      }
    );

    return unsubscribe;
  }

  // Real-time listener for user's conversations
  public static subscribeToUserConversations(
    userId: string,
    onConversations: (convs: Conversation[]) => void
  ): () => void {
    const convsCol = collection(db, 'conversations');
    const q = query(convsCol, where('participantIds', 'array-contains', userId));

    const localConvs = this.getLocalConversations().filter(c => c.participantIds.includes(userId));
    if (localConvs.length > 0) {
      onConversations(localConvs);
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const convs: Conversation[] = [];
        snapshot.forEach((d) => {
          convs.push(d.data() as Conversation);
        });
        convs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        onConversations(convs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'conversations');
      }
    );

    return unsubscribe;
  }

  // Local caching utilities
  private static getLocalConversations(): Conversation[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveLocalConversation(conv: Conversation) {
    if (typeof window === 'undefined') return;
    try {
      const all = this.getLocalConversations();
      const idx = all.findIndex(c => c.conversationId === conv.conversationId);
      if (idx >= 0) all[idx] = conv;
      else all.unshift(conv);
      localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS, JSON.stringify(all));
    } catch {}
  }

  private static getLocalMessages(conversationId: string): ChatMessage[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_MESSAGES + '_' + conversationId);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static setLocalMessages(conversationId: string, msgs: ChatMessage[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_MESSAGES + '_' + conversationId, JSON.stringify(msgs));
    } catch {}
  }

  private static saveLocalMessage(msg: ChatMessage) {
    if (typeof window === 'undefined') return;
    try {
      const msgs = this.getLocalMessages(msg.conversationId);
      if (!msgs.some(m => m.messageId === msg.messageId)) {
        msgs.push(msg);
        this.setLocalMessages(msg.conversationId, msgs);
      }
    } catch {}
  }
}
