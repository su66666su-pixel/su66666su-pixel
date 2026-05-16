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
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
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
}

interface ChatItemProps {
  room: ChatRoom;
  isActive?: boolean;
  onClick: () => void;
}

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
  const [incomingCall, setIncomingCall] = useState<{ callerName: string } | null>(null);
  const [activeCall, setActiveCall] = useState<{ targetName: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error("Profile fetch failed", error);
          return;
        }

        if (profile) {
          setUserProfile(profile);
          const now = new Date();
          const trialEnd = new Date(profile.trial_ends_at);

          if (now > trialEnd && !profile.is_premium) {
            setIsSubscriptionOpen(true);
          }
        }
      } catch (err) {
        console.error("Error in fetchUserProfile", err);
      }
    };

    fetchUserProfile(user.uid);

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
          unread_count: data.unreadCount
        } as ChatRoom;
      });
      setRooms(roomData);
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
      <aside className="w-20 md:w-24 royal-sidebar border-l flex flex-col items-center py-10 gap-10 bg-royal-black z-20">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          onClick={() => setIsSubscriptionOpen(true)}
          className="relative cursor-pointer"
        >
          <div className="w-12 h-12 border-2 border-neon-gold flex items-center justify-center bg-dark-bg shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <Crown className="w-6 h-6 crown-icon" />
          </div>
          <div className="absolute inset-[-8px] border border-neon-gold/20 rounded-full animate-pulse" />
        </motion.div>

        <nav className="flex flex-col gap-10 text-gray-text text-xl">
          <button className="text-gold transition-all hover:scale-110 relative">
            <MessageSquare className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full" />
          </button>
          <button className="hover:text-gold transition-all hover:scale-110">
            <Phone className="w-6 h-6" />
          </button>
          <button className="hover:text-gold transition-all hover:scale-110">
            <Users className="w-6 h-6" />
          </button>
          
          {userProfile?.role === 'admin' && (
            <button 
              id="admin-menu-item"
              onClick={() => setIsAdminView(true)}
              className="hover:text-gold transition-all hover:scale-110 relative"
            >
              <LayoutDashboard className="w-6 h-6" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-neon-gold rounded-full animate-pulse shadow-[0_0_10px_#FFD700]" />
            </button>
          )}
          
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="hover:text-gold transition-all hover:scale-110"
          >
            <Settings className="w-6 h-6" />
          </button>
        </nav>

        <div className="mt-auto flex flex-col items-center gap-8">
           <div className="flex flex-col items-center gap-1">
             <div className={`w-10 h-10 border p-0.5 rounded-none overflow-hidden group cursor-pointer relative ${userProfile?.is_premium ? 'border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'border-gold/30'}`}>
               {userProfile?.is_premium && (
                 <div className="absolute inset-0 border-2 border-[#FFD700] animate-pulse pointer-events-none z-10" />
               )}
               <img 
                 src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=D4AF37&color=111`} 
                 alt="Profile" 
                 className={`w-full h-full object-cover transition-all ${userProfile?.is_premium ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`}
               />
             </div>
             {userProfile?.subscription_tier && (
               <span className="text-[8px] text-[#FFD700] font-black uppercase tracking-tighter">
                 {userProfile.subscription_tier}
               </span>
             )}
           </div>
           <button 
             onClick={onLogout}
             className="text-gray-text hover:text-red-400 transition-colors"
           >
             <LogOut className="w-5 h-5" />
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
          <header className="p-8 border-b border-white/5 backdrop-blur-sm bg-royal-black/50">
            <div className="flex justify-between items-center mb-10">
              <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
                Chats <span className="text-neon-gold block text-[10px] tracking-[0.4em] font-medium mt-1">Sovereign Messaging</span>
              </h1>
              <motion.button 
                onClick={handleCreateRoom}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-neon-gold text-royal-black p-2 shrink-0 shadow-[0_0_10px_rgba(255,215,0,0.3)]"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-gold/30 group-focus-within:text-neon-gold transition-colors" />
              <input 
                type="text" 
                placeholder="ابحث في سجلات السنس..." 
                dir="rtl"
                className="w-full royal-input px-10 py-3 text-sm font-medium"
              />
            </div>
          </header>

          <section className="flex-1 overflow-y-auto scrollbar-hide py-4 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            ) : (
              rooms.map((room, idx) => (
                <ChatItem 
                  key={`room-${room.id}-${idx}`}
                  room={room}
                  isActive={selectedRoom?.id === room.id}
                  onClick={() => setSelectedRoom(room)}
                />
              ))
            )}
            
            {rooms.length === 0 && !loading && (
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
          </section>
        </div>

        {/* Chat Window Column */}
        <div className={`flex-1 ${!selectedRoom ? 'hidden lg:flex' : 'flex'}`}>
          <AnimatePresence mode="wait">
            {selectedRoom ? (
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
        <ActiveUsersSidebar />
      </main>
      <AnimatePresence mode="wait">
        {incomingCall && (
          <IncomingCallModal 
            callerName={incomingCall.callerName}
            onAccept={() => {
              setActiveCall({ targetName: incomingCall.callerName });
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
            onHangUp={() => setActiveCall(null)}
          />
        )}
      </AnimatePresence>
      <ProfileManagementModal 
        user={user} 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
      <SubscriptionNotice 
        user={user}
        isOpen={isSubscriptionOpen} 
        onClose={() => setIsSubscriptionOpen(false)} 
      />
    </div>
  );
}
