import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, Conversation } from '../types/wallet';
import { ChatService } from '../services/chatService';
import { WalletDatabase } from '../services/walletDb';
import { shortenAddress } from '../utils/formatters';
import { 
  MessageSquare, 
  Send, 
  X, 
  Search, 
  ArrowLeft, 
  CheckCheck, 
  Sparkles 
} from 'lucide-react';

interface ChatModalProps {
  currentUser: User;
  isArabic: boolean;
  onClose: () => void;
  initialRecipient?: User | null;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  currentUser,
  isArabic,
  onClose,
  initialRecipient = null
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activePartner, setActivePartner] = useState<User | null>(initialRecipient);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [isNewChatView, setIsNewChatView] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to user conversations
  useEffect(() => {
    const unsub = ChatService.subscribeToUserConversations(currentUser.userId, (convs) => {
      setConversations(convs);
    });
    return () => unsub();
  }, [currentUser.userId]);

  // Handle initial recipient if passed
  useEffect(() => {
    if (initialRecipient) {
      openChatWithUser(initialRecipient);
    }
  }, [initialRecipient]);

  // Subscribe to messages in active conversation
  useEffect(() => {
    if (!activeConversation) return;

    const unsub = ChatService.subscribeToMessages(activeConversation.conversationId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsub();
  }, [activeConversation]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChatWithUser = async (targetUser: User) => {
    setActivePartner(targetUser);
    setIsNewChatView(false);
    const conv = await ChatService.getOrCreateConversation(currentUser, targetUser);
    setActiveConversation(conv);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation || !activePartner || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await ChatService.sendMessage({
        conversationId: activeConversation.conversationId,
        sender: currentUser,
        receiver: activePartner,
        text: textToSend
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const allUsers = WalletDatabase.getUsers().filter(u => u.userId !== currentUser.userId);
  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.demoAddress.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg h-[85vh] max-h-[640px] rounded-3xl bg-[#0b111e] border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeConversation ? (
              <button
                onClick={() => {
                  setActiveConversation(null);
                  setActivePartner(null);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
            ) : null}

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {activePartner 
                    ? activePartner.displayName 
                    : (isArabic ? 'المراسلة الفورية المشفرة' : 'Encrypted Chat')}
                </h3>
                <span className="text-[10px] text-slate-400 block">
                  {activePartner 
                    ? `@${activePartner.username} • ${shortenAddress(activePartner.demoAddress)}` 
                    : (isArabic ? 'مزامنة مباشرة عبر Firebase' : 'Synced live via Firebase')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!activeConversation && !isNewChatView && (
              <button
                onClick={() => setIsNewChatView(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isArabic ? 'محادثة جديدة' : 'New Chat'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* View 1: Active Chat Thread */}
          {activeConversation && activePartner ? (
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-300">
                    {isArabic ? 'ابدأ المحادثة الآن' : 'Start the conversation'}
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    {isArabic 
                      ? `أرسل رسالة إلى ${activePartner.displayName} لتأكيد المعاملات ومتابعة التحويلات بأمان.` 
                      : `Send a message to ${activePartner.displayName} to coordinate transfers securely.`}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderUserId === currentUser.userId;
                  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={msg.messageId}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-3 text-xs ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                          : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                      }`}>
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                          isMe ? 'text-blue-200' : 'text-slate-400'
                        }`}>
                          <span>{time}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-blue-200" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : isNewChatView ? (
            /* View 2: User Search / Select for New Chat */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  {isArabic ? 'اختر مستخدماً لمراسلته' : 'Select a user to chat'}
                </span>
                <button
                  onClick={() => setIsNewChatView(false)}
                  className="text-xs text-blue-400 hover:underline"
                >
                  {isArabic ? 'رجوع' : 'Back'}
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder={isArabic ? 'ابحث باسم المستخدم أو العنوان...' : 'Search by username or address...'}
                  className="w-full py-2.5 px-9 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2 pt-1">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    {isArabic ? 'لم يتم العثور على مستخدمين مطابقين' : 'No matching users found'}
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u.userId}
                      onClick={() => openChatWithUser(u)}
                      className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{u.displayName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                        {isArabic ? 'مراسلة' : 'Chat'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* View 3: Conversations List */
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
                    <MessageSquare className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-300">
                    {isArabic ? 'لا توجد محادثات نشطة حالياً' : 'No active conversations'}
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    {isArabic 
                      ? 'ابدأ محادثة جديدة وتواصل مع المستخدمين الآخرين بأمان عبر التطبيق.' 
                      : 'Start a new conversation and message other users securely.'}
                  </p>
                  <button
                    onClick={() => setIsNewChatView(true)}
                    className="mt-2 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
                  >
                    {isArabic ? 'بدء محادثة جديدة' : 'Start New Conversation'}
                  </button>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherId = conv.participantIds.find(id => id !== currentUser.userId);
                  const otherName = otherId ? (conv.participantNames[otherId] || 'مستخدم') : 'مستخدم';
                  const otherUser = otherId ? WalletDatabase.getUserById(otherId) : null;

                  return (
                    <div
                      key={conv.conversationId}
                      onClick={() => {
                        if (otherUser) {
                          openChatWithUser(otherUser);
                        } else if (otherId) {
                          setActivePartner({
                            userId: otherId,
                            username: otherName,
                            displayName: otherName,
                            role: 'user',
                            accountStatus: 'active',
                            createdAt: '',
                            lastActivityAt: '',
                            walletId: '',
                            demoAddress: ''
                          });
                          setActiveConversation(conv);
                        }
                      }}
                      className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {otherName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white truncate">{otherName}</span>
                          <span className="text-[11px] text-slate-400 truncate">
                            {conv.lastMessageText || (isArabic ? 'لا توجد رسائل بعد' : 'No messages yet')}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 text-[10px] text-slate-500">
                        <span>
                          {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' }) : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Input Bar (Only visible in active chat) */}
        {activeConversation && activePartner && (
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isArabic ? 'اكتب رسالتك هنا...' : 'Type your message...'}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
