import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, MapPin, Shield, Check, Loader2, Crown, BadgeCheck, ShieldHalf, Medal, Gift, Flame, ShieldCheck, Music } from 'lucide-react';
import { supabase, isUUID } from '../supabase';
import AgentCenterModal from './AgentCenterModal';
import { useToast } from './Toast';

interface ProfileManagementModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (profile: any) => void;
}

export default function ProfileManagementModal({ user, isOpen, onClose, onUpdate }: ProfileManagementModalProps) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const [isGeoVisible, setIsGeoVisible] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAgentCenterOpen, setIsAgentCenterOpen] = useState(false);
  const [selectedRingtone, setSelectedRingtone] = useState('cyber_neon');
  const [activationCode, setActivationCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'radar'>('profile');

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      setNearbyUsers([]); // Reset when opening
      setActiveTab('profile');
    }
  }, [isOpen, user]);

  const fetchProfile = async () => {
    if (!user?.uid || !isUUID(user.uid)) {
      console.warn("User ID is not a valid UUID, skipping Supabase profile fetch.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.uid)
        .single();

      if (data) {
        setUserProfile(data);
        setUsername(data.username || user.displayName || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || user.photoURL || '');
        setShowEmail(data.show_email || false);
        setIsGeoVisible(data.is_geo_visible || false);
        if (data.ringtone) setSelectedRingtone(data.ringtone);
      } else if (error && error.code === 'PGRST116') {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({ 
            id: user.uid, 
            username: user.displayName || user.email?.split('@')[0],
            show_email: false,
            is_premium: false,
            trial_ends_at: trialEndDate.toISOString(),
            is_geo_visible: false,
            role: 'user'
          });
          
        if (createError) console.error("Error creating profile:", createError);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateUsername = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 3) return "يجب أن يكون الاسم 3 أحرف على الأقل 📏";
    if (trimmed.length > 20) return "الاسم طويل جداً، الحد الأقصى 20 حرف 🏰";
    const validCharsRegex = /^[a-zA-Z0-9_\u0600-\u06FF\s]+$/;
    if (!validCharsRegex.test(trimmed)) return "الاسم يحتوي على رموز غير مسموحة ❌";
    return "";
  };

  const handleUpdateProfile = async () => {
    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      showToast(error, 'error');
      return;
    }
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          username: username.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl.trim()
        })
        .eq('id', user.uid);

      if (error) throw error;
      showToast("👑 تم تحديث ملفك السيادي بنجاح!", 'royal');
      setUsernameError('');
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.uid)
        .single();
      if (data) {
        setUserProfile(data);
        if (onUpdate) onUpdate(data);
      }
    } catch (err: any) {
      showToast("فشل التحديث: " + err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivateCode = async () => {
    if (!activationCode.trim()) {
        showToast("يا ملك، فضلاً أدخل الكود أولاً!", 'info');
        return;
    }

    setIsActivating(true);
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error("يجب تسجيل الدخول أولاً");
        
        const userId = authUser.id;

        const { data: codeData, error } = await supabase
            .from('activation_codes')
            .select('*')
            .eq('code', activationCode.trim())
            .eq('is_used', false)
            .single();

        if (error || !codeData) {
            showToast("❌ الكود غير صحيح أو تم استخدامه مسبقاً!", 'error');
            return;
        }

        const { error: updateError } = await supabase
            .from('activation_codes')
            .update({ 
                is_used: true, 
                used_by: userId,
                used_at: new Date().toISOString()
            })
            .eq('id', codeData.id);

        if (updateError) {
            showToast("❌ حدث خطأ أثناء تفعيل الكود، حاول مجدداً.", 'error');
            return;
        }

        if (codeData.reward_type === 'gold_membership') {
            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({ membership_tier: 'gold', is_premium: true })
                .eq('id', userId);
                
            if (profileError) throw profileError;
            showToast("👑 تهانينا! تم تفعيل العضوية الملكية الذهبية بنجاح! استمتع بالسيادة.", 'royal');
        } else {
             showToast("✅ تم تفعيل الكود بنجاح!", 'success');
        }
        
        fetchProfile();
        setActivationCode('');
    } catch (err: any) {
        showToast("❌ خطأ: " + err.message, 'error');
    } finally {
        setIsActivating(false);
    }
  };

  const handleToggleEmailVisibility = async (isVisible: boolean) => {
    setShowEmail(isVisible);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ show_email: isVisible })
        .eq('id', user.uid);

      if (error) throw error;
    } catch (err) {
      setShowEmail(!isVisible);
    }
  };

  const handleToggleGeoVisibility = async (isVisible: boolean) => {
    if (isVisible && navigator.geolocation) {
      setIsGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { error } = await supabase
              .from('user_profiles')
              .update({ 
                is_geo_visible: true,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                last_position_update: new Date().toISOString()
              })
              .eq('id', user.uid);
            
            if (!error) {
              setIsGeoVisible(true);
              showToast("📡 تم تفعيل ظهورك الرقمي على الرادار الجغرافي", 'royal');
            } else {
              throw error;
            }
          } catch (err) {
            showToast("فشل تحديث الإحداثيات السيادية", 'error');
          } finally {
            setIsGeoLoading(false);
          }
        },
        (err) => {
          setIsGeoLoading(false);
          showToast("يرجى تفعيل صلاحية الموقع لتظهر للآخرين! 📍", 'error');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsGeoVisible(isVisible);
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ is_geo_visible: isVisible })
          .eq('id', user.uid);
        
        if (error) throw error;
        
        if (!isVisible) {
          showToast("🥷 تم تفعيل وضع الشبح.. أنت مخفي الآن", 'royal');
        }
      } catch (err) {
        setIsGeoVisible(!isVisible);
        showToast("فشل تحديث حالة الظهور الجغرافي", 'error');
      }
    }
  };

  const handleRingtoneChange = async (tone: string) => {
    setSelectedRingtone(tone);
    
    const ringtones = {
      cyber_neon: 'https://snns.pro/sounds/cyber_neon.mp3',
      sovereign_alert: 'https://snns.pro/sounds/sovereign_alert.mp3',
      classic_secure: 'https://snns.pro/sounds/classic_secure.mp3'
    };
    
    const audio = new Audio((ringtones as any)[tone]);
    audio.play().catch(e => console.log("Audio preview failed", e));
    setTimeout(() => audio.pause(), 3000);

    try {
      await supabase
        .from('user_profiles')
        .update({ ringtone: tone })
        .eq('id', user.uid);
      
      localStorage.setItem(`ringtone_${user.uid}`, tone);
    } catch (err) {
      console.error("Failed to update ringtone in DB", err);
    }
  };

  const handleOpenNearby = () => {
    if (!isGeoVisible) {
      showToast("يجب تفعيل وضع 'الظهور' أولاً لتتمكن من رؤية الآخرين ورؤيتهم لك! 👑", 'info');
      return;
    }

    if (navigator.geolocation) {
      setIsSearchingNearby(true);
      setNearbyUsers([]);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          try {
            await supabase
              .from('user_profiles')
              .update({ 
                latitude: lat, 
                longitude: lng,
                last_position_update: new Date().toISOString()
              })
              .eq('id', user.uid);

            let users: any[] | null = null;
            let rpcError: any = null;
            
            try {
              const res = await supabase
                .rpc('get_nearby_users', { 
                  current_lat: lat, 
                  current_lng: lng,
                  distance_radius: 50.0
                });
              users = res.data;
              rpcError = res.error;
            } catch (e) {
              rpcError = e;
            }

            if (rpcError) {
              const { data: allUsers, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('is_geo_visible', true)
                .neq('id', user.uid);
              
              if (fetchError) throw fetchError;
              
              if (allUsers) {
                const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                  const R = 6371;
                  const dLat = (lat2 - lat1) * Math.PI / 180;
                  const dLon = (lon2 - lon1) * Math.PI / 180;
                  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                          Math.sin(dLon/2) * Math.sin(dLon/2);
                  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                };

                const nearby = allUsers
                  .map(u => ({ ...u, distance_km: u.latitude && u.longitude ? calculateDistance(lat, lng, u.latitude, u.longitude) : 999 }))
                  .filter(u => u.distance_km <= 50)
                  .sort((a, b) => a.distance_km - b.distance_km);

                setNearbyUsers(nearby.map((u: any) => ({
                    id: u.id,
                    name: u.username || 'مستكشف مجهول',
                    distance: u.distance_km < 1 ? `${Math.round(u.distance_km * 1000)} متر` : `${u.distance_km.toFixed(1)} كم`,
                    avatar: u.username || 'User',
                    type: u.membership_tier === 'agent' ? 'agent' : 'normal'
                })));

                if (nearby.length === 0) {
                    showToast("لم يتم العثور على ملوك قريبين في نطاق 50 كم. 🏰", 'info');
                }
              }
            } else if (users && users.length > 0) {
              setNearbyUsers(users.map((u: any) => ({
                id: u.id,
                name: u.username || 'مستكشف مجهول',
                distance: u.dist_meters ? 
                  (u.dist_meters < 1000 ? `${Math.round(u.dist_meters)} متر` : `${(u.dist_meters/1000).toFixed(1)} كم`) 
                  : 'بعيد قليلاً',
                avatar: u.username || 'User',
                type: u.membership_tier === 'agent' ? 'agent' : 'normal'
              })));
            } else {
              showToast("لم يتم العثور على ملوك قريبين في الوقت الحالي. 🏰", 'info');
            }
          } catch (err: any) {
            if (!err.message?.includes('GET_NEARBY_USERS')) {
              showToast("فشل البحث عن ملوك قريبين: " + err.message, 'error');
            }
          } finally {
            setIsSearchingNearby(false);
          }
        },
        (error) => {
          setIsSearchingNearby(false);
          showToast("يرجى تفعيل صلاحية الموقع و الـ GPS لاستخدام هذه الميزة. 📍", 'error');
        },
        { enableHighAccuracy: true }
      );
    } else {
      showToast("متصفحك لا يدعم ميزة الموقع الجغرافي. ❌", 'error');
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
          src={`https://ui-avatars.com/api/?name=${profile.name || 'User'}&background=000&color=D4AF37&bold=true`} 
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
            className="relative w-full max-w-2xl bg-[#050505] border border-gray-900 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden font-cairo"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-neon-gold/5 blur-3xl rounded-full -mr-20 -mt-20 opacity-30" />
            
            <header className="flex justify-between items-center pb-6 border-b border-gray-900/50 mb-8 relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-black border border-[#D4AF37]/30 rounded-2xl shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                   <Medal className="w-6 h-6 text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                </div>
                <div>
                  <h2 className="text-white text-lg font-black tracking-tighter">SOVEREIGN SETTINGS</h2>
                  <p className="text-gray-500 text-[10px] tracking-widest uppercase font-bold pr-0.5">إدارة الهوية والخصوصية الرقمية لعقدتك</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-600 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-7 h-7" />
              </button>
            </header>

            {isLoading ? (
              <div className="h-80 flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <Loader2 className="w-12 h-12 text-[#22c55e] animate-spin" />
                    <div className="absolute inset-0 border-2 border-white/5 rounded-full animate-pulse" />
                </div>
                <p className="text-[10px] text-gray-500 tracking-[0.3em] uppercase font-black animate-pulse">Syncing with Sovereign Node...</p>
              </div>
            ) : (
              <div className="space-y-8 relative" dir="rtl">
                <div className="flex bg-black p-1 rounded-xl border border-gray-950 mb-6 gap-1">
                    {(['profile', 'security', 'radar'] as const).map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                                activeTab === tab 
                                ? 'bg-[#0d0d0d] text-[#22c55e] border border-[#22c55e]/20 font-black' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab === 'profile' && <span>👤 البيانات الشخصية</span>}
                            {tab === 'security' && <span>🔑 التفعيل والخصوصية</span>}
                            {tab === 'radar' && <span>📡 الرادار والنغمات</span>}
                        </button>
                    ))}
                </div>

                <div className="min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' && (
                            <motion.div 
                                key="profile-tab"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="block text-gray-500 text-[11px] font-black mr-2 uppercase tracking-widest font-mono">الاسم الملكي</label>
                                        <input 
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="أبو قحط"
                                            className="w-full bg-black border border-gray-900 rounded-2xl px-5 py-3.5 text-white text-xs focus:border-[#22c55e] focus:outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-gray-500 text-[11px] font-black mr-2 uppercase tracking-widest font-mono">رابط الصورة (Avatar)</label>
                                        <input 
                                            type="text"
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            placeholder="https://"
                                            className="w-full bg-black border border-gray-900 rounded-2xl px-5 py-3.5 text-white text-xs font-mono focus:border-[#22c55e] focus:outline-none transition-all text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-gray-500 text-[11px] font-black mr-2 uppercase tracking-widest font-mono">الحالة السيادية (Bio)</label>
                                    <textarea 
                                        rows={2}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="اكتب شيئاً عن مكانتك..."
                                        className="w-full bg-black border border-gray-900 rounded-2xl px-5 py-3.5 text-white text-xs focus:border-[#22c55e] focus:outline-none transition-all resize-none shadow-inner"
                                    />
                                </div>
                                
                                <div className="bg-[#080808] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">نياشين العقدة السيادية:</span>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[9px] font-black rounded-lg shadow-[0_0_10px_rgba(212,175,55,0.1)]">👑 المؤسس</span>
                                        <span className="px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-[9px] font-black rounded-lg shadow-[0_0_10px_rgba(34,197,94,0.1)]">🔒 موثق</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div 
                                key="security-tab"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="p-5 bg-black border border-white/5 rounded-2xl flex items-center gap-4 group">
                                    <div className="flex-grow">
                                        <label className="block text-gray-500 text-[10px] font-black mb-2 uppercase tracking-widest font-mono pr-1">كود التفعيل الملكي</label>
                                        <input 
                                            type="text"
                                            value={activationCode}
                                            onChange={(e) => setActivationCode(e.target.value)}
                                            placeholder="أدخل كود التفعيل..."
                                            className="w-full bg-[#050505] border border-gray-900 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-[#D4AF37]/50 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleActivateCode}
                                        disabled={isActivating}
                                        className="mt-6 bg-[#D4AF37] text-black font-black text-xs px-6 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50"
                                    >
                                        {isActivating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تفعيل'}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em] pr-2 mb-2">إعدادات الخصوصية</h4>
                                    
                                    <div className="flex items-center justify-between p-4 bg-black/40 border border-gray-900 rounded-2xl hover:border-white/10 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 flex items-center justify-center bg-gray-900/50 rounded-xl border border-white/5">
                                                <Mail className={`w-4 h-4 ${showEmail ? 'text-[#22c55e]' : 'text-gray-600'}`} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-200">رؤية البريد الإلكتروني</p>
                                                <p className="text-[9px] text-gray-600 font-bold">السماح للمستخدمين الآخرين برؤية إيميلك</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleToggleEmailVisibility(!showEmail)}
                                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${showEmail ? 'bg-[#22c55e]' : 'bg-gray-800'}`}
                                        >
                                            <motion.div 
                                                animate={{ x: showEmail ? 26 : 4 }}
                                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                                            />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-black/40 border border-gray-900 rounded-2xl hover:border-white/10 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 flex items-center justify-center bg-gray-900/50 rounded-xl border border-white/5">
                                                <MapPin className={`w-4 h-4 ${isGeoVisible ? 'text-[#22c55e]' : 'text-gray-600'}`} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-200">الظهور الجغرافي (Geo Visibility)</p>
                                                <p className="text-[9px] text-gray-600 font-bold">تفعيل رادار موقعك للمستكشفين القريبين</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleToggleGeoVisibility(!isGeoVisible)}
                                            disabled={isGeoLoading}
                                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isGeoVisible ? 'bg-[#22c55e]' : 'bg-gray-800'} ${isGeoLoading ? 'opacity-50 cursor-wait' : ''}`}
                                        >
                                            <motion.div 
                                                animate={{ x: isGeoVisible ? 26 : 4 }}
                                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg flex items-center justify-center"
                                            >
                                                {isGeoLoading && <Loader2 className="w-2.5 h-2.5 text-black animate-spin" />}
                                            </motion.div>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'radar' && (
                            <motion.div 
                                key="radar-tab"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <label className="block text-gray-500 text-[11px] font-black mr-2 uppercase tracking-widest font-mono">نغمة الرنين السيادية</label>
                                    <div className="relative group">
                                        <select 
                                            value={selectedRingtone}
                                            onChange={(e) => handleRingtoneChange(e.target.value)}
                                            className="w-full bg-black border border-gray-900 rounded-2xl px-5 py-4 text-gray-300 text-xs font-black focus:border-[#22c55e] focus:outline-none appearance-none cursor-pointer transition-all pr-12"
                                        >
                                            <option value="cyber_neon">🔊 نيوني مشفر (افتراضي)</option>
                                            <option value="sovereign_alert">🎵 رنين عسكري صامت</option>
                                            <option value="classic_secure">🛡️ نغمة الأمان الكلاسيكية</option>
                                        </select>
                                        <Music className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-hover:text-[#22c55e] transition-colors" />
                                    </div>
                                </div>

                                <div className="p-6 bg-[#080808] border border-white/5 rounded-[2rem] text-center relative overflow-hidden group shadow-2xl">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <MapPin className="w-16 h-16 text-[#D4AF37]" />
                                    </div>
                                    <p className="text-gray-500 text-[11px] font-bold mb-5 tracking-tight">الاستكشاف الجغرافي للمستكشفين القريبين في نطاق 50كم</p>
                                    <button 
                                        onClick={handleOpenNearby}
                                        disabled={isSearchingNearby}
                                        className="w-full py-4 bg-gradient-to-r from-black to-gray-900 border border-gray-800 text-[#D4AF37] font-black text-xs rounded-2xl hover:border-[#D4AF37]/50 hover:shadow-[0_0_25px_rgba(212,175,55,0.15)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isSearchingNearby ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <span className="text-lg">✨</span>
                                                <span>البحث عن مستكشفين قريبين</span>
                                            </>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {nearbyUsers.length > 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-6 space-y-3"
                                            >
                                                {nearbyUsers.slice(0, 3).map((u, i) => (
                                                    <div key={u.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-900 border border-[#D4AF37]/30 flex items-center justify-center text-[10px] font-black text-[#D4AF37]">
                                                                {u.name[0]}
                                                            </div>
                                                            <span className="text-xs font-bold text-gray-300">{u.name}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-[#D4AF37]/60 group-hover:text-[#D4AF37] transition-colors">{u.distance}</span>
                                                    </div>
                                                ))}
                                                {nearbyUsers.length > 3 && (
                                                    <p className="text-[9px] text-gray-600 font-black">+ {nearbyUsers.length - 3} مستكشفين آخرين تم رصدهم</p>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="pt-2">
                    <button 
                        onClick={handleUpdateProfile}
                        disabled={isUpdating}
                        className="w-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] text-black font-black text-sm py-4 rounded-[1.25rem] shadow-[0_8px_30px_rgba(34,197,94,0.3)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <span>حفظ وتحديث البيانات الملكية</span>
                                <Check className="w-5 h-5 group-hover:scale-125 transition-transform" />
                            </>
                        )}
                    </button>
                </div>

                <footer className="pt-6 border-t border-white/5 text-center">
                    <div className="flex items-center justify-center gap-6 opacity-30 group cursor-default">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[7px] text-gray-600 font-black uppercase tracking-[0.4em]">Protocol</span>
                            <span className="text-[7px] text-[#D4AF37] font-mono">SNNS_SEC_v4.2</span>
                        </div>
                        <div className="w-[1px] h-4 bg-gray-800"></div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[7px] text-gray-600 font-black uppercase tracking-[0.4em]">Node Affinity</span>
                            <span className="text-[7px] text-[#22c55e] font-mono">SOVEREIGN_SA_RIYADH</span>
                        </div>
                    </div>
                </footer>
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
