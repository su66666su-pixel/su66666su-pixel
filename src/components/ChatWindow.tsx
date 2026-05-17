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
  Gift as GiftIcon,
  X,
  Check,
  CheckCheck,
  ShieldCheck,
  MessageCircle,
  TriangleAlert,
  Trash2,
  Timer,
  Flame
} from 'lucide-react';
import { 
  db, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { handleGiftPurchase } from '../services/walletService';
import { supabase } from '../supabase';
import GiftSelector from './GiftSelector';
import { useToast } from './Toast';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  limit,
  doc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content?: string;
  fileUrl?: string;
  fileType: 'text' | 'image' | 'video' | 'file';
  timestamp: Timestamp | null;
  readBy?: string[];
  burnAfter?: number | null;
}

interface ChatWindowProps {
  room: { id: string; name: string; is_group: boolean; memberIds?: string[] };
  user: any;
  onBack: () => void;
  onStartVideoCall: (name: string, id: string) => void;
}

export default function ChatWindow({ room, user, onBack, onStartVideoCall }: ChatWindowProps) {
  const [isSelfDestruct, setIsSelfDestruct] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Self-Destruct Timer Logic
  useEffect(() => {
    const timers: { [key: string]: NodeJS.Timeout } = {};
    
    messages.forEach(msg => {
        if (msg.burnAfter && msg.timestamp && !timers[msg.id]) {
            const timePassed = (Date.now() - msg.timestamp.toMillis()) / 1000;
            const remaining = msg.burnAfter - timePassed;
            
            if (remaining <= 0) {
                deleteMessage(msg.id);
            } else {
                timers[msg.id] = setTimeout(() => {
                    deleteMessage(msg.id);
                }, remaining * 1000);
            }
        }
    });

    return () => {
        Object.values(timers).forEach(clearTimeout);
    };
  }, [messages]);
  const [showGifts, setShowGifts] = useState(false);
  const { showToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sender_name,
          file_url,
          file_type,
          read_by,
          profiles:sender_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('room_id', room.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const historyMsgs: Message[] = data.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.profiles?.username || msg.sender_name,
          senderAvatar: msg.profiles?.avatar_url,
          content: msg.content,
          fileUrl: msg.file_url,
          fileType: msg.file_type || 'text',
          readBy: msg.read_by || [],
          timestamp: { toDate: () => new Date(msg.created_at) } as any
        }));
        setMessages(historyMsgs);
      }
    };

    fetchHistory();

    // 1. Initial history and live updates from Firebase (Current source of truth)
    const messagesQuery = query(
      collection(db, 'rooms', room.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id
        };
      }) as Message[];
      setMessages(msgs);
      setLoading(false);
      
      // Efficient Mark as Read
      const unreadMessages = snapshot.docs.filter(messageDoc => {
        const data = messageDoc.data();
        return data.senderId !== user.uid && (!data.readBy || !data.readBy.includes(user.uid));
      });

      if (unreadMessages.length > 0) {
        Promise.all(unreadMessages.map(async (messageDoc) => {
          try {
            const messageRef = doc(db, 'rooms', room.id, 'messages', messageDoc.id);
            await updateDoc(messageRef, {
              readBy: arrayUnion(user.uid)
            });
            
            // Sync with Supabase via Real-time Broadcast (Requested Sovereignty Protocol)
            channel.send({
              type: 'broadcast',
              event: 'read_receipt',
              payload: { messageId: messageDoc.id, userId: user.uid }
            });
          } catch (err) {
            console.debug("Read receipt sync failed:", err);
          }
        }));
      }

      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `rooms/${room.id}/messages`);
      setLoading(false);
    });

    // 2. Real-time broadcast from Supabase (Requested Sovereignty Protocol)
    const channel = supabase.channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` },
        (payload) => {
          console.log('وصلت رسالة ملكية جديدة (Supabase):', payload.new);
          const msg = payload.new as any;
          
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            const formattedMsg: Message = {
              id: msg.id,
              senderId: msg.sender_id,
              senderName: msg.sender_name,
              content: msg.content,
              fileUrl: msg.file_url,
              fileType: msg.file_type || 'text',
              readBy: msg.read_by || [],
              timestamp: msg.created_at ? { toDate: () => new Date(msg.created_at) } as any : null
            };
            return [...prev, formattedMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` },
        (payload) => {
          const updatedMsg = payload.new as any;
          setMessages(prev => prev.map(m => 
            m.id === updatedMsg.id ? { ...m, readBy: updatedMsg.read_by || m.readBy } : m
          ));
        }
      )
      .on('broadcast', { event: 'read_receipt' }, (payload) => {
        const { messageId, userId } = payload.payload;
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { 
            ...m, 
            readBy: m.readBy?.includes(userId) ? m.readBy : [...(m.readBy || []), userId] 
          } : m
        ));
      })
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  const deleteMessage = async (messageId: string) => {
    try {
      setIsDeleting(true);
      // 1. Delete from Firebase
      const { deleteDoc, doc: fireDoc } = await import('firebase/firestore');
      await deleteDoc(fireDoc(db, 'rooms', room.id, 'messages', messageId));

      // 2. Delete from Supabase
      await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      showToast("تم حذف الرسالة بنجاح 🗑️", 'info');
    } catch (err: any) {
      console.error("Delete failed:", err);
      try {
        handleFirestoreError(err, OperationType.DELETE, `rooms/${room.id}/messages/${messageId}`);
      } catch (jsonErr: any) {
        showToast("فشل الحذف الملكي (صلاحيات): " + jsonErr.message, 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, fileData?: { url: string, type: 'image' | 'video' | 'file' }) => {
    e?.preventDefault();
    if (!newMessage.trim() && !fileData) return;

    const messageData: any = {
      senderId: user.uid,
      senderName: user.displayName || user.email.split('@')[0],
      timestamp: serverTimestamp(),
      fileType: fileData ? fileData.type : 'text',
      burnAfter: isSelfDestruct ? 10 : null
    };

    if (newMessage.trim()) messageData.content = newMessage;
    if (fileData) {
      messageData.fileUrl = fileData.url;
    }

    try {
      const textToSend = newMessage;
      setNewMessage('');
      setIsSelfDestruct(false);
      
      // 1. Send to Firebase (Legacy)
      const docRef = await addDoc(collection(db, 'rooms', room.id, 'messages'), {
        ...messageData,
        readBy: [user.uid]
      });

      // 2. Send to Supabase (Real-time Sovereignty)
      await supabase
        .from('messages')
        .insert({
          id: messageData.id || docRef.id, // Sync IDs between platforms
          room_id: room.id,
          sender_id: user.uid,
          sender_name: messageData.senderName,
          content: textToSend || null,
          file_url: fileData?.url || null,
          file_type: fileData?.type || 'text',
          burn_after: messageData.burnAfter,
          read_by: [user.uid], // Sync readBy
          created_at: new Date().toISOString()
        });

      // 3. Trigger AI Support if this is a support room
      if ((room as any).isSupport && textToSend) {
        handleIncomingAiSupport(textToSend, user.uid, messageData.senderName);
      }

      // 4. Update room last message and timestamp (Requested Sovereignty Protocol)
      const lastMsgText = fileData 
        ? (fileData.type === 'image' ? '📷 صورة ملكية' : fileData.type === 'video' ? '🎥 فيديو ملكي' : '📁 ملف ملكي') 
        : textToSend;

      try {
        await updateDoc(doc(db, 'rooms', room.id), {
          lastMessage: lastMsgText,
          lastMessageTime: serverTimestamp(),
          unreadCount: 0 // Reset unread when owner sends
        });

        await supabase
          .from('rooms')
          .update({
            last_message: lastMsgText,
            last_message_time: new Date().toISOString()
          })
          .eq('id', room.id);
      } catch (sumErr) {
        console.debug("Room summary update failed (Expected if Supabase table not fully initialized):", sumErr);
      }
        
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!previewFile) return;

    const file = previewFile;
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `uploads/${fileName}`;

    setIsUploading(true);
    try {
      // 1. Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('snns-files')
        .upload(filePath, file);

      if (error) {
        alert("فشل الرفع الملكي: " + error.message);
        return;
      }

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('snns-files')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      const type = file.type.startsWith('video') ? 'video' : 'image';

      // 3. Send message
      handleSendMessage(undefined, { url: publicUrl, type: type as any });
      handleCancelUpload();
    } catch (err) {
      console.error("Upload error:", err);
      alert("حدث خطأ أثناء الرفع الملكي.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const startCall = () => {
    const otherId = room.memberIds?.find(id => id !== user.uid);
    if (!otherId || room.is_group) {
      showToast("المكالمات متوفرة فقط في المحادثات الثنائية حالياً", 'info');
      return;
    }

    // Notify ChatList to open VideoCall UI
    onStartVideoCall(room.name, otherId);

    // Send Signal to Target User's personal inbox channel
    const inboxChannel = supabase.channel(`inbox_${otherId}`);
    inboxChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        inboxChannel.send({
          type: 'broadcast',
          event: 'call_request',
          payload: { 
            callerName: user.displayName || user.email.split('@')[0], 
            callerId: user.uid 
          }
        }).then(() => {
          supabase.removeChannel(inboxChannel);
        });
      }
    });
  };
  const handleSendGift = async (gift: any) => {
    setShowGifts(false);
    
    const success = await handleGiftPurchase(user.uid, gift.points);
    if (success) {
      handleSendMessage(undefined, { url: `GIFT:${gift.emoji} ${gift.name}`, type: 'file' as any });
      showToast(`تم إرسال ${gift.name} بنجاح! 👑`, 'royal');
    } else {
      showToast("عذراً، رصيدك غير كافٍ لهذا الكرم الملكي!", 'error');
    }
  };

  const sendTelegramAlert = (msg: string) => {
    console.log("📡 [TELEGRAM ALERT SYSTEM]:", msg);
    // In a real production environment, this would call a backend function to notify admins
  };

  const handleIncomingAiSupport = async (messageContent: string, senderId: string, senderName: string) => {
    const content = messageContent.toLowerCase();
    let aiResponse = "";

    // 1. Analyze issue based on keywords
    if (content.includes("كود") || content.includes("تفعيل") || content.includes("اشتراك")) {
        aiResponse = `أهلاً بك مستكشف [ ${senderName} ]، إذا واجهت مشكلة UUID في رمز التفعيل، فضلاً تأكد من تسجيل الخروج والدخول مرة أخرى عبر Google لتحديث رخصتك السيادية في النظام الحركي لـ SNNS.`;
    } 
    else if (content.includes("اتصال") || content.includes("كاميرا") || content.includes("صوت")) {
        aiResponse = `مرحباً بك، نظام الاتصال المرئي في SNNS يعتمد بروتوكول P2P المشفر بالكامل. فضلاً امنح متصفحك صلاحية الوصول للكاميرا والميكروفون من إعدادات القفل في شريط الرابط أعلى الشاشة لتبدأ البث الحقيقي.`;
    }
    else if (content.includes("بلاغ") || content.includes("اختراق") || content.includes("حظر")) {
        aiResponse = `🚨 تم التقاط البلاغ الأمني بنجاح وتحويله فوراً لغرفة القيادة والسيطرة الخاصة بالمسؤول سلطان القحطاني. يجري فحص العقدة الآن.`;
        sendTelegramAlert(`🚨 بلاغ أمني عاجل من ${senderName}: ${messageContent}`);
    }

    // 2. Generate AI response if match found
    if (aiResponse) {
        setTimeout(async () => {
            const aiBotId = '00000000-0000-0000-0000-000000000000';
            const aiBotName = '💡 SNNS AI المساعد الذكي';

            // Insert into Firebase
            await addDoc(collection(db, 'rooms', room.id, 'messages'), {
                senderId: aiBotId,
                senderName: aiBotName,
                content: aiResponse,
                timestamp: serverTimestamp(),
                fileType: 'text',
                readBy: [aiBotId]
            });

            // Insert into Supabase
            await supabase.from('messages').insert({
                room_id: room.id,
                sender_id: aiBotId,
                sender_name: aiBotName,
                content: aiResponse,
                channel_type: 'support', // As requested in snippet
                created_at: new Date().toISOString()
            });

            // Update room summary (Requested Sovereignty Protocol)
            try {
              await updateDoc(doc(db, 'rooms', room.id), {
                lastMessage: aiResponse,
                lastMessageTime: serverTimestamp()
              });

              await supabase
                .from('rooms')
                .update({
                  last_message: aiResponse,
                  last_message_time: new Date().toISOString()
                })
                .eq('id', room.id);
            } catch (err) {
              console.error("AI Support room update failed", err);
            }
        }, 1500);
    }
  };

  const formatMessageTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate();
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    
    // Check for yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    
    if (isToday) {
      return date.toLocaleTimeString([], timeOptions);
    } else if (isYesterday) {
      return `Yesterday, ${date.toLocaleTimeString([], timeOptions)}`;
    } else {
      return date.toLocaleDateString([], { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-royal-black relative overflow-hidden">
      {/* Header */}
      {(() => {
        const isSupportRoom = (room as any).isSupport;
        const isVerificationRoom = room.name.includes("التوثيق"); // Anticipating future verification rooms
        
        let headerName = room.name;
        let headerDesc = "منصة التواصل الفورية الآمنة للمستكشفين";
        let headerIcon = <MessageCircle className="w-5 h-5 text-[#22c55e] drop-shadow-[0_0_5px_#22c55e]" />;
        let iconBg = "bg-black border border-[#22c55e]/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]";

        if (isSupportRoom) {
          headerName = "البلاغات والمشاكل التقنية";
          headerDesc = "نظام الرد الذكي الفوري وبلاغات السيرفر";
          headerIcon = <TriangleAlert className="w-5 h-5 text-red-500 drop-shadow-[0_0_5px_#ef4444]" />;
          iconBg = "bg-black border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
        } else if (isVerificationRoom) {
          headerName = "مركز التوثيق السيادي";
          headerDesc = "إدارة طلبات الرخص وتوثيق الهوية الرقمية";
          headerIcon = <ShieldCheck className="w-5 h-5 text-[#D4AF37] drop-shadow-[0_0_5px_#D4AF37]" />;
          iconBg = "bg-black border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]";
        }

        return (
          <header className="border-b border-gray-900 p-4 flex justify-between items-center bg-[#050505] font-cairo select-none z-10" dir="rtl">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="lg:hidden text-gray-400 hover:text-white p-1 ml-1">
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-500 ${iconBg}`}>
                    {headerIcon}
                </div>
                <div className="text-right">
                    <h2 className="text-white text-lg font-black tracking-wide">{headerName}</h2>
                    <p className="text-gray-500 text-[10px] mt-0.5">{headerDesc}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button 
                  onClick={startCall}
                  className="p-2.5 bg-[#0a0a0a] border border-gray-900 rounded-xl text-gray-400 hover:text-[#22c55e] hover:border-[#22c55e]/30 transition-all duration-300"
                  title="Sovereign Call"
                >
                    <Phone className="w-4 h-4" />
                </button>
                <div className="hidden md:flex items-center gap-1.5 bg-[#080808] border border-gray-900 px-3 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-gray-400 font-mono tracking-wider">E2EE SECURED</span>
                </div>
                <button className="text-gray-600 hover:text-white transition-colors p-1">
                  <MoreVertical className="w-5 h-5" />
                </button>
            </div>
          </header>
        );
      })()}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth custom-scrollbar">
      {messages.map((msg, idx) => {
          const isOwn = msg.senderId === user.uid;
          const isAi = msg.senderId === '00000000-0000-0000-0000-000000000000';
          
          return (
            <motion.div
              key={`msg-${msg.id || 'un-' + idx}-${idx}`}
              initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} my-2 font-cairo group relative`}
            >
              <div className={`max-w-[85%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {/* Header Info */}
                <div className={`flex items-center gap-2 mb-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className={`${isOwn ? 'text-royal-black' : isAi ? 'text-neon-gold' : 'text-[#22c55e]'} font-black text-xs tracking-wide cursor-pointer hover:underline`}>
                      {isOwn ? 'أنت' : msg.senderName}
                    </span>
                    {!isOwn && (isAi ? <Sparkles className="w-3 h-3 text-neon-gold animate-pulse" /> : <ShieldCheck className="w-3 h-3 text-[#22c55e]" />)}
                    {isAi && <Timer className="w-3 h-3 text-neon-gold text-[10px] animate-pulse" />}
                </div>

                {/* Message Bubble */}
                <div className="relative group/bubble flex items-center">
                    {/* Hover Actions (Delete) */}
                    <div className={`
                        absolute ${isOwn ? '-left-12' : '-right-12'} top-1/2 -translate-y-1/2 flex items-center gap-1.5 
                        opacity-0 group-hover/bubble:opacity-100 transition-all duration-300 scale-90 group-hover/bubble:scale-100
                    `}>
                        {isOwn && (
                          <button 
                            onClick={() => deleteMessage(msg.id)}
                            disabled={isDeleting}
                            className="w-7 h-7 bg-black border border-red-950 text-red-500 hover:bg-red-600 hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 shadow-md" 
                            title="مسح الرسالة نهائياً"
                          >
                              <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                    </div>

                    <div className={`
                        relative px-5 py-3 text-sm leading-relaxed shadow-xl transition-all duration-300
                        ${isOwn 
                          ? 'bg-neon-gold text-royal-black font-bold rounded-2xl rounded-tl-none shadow-[0_4px_15px_rgba(255,215,0,0.15)]' 
                          : 'bg-[#0d0d0d] border border-gray-900 text-gray-100 font-medium rounded-2xl rounded-tr-none'
                        }
                        ${isAi ? 'border-neon-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.05)]' : ''}
                        ${msg.burnAfter ? 'border-red-500/30' : ''}
                      `}
                    >
                      {msg.burnAfter && (
                        <div className="absolute -top-2 -left-2 bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-mono animate-pulse flex items-center gap-1 shadow-lg z-20">
                          <Flame className="w-2 h-2" />
                          <span>SELF-DESTRUCT ACTIVE</span>
                        </div>
                      )}
                      {msg.fileType === 'file' && msg.fileUrl?.startsWith('GIFT:') && (
                        <div className="flex flex-col items-center gap-2 p-4 bg-neon-gold/10 border border-neon-gold/20 rounded-xl mb-2">
                           <GiftIcon className="w-8 h-8 text-neon-gold animate-bounce" />
                           <span className="text-xl">{msg.fileUrl.split(':')[1].split(' ')[0]}</span>
                           <span className="font-black text-[10px] text-neon-gold uppercase tracking-widest">
                             {msg.fileUrl.split(' ')[1]}
                           </span>
                        </div>
                      )}
                      
                      {msg.fileType === 'image' && msg.fileUrl && !msg.fileUrl.startsWith('GIFT:') && (
                        <div className="relative group/img cursor-zoom-in">
                          <img 
                            src={msg.fileUrl} 
                            alt="attachment" 
                            className="max-w-full rounded-lg mb-2 border border-white/5 transition-transform group-hover/img:scale-[1.01]" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      
                      {msg.fileType === 'video' && msg.fileUrl && (
                        <video 
                          src={msg.fileUrl} 
                          controls 
                          className="max-w-full rounded-lg mb-2 border border-white/5" 
                        />
                      )}
                      
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      <div className={`flex items-center gap-1.5 mt-2.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`text-[9px] font-mono tracking-tighter ${isOwn ? 'text-royal-black/60' : 'text-gray-500'}`}>
                          {formatMessageTime(msg.timestamp)}
                        </div>
                        {isOwn && (
                          <span className="opacity-60">
                            {msg.readBy && msg.readBy.length > 1 ? (
                              <CheckCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Preview Container */}
      <AnimatePresence mode="wait">
        {previewUrl && (
          <motion.div 
            key="chat-file-preview"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="relative p-6 bg-[#111] border-t border-dim-gold/50 flex flex-col items-center bg-royal-black/90 backdrop-blur-xl z-20"
          >
            <button 
              onClick={handleCancelUpload}
              className="absolute top-4 right-4 text-red-500 hover:text-red-400 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <X className="w-5 h-5" /> 
              </div>
            </button>
            
            <div className="max-w-xs max-h-64 rounded-none overflow-hidden border-2 border-neon-gold shadow-[0_0_30px_rgba(255,215,0,0.2)] bg-black">
              {previewFile?.type.startsWith('video') ? (
                <video src={previewUrl} controls className="max-w-full" />
              ) : (
                <img src={previewUrl} alt="Preview" className="max-w-full" />
              )}
            </div>

            <button 
              onClick={handleConfirmUpload}
              disabled={isUploading}
              className={`
                mt-6 bg-neon-gold text-royal-black px-12 py-3 rounded-none font-black uppercase tracking-widest text-xs
                shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105 transition-all
                ${isUploading ? 'uploading opacity-50' : ''}
              `}
            >
              {isUploading ? 'جاري الرفع...' : 'إرسال الآن ✨'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-8 border-t border-white/5 backdrop-blur-md bg-royal-black/50">
        <form onSubmit={(e) => handleSendMessage(e)} className="relative flex items-center gap-6">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/*"
            className="hidden"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`text-gray-text hover:text-neon-gold transition-colors ${isUploading ? 'uploading pointer-events-none' : ''}`}
          >
            <Paperclip className={`w-6 h-6 ${isUploading ? 'animate-spin' : ''}`} />
          </button>

          <button 
            type="button" 
            onClick={() => setShowGifts(true)}
            className="text-gray-text hover:text-neon-gold transition-colors"
          >
            <GiftIcon className="w-6 h-6" />
          </button>
          
          <button 
            type="button" 
            onClick={() => setIsSelfDestruct(!isSelfDestruct)}
            className={`p-2 rounded-xl transition-all ${isSelfDestruct ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-gray-text hover:text-red-500'}`}
            title="تفعيل التدمير الذاتي (١٠ ثواني)"
          >
            <Flame className={`w-5 h-5 ${isSelfDestruct ? 'animate-pulse' : ''}`} />
          </button>
          
          <div className="relative flex-1 group">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isSelfDestruct ? "رسالة ستدمر ذاتياً (١٠ ثواني)..." : "اكتب رسالة ملكية مشفرة..."}
              dir="rtl"
              className={`w-full transition-all px-8 py-4 text-sm ${isSelfDestruct ? 'bg-red-950/10 border-red-900/40 focus:border-red-500/60' : 'royal-input'}`}
            />
            <div className="absolute inset-0 border border-neon-gold/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
          </div>

          <motion.button 
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              p-4 rounded-none transition-all duration-300
              ${newMessage.trim() ? 'bg-neon-gold text-royal-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'bg-white/5 text-gray-text'}
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
      
      <AnimatePresence mode="wait">
        {showGifts && (
          <GiftSelector 
            onSendGift={handleSendGift}
            onClose={() => setShowGifts(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
