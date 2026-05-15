import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  ChevronRight,
  Shield,
  Clock,
  User as UserIcon,
  Sparkles,
  Phone,
  Gift
} from 'lucide-react';
import { 
  db, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { handleGiftPurchase } from '../services/walletService';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content?: string;
  fileUrl?: string;
  fileType: 'text' | 'image' | 'video' | 'file';
  timestamp: Timestamp | null;
}

interface ChatWindowProps {
  room: { id: string; name: string; is_group: boolean };
  user: any;
  onBack: () => void;
}

export default function ChatWindow({ room, user, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'rooms', room.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
      
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `rooms/${room.id}/messages`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [room.id]);

  const handleSendMessage = async (e?: React.FormEvent, fileData?: { url: string, type: 'image' | 'video' }) => {
    e?.preventDefault();
    if (!newMessage.trim() && !fileData) return;

    const messageData: any = {
      senderId: user.uid,
      senderName: user.displayName || user.email.split('@')[0],
      timestamp: serverTimestamp(),
      fileType: fileData ? fileData.type : 'text'
    };

    if (newMessage.trim()) messageData.content = newMessage;
    if (fileData) {
      messageData.fileUrl = fileData.url;
    }

    try {
      setNewMessage('');
      await addDoc(collection(db, 'rooms', room.id, 'messages'), messageData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `rooms/${room.id}/messages`);
    }
  };

  const handleAttachImage = () => {
    const url = prompt('أدخل رابط الصورة الملكية:');
    if (url) {
      handleSendMessage(undefined, { url, type: 'image' });
    }
  };

  const handleSendGift = async () => {
    const giftName = prompt('اختر هدية (تاج: 100، نجمة: 50، ماسة: 200):');
    if (!giftName) return;

    let price = 50;
    if (giftName.includes('تاج')) price = 100;
    if (giftName.includes('ماسة')) price = 200;

    const success = await handleGiftPurchase(user.uid, price);
    if (success) {
      handleSendMessage(undefined, { url: `GIFT:${giftName}`, type: 'file' as any });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden">
      {/* Header */}
      <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between backdrop-blur-md bg-dark-bg/80 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="lg:hidden text-gold p-2">
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="w-12 h-12 border border-gold/30 p-0.5 bg-dark-bg">
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <span className="text-gold font-bold">{room.name.charAt(0)}</span>
            </div>
          </div>
          <div className="text-right" dir="rtl">
            <h2 className="text-lg font-bold text-gold tracking-tight">{room.name}</h2>
            <div className="flex items-center gap-2 text-[10px] text-gray-text uppercase tracking-widest font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              قناة سيادية مشفرة
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => (window as any).simulateIncomingCall?.()}
            className="text-gray-text hover:text-gold transition-colors p-2"
            title="Simulate Call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 border border-gold/20 rounded-full">
            <Shield className="w-3 h-3 text-gold" />
            <span className="text-[10px] text-gold uppercase tracking-[0.2em]">E2EE Secured</span>
          </div>
          <button className="text-gray-text hover:text-gold transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth custom-scrollbar">
        {messages.map((msg, idx) => {
          const isOwn = msg.senderId === user.uid;
          return (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] group ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isOwn && (
                  <span className="text-[9px] text-gold uppercase tracking-widest mb-1 px-1 font-bold">
                    {msg.senderName}
                  </span>
                )}
                <div className={`
                    px-5 py-3 text-sm leading-relaxed overflow-hidden
                    ${isOwn 
                      ? 'bg-gold text-dark-bg font-semibold rounded-none rounded-tl-2xl' 
                      : 'bg-[#111] text-off-white border border-white/5 rounded-none rounded-tr-2xl'
                    }
                  `}
                >
                  {msg.fileType === 'image' && msg.fileUrl && (
                    <img 
                      src={msg.fileUrl} 
                      alt="attachment" 
                      className="max-w-full rounded-lg mb-2 border border-white/10" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {msg.fileType === 'video' && msg.fileUrl && (
                    <video 
                      src={msg.fileUrl} 
                      controls 
                      className="max-w-full rounded-lg mb-2 border border-white/10" 
                    />
                  )}
                  {msg.content}
                </div>
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Clock className="w-3 h-3 text-gray-text" />
                  <span className="text-[9px] text-gray-text font-mono">
                    {msg.timestamp ? (msg.timestamp as Timestamp).toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-8 border-t border-white/5 backdrop-blur-md bg-dark-bg/50">
        <form onSubmit={(e) => handleSendMessage(e)} className="relative flex items-center gap-6">
          <button 
            type="button" 
            onClick={handleAttachImage}
            className="text-gray-text hover:text-gold transition-colors"
          >
            <Paperclip className="w-6 h-6" />
          </button>

          <button 
            type="button" 
            onClick={handleSendGift}
            className="text-gray-text hover:text-gold transition-colors"
          >
            <Gift className="w-6 h-6" />
          </button>
          
          <div className="relative flex-1 group">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتب رسالة ملكية مشفرة..."
              dir="rtl"
              className="w-full bg-[#0c0c0c] border border-white/10 px-8 py-4 text-sm focus:outline-none focus:border-gold/50 text-off-white transition-all placeholder:text-gray-text/30"
            />
            <div className="absolute inset-0 border border-gold/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
          </div>

          <motion.button 
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              p-4 rounded-none transition-all duration-300
              ${newMessage.trim() ? 'bg-gold text-dark-bg shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'bg-white/5 text-gray-text'}
            `}
          >
            <Send className="w-6 h-6 rotate-180" />
          </motion.button>
        </form>
        <div className="mt-4 flex justify-center items-center gap-2 text-gray-text opacity-30">
          <Sparkles className="w-3 h-3" />
          <span className="text-[8px] uppercase tracking-[0.5em]">End-to-End Sovereignty Guaranteed</span>
        </div>
      </div>
    </div>
  );
}
