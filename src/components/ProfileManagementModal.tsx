import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, MapPin, Shield, Check, Loader2, Crown, BadgeCheck, ShieldHalf, Medal, Gift, Flame, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabase';
import AgentCenterModal from './AgentCenterModal';

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
  const [isGeoVisible, setIsGeoVisible] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAgentCenterOpen, setIsAgentCenterOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      setNearbyUsers([]); // Reset when opening
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
        setUserProfile(data);
        setUsername(data.username || user.displayName || '');
        setShowEmail(data.show_email || false);
        setIsGeoVisible(data.is_geo_visible || false);
      } else if (error && error.code === 'PGRST116') {
        // Profile not found, create one
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days trial

        const { error: createError } = await supabase
          .from('profiles')
          .insert({ 
            id: user.uid, 
            username: user.displayName || user.email?.split('@')[0],
            show_email: false,
            is_premium: false,
            trial_ends_at: trialEndDate.toISOString(),
            is_geo_visible: false
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

  const handleToggleGeoVisibility = async (isVisible: boolean) => {
    setIsGeoVisible(isVisible);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_geo_visible: isVisible })
        .eq('id', user.uid);

      if (error) throw error;
      console.log("تم تغيير حالة الظهور إلى:", isVisible ? "مرئي" : "مختفي");
    } catch (err) {
      console.error("Geo visibility toggle failed", err);
      setIsGeoVisible(!isVisible); // Rollback
    }
  };

  const handleOpenNearby = () => {
    if (!isGeoVisible) {
      alert("يجب تفعيل وضع 'الظهور' أولاً لتتمكن من رؤية الآخرين ورؤيتهم لك! 👑");
      return;
    }

    if (navigator.geolocation) {
      setIsSearchingNearby(true);
      setNearbyUsers([]);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("جاري البحث عن أشخاص قرب إحداثياتك:", position.coords.latitude);
          // Simulation of search time
          setTimeout(() => {
            setNearbyUsers([
              { id: '1', name: 'علي محمد', distance: '450 متر', avatar: 'Ali', type: 'normal' },
              { id: '2', name: 'سارة أحمد', distance: '1.2 كم', avatar: 'Sara', type: 'normal' },
              { id: '3', name: 'خالد القحطاني', distance: '3 كم', avatar: 'Khaled', type: 'agent' }
            ]);
            setIsSearchingNearby(false);
          }, 2500);
        },
        (error) => {
          setIsSearchingNearby(false);
          alert("يرجى تفعيل صلاحية الموقع و الـ GPS لاستخدام هذه الميزة. 📍");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      alert("متصفحك لا يدعم ميزة الموقع الجغرافي. ❌");
    }
  };

  const renderMapIcon = (profile: any) => {
    if (profile.type === 'agent') {
      return (
        <div className="relative">
          <div className="absolute -inset-2 bg-[#FFD700] rounded-full opacity-20 animate-ping" />
          <div className="w-12 h-12 bg-[#0f0f0f] border-2 border-[#FFD700] rounded-full flex items-center justify-center shadow-[0_0_15px_#FFD700]">
            <ShieldHalf className="w-6 h-6 text-[#FFD700]" />
          </div>
        </div>
      );
    }
    return (
      <div className="relative">
        <img 
          src={`https://ui-avatars.com/api/?name=${profile.avatar}&background=000&color=D4AF37&bold=true`} 
          alt={profile.name}
          className="w-12 h-12 rounded-full border border-gray-600"
        />
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
      </div>
    );
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
                      className={`flex-1 royal-input px-4 py-3 text-sm ${userProfile?.subscription_tier === 'ذهبي' ? 'neon-text-glow' : ''}`}
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

                {/* Badges Section */}
                <section className="p-6 bg-[#0a0a0a] border border-[#222] rounded-3xl">
                  <h3 className="text-[#FFD700] text-lg font-bold mb-6 flex items-center gap-2">
                    <Medal className="w-5 h-5" /> نياشين السيادة
                  </h3>
                  
                  <div className="grid grid-cols-4 gap-4">
                    {/* Founder Badge */}
                    <div className="group text-center cursor-help" title="وسام المؤسس: يُمنح فقط للنخبة الأولى">
                      <div className="relative w-14 h-14 mx-auto mb-2 bg-gradient-to-b from-[#FFD700] to-[#D4AF37] rounded-full p-0.5 shadow-[0_0_15px_rgba(255,215,0,0.3)] group-hover:scale-110 transition-transform">
                        <div className="bg-[#050505] w-full h-full rounded-full flex items-center justify-center relative overflow-hidden">
                          <Crown className="w-6 h-6 text-[#FFD700]" />
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </div>
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold">المؤسس</span>
                    </div>

                    {/* Generous Badge (Locked) */}
                    <div className="text-center opacity-30 grayscale cursor-not-allowed" title="أهدِ 10 رتب لفتح هذا الوسام">
                      <div className="w-14 h-14 mx-auto mb-2 bg-gray-800 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600">
                        <Gift className="w-6 h-6 text-gray-500" />
                      </div>
                      <span className="text-[9px] text-gray-500 font-bold">سخي</span>
                    </div>

                    {/* Leader Badge (Locked) */}
                    <div className="text-center opacity-30 grayscale cursor-not-allowed" title="تصدّر لوحة الشرف لفتحه">
                      <div className="w-14 h-14 mx-auto mb-2 bg-gray-800 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600">
                        <Flame className="w-6 h-6 text-gray-500" />
                      </div>
                      <span className="text-[9px] text-gray-500 font-bold">متصدر</span>
                    </div>

                    {/* Verified Badge */}
                    <div className="group text-center cursor-help" title="حساب موثق عبر نفاذ">
                      <div className="w-14 h-14 mx-auto mb-2 bg-gradient-to-b from-[#00A3FF] to-[#0057FF] rounded-full p-0.5 shadow-[0_0_15px_rgba(0,163,255,0.3)] group-hover:scale-110 transition-transform">
                        <div className="bg-[#050505] w-full h-full rounded-full flex items-center justify-center relative overflow-hidden">
                          <ShieldCheck className="w-6 h-6 text-[#00A3FF]" />
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </div>
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold">موثق</span>
                    </div>
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

                  {/* Agent Center Shortcut */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#D4AF37]/5 to-transparent border border-[#D4AF37]/20 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center border border-[#D4AF37]/30 bg-[#D4AF37]/10">
                        <BadgeCheck className="w-4 h-4 text-[#FFD700]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">مركز الوكيل المعتمد</p>
                        <p className="text-[9px] text-gray-500 tracking-tighter">إدارة العمولات وروابط الدعوة الملكية</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsAgentCenterOpen(true)}
                      className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg"
                    >
                      دخول
                    </button>
                  </div>
                </section>

                {/* Nearby Feature Section */}
                <section className="bg-[#111] p-6 rounded-2xl border border-[#D4AF37]/30 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-[#FFD700]" />
                       <h3 className="text-sm font-bold text-[#FFD700]">الاستكشاف الجغرافي</h3>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isGeoVisible ? 'text-green-500' : 'text-gray-500'}`}>
                        {isGeoVisible ? 'مرئي للجميع' : 'مختفي الآن'}
                      </span>
                      <button 
                        onClick={() => handleToggleGeoVisibility(!isGeoVisible)}
                        className={`w-11 h-6 rounded-full relative transition-all duration-300 ${isGeoVisible ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-700'}`}
                        title={isGeoVisible ? 'تعطيل الظهور' : 'تفعيل الظهور'}
                      >
                        <motion.div 
                          animate={{ x: isGeoVisible ? 22 : 2 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={handleOpenNearby}
                      disabled={isSearchingNearby}
                      className="w-full py-4 border-2 border-[#FFD700] text-[#FFD700] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#FFD700] hover:text-black transition-all shadow-[0_0_15px_rgba(255,215,0,0.1)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSearchingNearby ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>البحث عن مستخدمين قريبين</span>
                          <span className="text-sm">✨</span>
                        </>
                      )}
                    </button>

                    <AnimatePresence>
                      {isSearchingNearby && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute inset-0 bg-[#0A0A0A] rounded-2xl border border-[#D4AF37]/20 shadow-2xl flex flex-col items-center justify-center z-10 p-4"
                        >
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-[#FFD700]/30 rounded-full animate-ping" />
                            <div className="absolute inset-2 border-2 border-[#D4AF37]/50 rounded-full animate-pulse" />
                            <MapPin className="w-10 h-10 text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                            <div className="absolute inset-0 rounded-full border-t-2 border-[#FFD700] animate-spin opacity-60" />
                          </div>
                          <p className="mt-4 text-[#FFD700] font-bold text-sm animate-pulse">جاري مسح المنطقة بحثاً عن الملوك...</p>
                          <p className="text-gray-500 text-[10px] mt-1 italic">البحث في نطاق 5 كم</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Nearby Results List */}
                  <AnimatePresence>
                    {nearbyUsers.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 gap-4 overflow-hidden pt-2"
                      >
                        {nearbyUsers.map((profile) => (
                          <motion.div 
                            key={`nearby-${profile.id}`}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="w-full"
                          >
                            {profile.type === 'agent' ? (
                              <div className="bg-[#0f0f0f] border-2 border-[#FFD700] p-6 rounded-3xl text-center shadow-[0_0_30px_rgba(255,215,0,0.1)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                  <ShieldHalf className="w-12 h-12 text-[#FFD700]" />
                                </div>
                                <div className="text-[#FFD700] text-[10px] font-black mb-2 uppercase tracking-[0.2em]">وكيل معتمد بالقرب منك</div>
                                <h3 className="text-white text-lg font-black mb-1">{profile.name} 👑</h3>
                                <p className="text-gray-500 text-[10px] mb-6 font-medium">متوفر الآن لتوفير النقاط والاشتراكات السيادية</p>
                                
                                <div className="flex flex-col gap-2 relative z-10">
                                    <button className="bg-[#FFD700] text-black py-3 rounded-xl font-black text-xs shadow-[0_5px_15px_rgba(255,215,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">
                                        طلب شحن رصيد فوراً
                                    </button>
                                    <button className="bg-[#1a1a1a] text-gray-400 py-2.5 rounded-xl text-[10px] border border-gray-800 font-bold hover:bg-gray-800 transition-colors">
                                        مراسلة الوكيل
                                    </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between bg-[#0f0f0f] p-4 rounded-2xl border border-[#D4AF37]/20 hover:border-[#FFD700] transition-all group cursor-pointer">
                                <div className="flex items-center gap-4">
                                  {renderMapIcon(profile)}
                                  <div>
                                    <h4 className="text-white font-bold text-sm tracking-tight">{profile.name}</h4>
                                    <p className="text-[#D4AF37] text-[10px] font-medium">{profile.distance}</p>
                                  </div>
                                </div>
                                <button className="bg-[#FFD700] text-black text-[10px] px-5 py-2 rounded-full font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:scale-105 active:scale-95 shadow-[0_5px_15px_rgba(255,215,0,0.2)]">
                                  مراسلة
                                </button>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
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

      <AgentCenterModal 
        isOpen={isAgentCenterOpen}
        onClose={() => setIsAgentCenterOpen(false)}
        username={username}
      />
    </AnimatePresence>
  );
}
