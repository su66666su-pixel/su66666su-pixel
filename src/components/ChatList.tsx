import { 
  Search, 
  MessageSquare, 
  Settings, 
  Users, 
  LogOut, 
  Plus, 
  Crown,
  CheckCheck,
  Loader2,
  ShieldAlert,
  Phone,
  LayoutDashboard,
  Trees,
  Sword,
  MessageCircle,
  ShieldCheck,
  TriangleAlert,
  ChevronLeft,
  Clapperboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import ChatWindow from './ChatWindow';
import VideoFeed from './VideoFeed';
import IncomingCallModal from './IncomingCallModal';
import VideoCall from './VideoCall';
import ActiveUsersSidebar from './ActiveUsersSidebar';
import ProfileManagementModal from './ProfileManagementModal';
import AdminDashboard from './AdminDashboard';
import SubscriptionNotice from './SubscriptionNotice';
import { useToast } from './Toast';

interface ChatRoom {
  id: string;
  name: string;
  is_group: boolean;
  avatar_url: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  memberIds?: string[];
}

interface ChatItemProps {
  room: ChatRoom;
  isActive?: boolean;
  onClick: () => void;
}

const ringtones = {
    cyber_neon: 'https://snns.pro/sounds/cyber_neon.mp3',
    sovereign_alert: 'https://snns.pro/sounds/sovereign_alert.mp3',
    classic_secure: 'https://snns.pro/sounds/classic_secure.mp3'
};

const ChatItem: React.FC<ChatItemProps> = ({ room, isActive, onClick }) => {
  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ backgroundColor: "rgba(212, 175, 55, 0.05)" }}
      className={`flex items-center p-5 cursor-pointer border-b border-white/5 transition-all relative group ${isActive ? 'bg-gold/5 border-r-4 border-r-gold' : ''}`}
    >
      <div className="relative shrink-0">
        <div className={`w-14 h-14 rounded-none border border-gold/30 p-0.5 overflow-hidden bg-dark-bg ${room.is_group ? 'border-double border-4' : ''}`}>
          {room.is_group ? (
            <div className="w-full h-full flex items-center justify-center bg-white/5">
              <Users className="w-6 h-6 text-gold" />
            </div>
          ) : (
            <img 
              src={room.avatar_url || `https://ui-avatars.com/api/?name=${room.name}&background=111&color=D4AF37`} 
              alt={room.name} 
              className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500" 
            />
          )}
        </div>
      </div>

      <div className="mr-4 flex-1 text-right" dir="rtl">
        <div className="flex justify-between items-start mb-1">
          <h3 className={`font-bold text-sm tracking-tight ${room.is_group ? 'text-gold' : 'text-off-white'}`}>
            {room.name}
          </h3>
          <span className="text-[10px] text-gray-text font-mono uppercase tracking-tighter">
            {room.last_message_time || 'نشط'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-text truncate max-w-[180px] font-medium opacity-80">
            {room.last_message || 'لا توجد رسائل بعد'}
          </p>
          {room.unread_count ? (
            <span className="bg-gold text-dark-bg text-[10px] font-black w-5 h-5 flex items-center justify-center">
              {room.unread_count}
            </span>
          ) : (
             <CheckCheck className="w-3 h-3 text-gold/30" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatList({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callerName: string, callerId: string } | null>(null);
  const [activeCall, setActiveCall] = useState<{ targetName: string, targetId: string } | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [globalRoomId, setGlobalRoomId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'chats' | 'users' | 'videos'>('chats');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { showToast } = useToast();

  const handleSwitchChannel = (channel: 'general' | 'verification' | 'support' | 'videos') => {
    if (channel === 'general') {
      setViewMode('chats');
      if (globalRoomId) {
        const globalRoom = rooms.find(r => r.id === globalRoomId);
        if (globalRoom) {
          setSelectedRoom(globalRoom);
          showToast("تم التحويل إلى شات SNNS العام 👑", 'royal');
        }
      }
    } else if (channel === 'verification') {
      showToast("سيتم فتح نظام طلبات التوثيق السيادي قريباً! 👑", 'info');
    } else if (channel === 'videos') {
      setViewMode('videos');
      setSelectedRoom(null);
      showToast("رادار فيديوهات المستكشفين نشط حالياً! 🎥⚡", 'royal');
    } else if (channel === 'support') {
      const supportRoomName = "الدعم الفني والشكاوي (AI Support)";
      const existingSupportRoom = rooms.find(r => r.name === supportRoomName);
      
      if (existingSupportRoom) {
        setSelectedRoom(existingSupportRoom);
        showToast("تم فتح قناة الدعم الذكي ⚡", 'info');
      } else {
        // Create a dedicated support room for this user
        (async () => {
          try {
            const { addDoc, collection, serverTimestamp, doc, setDoc } = await import('firebase/firestore');
            const roomData = {
              name: supportRoomName,
              is_group: false,
              isSupport: true, 
              memberIds: [user.uid, '00000000-0000-0000-0000-000000000000'],
              lastMessage: 'أهلاً بك في الدعم الفني السيادي. كيف يمكننا مساعدتك؟',
              lastMessageTime: serverTimestamp(),
              createdBy: 'system',
              avatarUrl: ''
            };
            const docRef = await addDoc(collection(db, 'rooms'), roomData);
            
            // Create member records
            await setDoc(doc(db, 'rooms', docRef.id, 'members', user.uid), {
              userId: user.uid,
              role: 'Owner',
              joinedAt: serverTimestamp()
            });
            await setDoc(doc(db, 'rooms', docRef.id, 'members', '00000000-0000-0000-0000-000000000000'), {
              userId: '00000000-0000-0000-0000-000000000000',
              role: 'Admin',
              joinedAt: serverTimestamp()
            });

            setSelectedRoom({ id: docRef.id, ...roomData, is_group: false, avatar_url: '' } as any);
            showToast("رادار الدعم الفني الذكي (AI) نشط وسيتواصل معك خلال دقائق! ⚡", 'info');
          } catch (err) {
            console.error("Support room creation failed", err);
          }
        })();
      }
    }
  };

  const stopRingtone = () => {
    if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
    }
  };

  const playRingtone = (toneKey: keyof typeof ringtones = 'cyber_neon') => {
    stopRingtone();
    const toneUrl = ringtones[toneKey] || ringtones.cyber_neon;
    const audio = new Audio(toneUrl);
    audio.loop = true;
    currentAudioRef.current = audio;
    audio.play().catch(err => {
        console.log("📡 Ringtone failed to play, waiting for user interaction:", err);
    });
  };

  useEffect(() => {
    if (incomingCall) {
        const preferredTone = userProfile?.ringtone || localStorage.getItem(`ringtone_${user.uid}`) || 'cyber_neon';
        playRingtone(preferredTone as any);
    } else {
        stopRingtone();
    }
    return () => stopRingtone();
  }, [incomingCall, userProfile, user.uid]);

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = availableUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const showIncomingCallNotification = (senderName: string, callerId: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification("📞 اتصال سيادي وارد!", {
        body: `المستكشف [ ${senderName} ] يطلب الاتصال بك الآن عبر SNNS.PRO`,
        icon: '/logo.png', // Fallback to a placeholder if logo doesn't exist
        tag: 'incoming-call',
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        setIncomingCall({ callerName: senderName, callerId: callerId });
        notification.close();
      };
    }
  };

  useEffect(() => {
    // Listen for incoming calls via Supabase Realtime broadcast
    if (!user) return;
    
    const callSubscription = supabase.channel(`inbox_${user.uid}`)
      .on('broadcast', { event: 'call_request' }, ({ payload }) => {
        setIncomingCall({ 
          callerName: payload.callerName, 
          callerId: payload.callerId 
        });
        showIncomingCallNotification(payload.callerName, payload.callerId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(callSubscription);
    };
  }, [user.uid]);

  useEffect(() => {
    if (viewMode === 'users') {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .neq('id', user.uid);
          if (data) setAvailableUsers(data);
        } catch (err) {
          console.error("Error fetching users:", err);
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [viewMode, user.uid]);

  useEffect(() => {
    const ensureGlobalRoom = async () => {
      try {
        const { getDocs, query, collection, where, limit, updateDoc, arrayUnion, doc, addDoc } = await import('firebase/firestore');
        const q = query(collection(db, 'rooms'), where('isGlobal', '==', true), limit(1));
        const snapshot = await getDocs(q);
        
        let roomId = '';
        if (snapshot.empty) {
          const docRef = await addDoc(collection(db, 'rooms'), {
            name: 'المجلس الملكي - The Royal Hall',
            isGroup: true,
            isGlobal: true,
            memberIds: [user.uid],
            lastMessage: 'أهلاً بكم في المجلس الملكي السيادي 👑 Welcome to The Royal Hall',
            lastMessageTime: serverTimestamp(),
            createdBy: 'system',
            avatarUrl: ''
          });
          roomId = docRef.id;
        } else {
          roomId = snapshot.docs[0].id;
          const data = snapshot.docs[0].data();
          if (!data.memberIds?.includes(user.uid)) {
            await updateDoc(doc(db, 'rooms', roomId), {
              memberIds: arrayUnion(user.uid)
            });
          }
        }
        setGlobalRoomId(roomId);
      } catch (err) {
        console.error("Global room error:", err);
      }
    };

    const syncUserProfiles = async () => {
      try {
        // 1. Supabase Profile Sync
        const { data: profile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.uid)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') {
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 7);

          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({ 
              id: user.uid, 
              username: user.displayName || user.email?.split('@')[0],
              show_email: false,
              is_premium: false,
              trial_ends_at: trialEndDate.toISOString(),
              is_geo_visible: false,
              role: 'user'
            })
            .select()
            .single();
            
          if (!createError && newProfile) setUserProfile(newProfile);
        } else if (profile) {
          setUserProfile(profile);
          const now = new Date();
          const trialEnd = new Date(profile.trial_ends_at);
          if (now > trialEnd && !profile.is_premium) {
            setIsSubscriptionOpen(true);
          }
        }

        // 2. Firestore Profile Sync
        const { getDoc, setDoc, doc, serverTimestamp } = await import('firebase/firestore');
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL || '',
            tier: 'Citizen',
            createdAt: serverTimestamp()
          });
        }
      } catch (err) {
        console.error("Profile sync error:", err);
      }
    };

    ensureGlobalRoom();
    syncUserProfiles();

    // Expose simulation function to window for the simulate button in ChatWindow
    (window as any).simulateIncomingCall = () => {
      setIncomingCall({ callerName: 'سلطان القحطاني' });
    };

    // Firebase Realtime Listener
    const roomsQuery = query(
      collection(db, 'rooms'),
      where('memberIds', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

      const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const roomData = snapshot.docs.map(doc => {
        const data = doc.data();
        let timeStr = 'نشط';
        if (data.lastMessageTime) {
          const date = (data.lastMessageTime as Timestamp).toDate();
          timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return {
          ...data,
          id: doc.id,
          name: data.name,
          is_group: data.isGroup,
          avatar_url: data.avatarUrl,
          last_message: data.lastMessage,
          last_message_time: timeStr,
          unread_count: data.unreadCount,
          memberIds: data.memberIds
        } as ChatRoom;
      });
      const sortedRooms = roomData.sort((a, b) => {
        if ((a as any).isGlobal) return -1;
        if ((b as any).isGlobal) return 1;
        return 0;
      });
      setRooms(sortedRooms);

      // Auto-select global room if none selected
      if (!selectedRoom && sortedRooms.length > 0) {
        const globalRoom = sortedRooms.find(r => (r as any).isGlobal);
        if (globalRoom) {
          setSelectedRoom(globalRoom);
        } else if (sortedRooms.length === 1) {
          setSelectedRoom(sortedRooms[0]);
        }
      }

      setLoading(false);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'rooms');
      } catch (err) {
        console.error("Live rooms failed", err);
        // Fallback for demo if setup is not complete
        setRooms([
          { id: 'fallback-room-1', name: 'أحمد محمد', last_message: 'كيف حال المشروع يا بطل؟', last_message_time: '1:40 PM', is_group: false, avatar_url: '' },
          { id: 'fallback-room-2', name: 'فريق تطوير SNNS', last_message: 'المبرمج: تم ربط قاعدة البيانات بنجاح ✅', last_message_time: 'ACTIVE', is_group: true, avatar_url: '' },
          { id: 'fallback-room-3', name: 'سلطان القحطاني', last_message: 'صورة مرسلة', last_message_time: 'YESTERDAY', is_group: false, avatar_url: '' }
        ]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleCreateRoom = async () => {
    const name = prompt('اسم المحادثة الملكية الجديدة:');
    if (!name) return;

    const isGroup = confirm('هل تريد جعلها محادثة جماعية؟');

    try {
      const { addDoc, collection, serverTimestamp, doc, setDoc } = await import('firebase/firestore');
      const roomData = {
        name,
        isGroup,
        memberIds: [user.uid],
        lastMessage: 'تم إنشاء المحادثة السيادية',
        lastMessageTime: serverTimestamp(),
        createdBy: user.uid,
        avatarUrl: ''
      };

      const docRef = await addDoc(collection(db, 'rooms'), roomData);
      
      // Create member record for the creator
      await setDoc(doc(db, 'rooms', docRef.id, 'members', user.uid), {
        userId: user.uid,
        role: 'Owner',
        joinedAt: serverTimestamp()
      });

      alert(`تم تفعيل غرفة ${name} بنجاح ملكي! ✨`);

      // Preparing the local object to transition immediately
      const newRoom: ChatRoom = {
        id: docRef.id,
        name: roomData.name,
        is_group: roomData.isGroup,
        avatar_url: roomData.avatarUrl,
        last_message: roomData.lastMessage,
        last_message_time: 'الآن',
        unread_count: 0
      };

      setSelectedRoom(newRoom);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rooms');
    }
  };

  const handleStartChat = async (targetUser: any) => {
    // Check if a 1-to-1 chat already exists
    const existingRoom = rooms.find(r => !r.is_group && r.memberIds?.includes(targetUser.id));
    
    if (existingRoom) {
      setSelectedRoom(existingRoom);
      return;
    }

    try {
      const { addDoc, collection, serverTimestamp, doc, setDoc } = await import('firebase/firestore');
      const roomData = {
        name: targetUser.username,
        isGroup: false,
        memberIds: [user.uid, targetUser.id],
        lastMessage: 'بدأت المحادثة السيادية الخاصة',
        lastMessageTime: serverTimestamp(),
        createdBy: user.uid,
        avatarUrl: targetUser.avatar_url || ''
      };

      const docRef = await addDoc(collection(db, 'rooms'), roomData);
      
      // Create member records for both
      await setDoc(doc(db, 'rooms', docRef.id, 'members', user.uid), {
        userId: user.uid,
        role: 'Member',
        joinedAt: serverTimestamp()
      });
      await setDoc(doc(db, 'rooms', docRef.id, 'members', targetUser.id), {
        userId: targetUser.id,
        role: 'Member',
        joinedAt: serverTimestamp()
      });

      const newRoom: ChatRoom = {
        id: docRef.id,
        name: roomData.name,
        is_group: roomData.isGroup,
        avatar_url: roomData.avatarUrl,
        last_message: roomData.lastMessage,
        last_message_time: 'الآن',
        unread_count: 0,
        memberIds: roomData.memberIds
      };

      setSelectedRoom(newRoom);
      showToast(`تم فتح قناة اتصال خاصة مع ${targetUser.username}`, 'royal');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rooms');
    }
  };

  if (isAdminView) {
    return (
      <div className="relative w-full h-full">
        <AdminDashboard />
        <button 
          onClick={() => setIsAdminView(false)}
          className="fixed bottom-8 left-8 bg-neon-gold text-royal-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all z-[100]"
        >
          العودة للمحادثات
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-dark-bg text-off-white overflow-hidden selection:bg-gold selection:text-black">
      {/* Sidebar Navigation */}
      <aside className="w-20 bg-[#030303] border-l border-gray-900 flex flex-col items-center py-6 select-none z-20 h-screen shrink-0 relative">
        
        {/* Branding / SA Logo */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsSubscriptionOpen(true)}
          className="relative w-14 h-14 flex items-center justify-center bg-black border-2 border-[#22c55e] rounded-2xl shadow-[0_0_25px_rgba(34,197,94,0.35)] cursor-pointer group transition-all duration-300 z-10"
        >
            <span className="text-white font-black text-xl font-mono tracking-tighter">SA</span>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22c55e] rounded-full shadow-[0_0_12px_#22c55e] animate-ping"></div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22c55e] rounded-full shadow-[0_0_8px_#22c55e]"></div>
        </motion.div>

        {/* Vertical Decorative Line */}
        <div className="absolute top-24 bottom-24 w-[2px] bg-gradient-to-b from-[#22c55e] via-[#22c55e]/30 to-transparent shadow-[0_0_15px_rgba(34,197,94,0.2)] z-0"></div>

        <div className="flex flex-col items-center gap-10 mt-10 z-10 w-full">
            <button 
              onClick={() => {
                setViewMode('chats');
                setSelectedRoom(null);
              }}
              className={`relative p-3 rounded-xl transition-all duration-300 group ${viewMode === 'chats' ? 'text-[#22c55e] bg-[#070707] border border-[#22c55e]/40 shadow-[0_0_20px_rgba(34,197,94,0.25)] scale-105' : 'text-gray-400 hover:text-[#22c55e] hover:bg-black hover:border hover:border-[#22c55e]/20 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]'}`}
            >
                <MessageSquare className={`w-6 h-6 transition-transform duration-300 group-hover:scale-110`} />
                {viewMode === 'chats' && <div className="absolute inset-0 bg-[#22c55e]/5 rounded-xl blur-sm -z-10"></div>}
            </button>

            <button 
              onClick={() => {
                setViewMode('videos');
                setSelectedRoom(null);
              }}
              className={`relative p-3 rounded-xl transition-all duration-300 group ${viewMode === 'videos' ? 'text-[#22c55e] bg-[#070707] border border-[#22c55e]/40 shadow-[0_0_20px_rgba(34,197,94,0.25)] scale-105' : 'text-gray-400 hover:text-[#22c55e] hover:bg-black hover:border hover:border-[#22c55e]/20 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]'}`}
            >
                <Clapperboard className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
            </button>

            <button 
              onClick={() => {
                setViewMode('users');
                setSelectedRoom(null);
              }}
              className={`relative p-3 rounded-xl transition-all duration-300 group ${viewMode === 'users' ? 'text-[#22c55e] bg-[#070707] border border-[#22c55e]/40 shadow-[0_0_20px_rgba(34,197,94,0.25)] scale-105' : 'text-[#D4AF37]/80 hover:text-[#22c55e] hover:bg-black hover:border hover:border-[#22c55e]/20 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]'}`}
            >
                <Users className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
            </button>

            {userProfile?.role === 'admin' && (
              <button 
                onClick={() => setIsAdminView(true)}
                className="p-3 text-gray-500 rounded-xl transition-all duration-300 hover:text-gold hover:bg-black hover:border hover:border-gold/20 group relative"
              >
                  <LayoutDashboard className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-neon-gold rounded-full animate-pulse" />
              </button>
            )}

            <button 
              onClick={() => setIsProfileOpen(true)}
              className={`p-3 text-gray-500 rounded-xl transition-all duration-300 hover:text-[#22c55e] hover:bg-black hover:border hover:border-[#22c55e]/20 group ${isProfileOpen ? 'text-[#22c55e] bg-black border border-[#22c55e]/30' : ''}`}
            >
                <Settings className="w-6 h-6 transition-transform duration-500 group-hover:rotate-45" />
            </button>
        </div>

        <div className="flex flex-col items-center gap-6 mt-auto">
            <div className="w-12 h-12 p-0.5 border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.08)] transition-all duration-300 hover:scale-105 hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <img 
                  src={userProfile?.avatar_url || user.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.username || user.displayName || user.email}&background=D4AF37&color=111`} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-lg filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300" 
                />
            </div>

            <button 
              onClick={onLogout}
              className="p-3 text-gray-600 rounded-xl transition-all duration-300 hover:text-red-500 hover:bg-red-950/10 group"
            >
                <LogOut className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Chat List Column */}
        <div className={`
          flex flex-col bg-royal-black royal-sidebar border-l transition-all duration-500 z-10
          ${selectedRoom ? 'hidden lg:flex w-96' : 'flex w-full'}
        `}>
          <header className="p-6 border-b border-white/5 backdrop-blur-sm bg-royal-black/50">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3 select-none">
                <div className="relative w-12 h-12 flex items-center justify-center bg-[#050505] border-2 border-gold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                    <div className="flex flex-col items-center justify-center scale-75">
                        <Trees className="w-6 h-6 mb-0.5 animate-pulse text-[#22c55e] drop-shadow-[0_0_8px_#22c55e]" />
                        <div className="flex gap-1 -mt-1 text-gold">
                            <Sword className="w-3 h-3 rotate-45" />
                            <Sword className="w-3 h-3 -rotate-45" />
                        </div>
                    </div>
                    <div className="absolute top-1 left-1 w-1 h-1 bg-[#22c55e] rounded-full shadow-[0_0_5px_#22c55e]"></div>
                </div>
                
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-1">
                        <span className="text-white font-black text-lg tracking-wider">SNNS</span>
                        <span className="px-1.5 py-0.5 bg-gradient-to-r from-[#22c55e] to-[#4ade80] text-black text-[8px] font-black rounded-sm uppercase tracking-widest shadow-[0_2px_5px_rgba(16,185,129,0.2)]">PRO</span>
                    </div>
                    <span className="text-gray-500 text-[7px] uppercase tracking-widest font-bold">شبكة العقدة السيادية ● المملكة العربية السعودية</span>
                </div>
              </div>

              {viewMode === 'chats' && (
                <motion.button 
                  onClick={handleCreateRoom}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-neon-gold text-royal-black p-2 shrink-0 shadow-[0_0_10px_rgba(255,215,0,0.3)]"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              )}
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-gold/30 group-focus-within:text-neon-gold transition-colors" />
              <input 
                type="text" 
                placeholder={viewMode === 'chats' ? "ابحث في سجلات السنس..." : "ابحث عن ملوك ومستكشفين..."} 
                dir="rtl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full royal-input px-10 py-3 text-sm font-medium"
              />
            </div>
          </header>

          <div className="flex flex-col gap-2 p-4 border-b border-white/5 bg-[#040404] font-cairo select-none" dir="rtl">
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-1">الخدمات السيادية الذكية</p>

            <button 
              onClick={() => handleSwitchChannel('general')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0a0a0a] border border-[#22c55e]/30 shadow-[0_0_15px_rgba(34,197,94,0.1)] text-white hover:scale-[1.01] transition-all duration-300 group"
            >
                <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-[#22c55e] drop-shadow-[0_0_5px_#22c55e]" />
                    <span className="font-black text-xs">شات SNNS العام</span>
                </div>
                <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></span>
            </button>

            <button 
              onClick={() => handleSwitchChannel('verification')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#070707] border border-gray-950 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/20 transition-all duration-300 group"
            >
                <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]/80" />
                    <span className="font-bold text-xs">طلب توثيق حساب</span>
                </div>
                <ChevronLeft className="w-3 h-3 text-[10px]" />
            </button>

            <button 
              onClick={() => handleSwitchChannel('videos')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#070707] border border-gray-950 text-gray-400 hover:text-[#22c55e] hover:border-[#22c55e]/20 transition-all duration-300 group"
            >
                <div className="flex items-center gap-2.5">
                    <Clapperboard className="w-4 h-4 text-gray-500 group-hover:text-[#22c55e] transition-colors" />
                    <span className="font-bold text-xs">فيديوهات المستخدمين</span>
                </div>
                <span className="px-1.5 py-0.5 bg-black text-gray-650 text-[9px] font-mono rounded-md">LIVE</span>
            </button>

            <button 
              onClick={() => handleSwitchChannel('support')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#070707] border border-gray-950 text-gray-400 hover:text-red-400 hover:border-red-900/30 transition-all duration-300 group"
            >
                <div className="flex items-center gap-2.5">
                    <TriangleAlert className="w-4 h-4 text-red-500/80" />
                    <span className="font-bold text-xs">بلاغات ومشاكل تقنية</span>
                </div>
                <span className="px-1.5 py-0.5 bg-red-950/40 text-red-400 border border-red-900/40 text-[9px] font-mono rounded-md">AI ACTIVE</span>
            </button>
          </div>

          <section className="flex-1 overflow-y-auto scrollbar-hide py-4 relative">
            {loading || isLoadingUsers ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            ) : viewMode === 'chats' ? (
              <>
                {filteredRooms.map((room, idx) => (
                  <ChatItem 
                    key={`chat-room-${room.id || idx}-${idx}`}
                    room={room}
                    isActive={selectedRoom?.id === room.id}
                    onClick={() => setSelectedRoom(room)}
                  />
                ))}
                
                {filteredRooms.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-text opacity-50 space-y-4 p-8 text-center">
                    <ShieldAlert className="w-12 h-12 text-gold/30" />
                    <p className="uppercase tracking-[0.2em] text-[10px] font-bold">لا توجد محادثات مشفرة حالياً</p>
                    <button 
                      onClick={handleCreateRoom}
                      className="text-gold border border-gold/30 px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-gold/10 transition-all font-black"
                    >
                      ابدأ محادثة سيادية
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {filteredUsers.map((u, idx) => (
                  <motion.div 
                    key={`user-list-${u.id}-${idx}`}
                    onClick={() => {
                        handleStartChat(u);
                        setViewMode('chats');
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center p-5 cursor-pointer border-b border-white/5 hover:bg-gold/5 transition-all group"
                    dir="rtl"
                  >
                    <div className="w-12 h-12 border border-gold/30 p-0.5 overflow-hidden">
                      <img 
                        src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=111&color=D4AF37`} 
                        alt={u.username}
                        className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all"
                      />
                    </div>
                    <div className="mr-4 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-off-white">{u.username}</h3>
                        {u.is_premium && <Crown className="w-3 h-3 text-gold" />}
                      </div>
                      <p className="text-[10px] text-gray-text font-mono uppercase tracking-widest opacity-60">
                        {u.subscription_tier || 'مستكشف سيادي'}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {filteredUsers.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-text opacity-50 p-8 text-center">
                    <Users className="w-12 h-12 text-gold/30 mb-4" />
                    <p className="uppercase tracking-[0.2em] text-[10px] font-bold">لم يتم العثور على مستكشفين</p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* Chat Window Column */}
        <div className={`flex-1 ${!selectedRoom ? 'hidden lg:flex' : 'flex'}`}>
          <AnimatePresence mode="wait">
            {viewMode === 'videos' ? (
              <motion.div 
                key="video-feed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <VideoFeed />
              </motion.div>
            ) : selectedRoom ? (
              <motion.div 
                key={selectedRoom.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full"
              >
                <ChatWindow 
                  room={selectedRoom} 
                  user={user} 
                  onBack={() => setSelectedRoom(null)} 
                  onStartVideoCall={(name, id) => setActiveCall({ targetName: name, targetId: id })}
                />
              </motion.div>
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center w-full bg-[#050505] p-20 text-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative z-10 space-y-8"
                >
                  <div className="w-24 h-24 border border-gold/20 flex items-center justify-center mx-auto bg-dark-bg relative">
                    <Crown className="w-12 h-12 text-gold/20" />
                    <div className="absolute inset-[-15px] border border-gold/5 animate-[pulse_3s_infinite]" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold tracking-widest text-gold uppercase mb-4">Sovereign Node Network Service</h3>
                    <div className="flex items-center justify-center gap-4 text-gray-text">
                      <div className="h-px w-8 bg-gold/20"></div>
                      <p className="text-[10px] uppercase font-black tracking-[0.4em] text-gold/40">Select a secure channel to begin</p>
                      <div className="h-px w-8 bg-gold/20"></div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <div className="px-4 py-2 border border-white/5 bg-[#080808] text-[9px] text-gray-text uppercase tracking-widest font-bold">
                      AES-256 Protocol
                    </div>
                    <div className="px-4 py-2 border border-white/5 bg-[#080808] text-[9px] text-gray-text uppercase tracking-widest font-bold">
                      RSA Handshake
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Active Users Sidebar */}
        <ActiveUsersSidebar currentUser={user} onStartChat={handleStartChat} />
      </main>
      <AnimatePresence mode="wait">
        {incomingCall && (
          <IncomingCallModal 
            callerName={incomingCall.callerName}
            onAccept={() => {
              setActiveCall({ targetName: incomingCall.callerName, targetId: incomingCall.callerId });
              setIncomingCall(null);
            }}
            onReject={() => {
              setIncomingCall(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {activeCall && (
          <VideoCall 
            targetName={activeCall.targetName}
            targetUserId={activeCall.targetId}
            onHangUp={() => setActiveCall(null)}
          />
        )}
      </AnimatePresence>
      <ProfileManagementModal 
        user={user} 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onUpdate={(profile) => setUserProfile(profile)}
      />
      <SubscriptionNotice 
        user={user}
        isOpen={isSubscriptionOpen} 
        onClose={() => setIsSubscriptionOpen(false)} 
      />
    </div>
  );
}
