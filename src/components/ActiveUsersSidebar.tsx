import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';

interface ActiveUser {
  id: string;
  username: string;
  avatar_url?: string;
  is_premium: boolean;
  role: string;
  last_seen_at?: string;
}

export default function ActiveUsersSidebar({ currentUser, onStartChat }: { currentUser: any, onStartChat: (user: ActiveUser) => void }) {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRoyalExplorers() {
      if (!currentUser) return;
      
      setIsLoading(true);
      try {
        // جلب كل المستخدمين ما عدا حسابي أنا لكي أراهم في القائمة
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .neq('id', currentUser.uid); // استثناء نفسي فقط وإظهار البقية

        if (error) {
          console.error("خطأ في جلب المستخدمين الملكيين:", error);
          return;
        }

        console.log("المستكشفين النشطين في النظام:", data);
        setUsers(data || []);
      } catch (err) {
        console.error("Unexpected error loading users:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRoyalExplorers();

    // Subscribe to real-time changes to keep the list updated
    const channel = supabase
      .channel('public:user_profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
        loadRoyalExplorers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  return (
    <aside id="activeUsersSidebar" className="hidden xl:flex w-64 bg-[#0A0A0A] border-r border-[#D4AF37] h-full flex-col z-10 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
      <div className="p-5 border-b border-[#D4AF37]/20 flex items-center justify-between">
        <Sparkles className="w-4 h-4 text-[#FFD700] animate-pulse" />
        <h2 className="text-[#FFD700] font-black text-xs tracking-[0.2em] uppercase text-right" dir="rtl">المستكشفون</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-4 opacity-50">
            <Loader2 className="w-6 h-6 text-[#FFD700] animate-spin" />
            <p className="text-[10px] text-[#FFD700] uppercase tracking-widest font-bold">جاري الاستدعاء الملكي...</p>
          </div>
        ) : users.length > 0 ? (
          users.map((user, idx) => (
            <motion.div 
              key={`active-explorer-${user.id || idx}-${idx}`}
              onClick={() => onStartChat(user)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ 
                backgroundColor: "rgba(212, 175, 55, 0.08)",
                scale: 1.02,
                boxShadow: "0 0 15px rgba(212, 175, 55, 0.1)"
              }}
              className="flex items-center gap-4 p-3 border border-transparent hover:border-[#D4AF37]/30 transition-all cursor-pointer group relative overflow-hidden"
              dir="rtl"
            >
              <div className="relative z-10">
                <div className={`w-11 h-11 border-2 p-0.5 rounded-none overflow-hidden transition-all duration-500 ${user.is_premium ? 'border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.3)]' : 'border-gray-800'}`}>
                  <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=222&color=D4AF37`} 
                    alt={user.username} 
                    className={`w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700`}
                  />
                  {user.is_premium && (
                    <div className="absolute inset-0 border border-[#FFD700] animate-pulse pointer-events-none" />
                  )}
                </div>
                {/* Online Indicator (Static for now based on presence logic) */}
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#0A0A0A] rounded-full shadow-[0_0_8px_#22c55e]" />
              </div>
              
              <div className="flex flex-col text-right z-10">
                <div className="flex items-center gap-2">
                  <span className={`text-[13px] font-black tracking-tight ${user.is_premium ? 'text-[#FFD700]' : 'text-gray-300'}`}>
                    {user.username}
                  </span>
                  {user.role === 'admin' && (
                    <span className="bg-[#FFD700] text-black text-[7px] px-1 font-black uppercase">Staff</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">
                  {user.is_premium ? 'رتبة ملكية' : 'مستكشف نشط'}
                </span>
              </div>

              {/* Decorative accent for premium */}
              {user.is_premium && (
                <div className="absolute -right-10 -bottom-10 w-20 h-20 bg-[#FFD700]/5 rotate-45 pointer-events-none" />
              )}
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 space-y-4 opacity-30 text-center p-4">
            <Lock className="w-8 h-8 text-[#D4AF37]/20" />
            <p className="text-[10px] text-gray-text uppercase tracking-widest font-bold">لا يوجد مكتشفون آخرون حالياً</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#D4AF37]/10 bg-black/40">
        <div className="flex justify-between items-center text-[9px] text-[#D4AF37]/50 font-black uppercase tracking-[0.2em]">
          <span>Security Protocol 1.0</span>
          <span>Verified Channels</span>
        </div>
      </div>
    </aside>
  );
}
