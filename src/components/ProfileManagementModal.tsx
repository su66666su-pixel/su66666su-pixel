import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, MapPin, Shield, Check, Loader2, Crown } from 'lucide-react';
import { supabase } from '../supabase';

interface ProfileManagementModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileManagementModal({ user, isOpen, onClose }: ProfileManagementModalProps) {
  const [username, setUsername] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.uid)
        .single();

      if (data) {
        setUsername(data.username || user.displayName || '');
        setShowEmail(data.show_email || false);
      } else if (error && error.code === 'PGRST116') {
        // Profile not found, create one
        const { error: createError } = await supabase
          .from('profiles')
          .insert({ 
            id: user.uid, 
            username: user.displayName || user.email?.split('@')[0],
            show_email: false 
          });
          
        if (createError) console.error("Error creating profile:", createError);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.uid);

      if (error) throw error;
      alert("تم تحديث الاسم الملكي بنجاح! 👑");
    } catch (err: any) {
      alert("فشل التحديث: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleEmailVisibility = async (isVisible: boolean) => {
    setShowEmail(isVisible);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ show_email: isVisible })
        .eq('id', user.uid);

      if (error) throw error;
      console.log("تم تغيير خصوصية الإيميل إلى:", isVisible);
    } catch (err) {
      console.error("Email visibility toggle failed", err);
      setShowEmail(!isVisible); // Rollback
    }
  };

  const handleOpenNearby = () => {
    if (navigator.geolocation) {
      setIsSearchingNearby(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("جاري البحث عن أشخاص قرب إحداثياتك:", position.coords.latitude);
          alert("جاري البحث عن مستخدمي SNNS القريبين منك... ✨");
          // Here we would typically update the user's location in Supabase and query for nearby users
          // using PostGIS: supabase.rpc('nearby_users', { lat: ..., lon: ... })
          setTimeout(() => setIsSearchingNearby(false), 2000);
        },
        (error) => {
          setIsSearchingNearby(false);
          alert("يرجى تفعيل صلاحية الموقع لاستخدام هذه الميزة.");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      alert("متصفحك لا يدعم ميزة الموقع الجغرافي.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#0A0A0A] border border-neon-gold/50 p-8 shadow-[0_0_50px_rgba(212,175,55,0.15)] overflow-hidden"
          >
            {/* Design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-gold/5 blur-3xl rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-gold/5 blur-3xl rounded-full" />
            
            <header className="flex justify-between items-center mb-10 relative">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-neon-gold flex items-center justify-center bg-dark-bg">
                  <Crown className="w-5 h-5 text-neon-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-widest text-neon-gold">Sovereign Settings</h2>
                  <p className="text-[9px] text-gray-text tracking-widest uppercase">Identity & Privacy Management</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-text hover:text-neon-gold transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-neon-gold animate-spin" />
                <p className="text-[10px] text-neon-gold tracking-widest uppercase animate-pulse">Accessing Decentralized Profile...</p>
              </div>
            ) : (
              <div className="space-y-10 relative" dir="rtl">
                {/* Username Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-neon-gold" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-200">الاسم الملكي</h3>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="أدخل الاسم الجديد..."
                      className="flex-1 royal-input px-4 py-3 text-sm"
                    />
                    <button 
                      onClick={handleUpdateUsername}
                      disabled={isUpdating}
                      className="bg-neon-gold text-royal-black px-6 font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تحديث'}
                    </button>
                  </div>
                </section>

                {/* Privacy Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-neon-gold" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-200">الخصوصية والوصول</h3>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 flex items-center justify-center border ${showEmail ? 'border-neon-gold bg-neon-gold/10' : 'border-white/10'}`}>
                        <Mail className={`w-4 h-4 ${showEmail ? 'text-neon-gold' : 'text-gray-text'}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-200">رؤية البريد الإلكتروني</p>
                        <p className="text-[9px] text-gray-text tracking-tighter">السماح للمستخدمين الآخرين برؤية إيميلك</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleEmailVisibility(!showEmail)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${showEmail ? 'bg-neon-gold' : 'bg-white/10'}`}
                    >
                      <motion.div 
                        animate={{ x: showEmail ? 20 : 2 }}
                        className="absolute top-1 w-3 h-3 bg-white shadow-xl"
                      />
                    </button>
                  </div>
                </section>

                {/* Nearby Feature Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-neon-gold" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-200">الاستكشاف الجغرافي</h3>
                  </div>
                  <button 
                    onClick={handleOpenNearby}
                    disabled={isSearchingNearby}
                    className="w-full h-16 border border-neon-gold/20 hover:border-neon-gold hover:bg-neon-gold/5 flex flex-col items-center justify-center group transition-all disabled:opacity-50"
                  >
                    {isSearchingNearby ? (
                      <Loader2 className="w-6 h-6 text-neon-gold animate-spin" />
                    ) : (
                      <>
                        <p className="text-xs font-bold text-neon-gold group-hover:scale-105 transition-transform">البحث عن مستخدمين قريبين</p>
                        <p className="text-[8px] text-gray-text mt-1">تفعيل ميزة القريبين مني عبر إحداثيات الملكية</p>
                      </>
                    )}
                  </button>
                </section>

                <div className="pt-6 border-t border-white/5 text-center">
                   <p className="text-[7px] text-gray-text uppercase tracking-[0.5em] font-mono">
                     Protocol Version 4.2.0 // Sovereign Security Clear // {new Date().toLocaleDateString()}
                   </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
