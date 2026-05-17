import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { 
  Users, 
  PhoneCall, 
  Key, 
  Activity, 
  Zap, 
  ShieldAlert, 
  Search, 
  Loader2, 
  Check,
  Shield,
  ShieldCheck,
  ShieldAlert as ShieldBan,
  MoreVertical,
  LayoutDashboard
} from 'lucide-react';
import { useToast } from './Toast';

export default function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeCodesCount, setActiveCodesCount] = useState(0);
  const [activeCalls, setActiveCalls] = useState(0);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [codePlan, setCodePlan] = useState('vip_sovereign');
  const [codeCount, setCodeCount] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const checkProtection = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAuthorized(false);
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    };

    checkProtection();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchStats();
      fetchUsers();

      // Implement the Sovereign Radar (Real-time tracking of user changes)
      const radarChannel = supabase
        .channel('admin_radar')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, (payload) => {
          console.log("📡 Radar detected a change in the digital kingdom!", payload);
          fetchStats();
          fetchUsers();
          showToast("📡 رادار السيادة: تم رصد تحديث في قاعدة البيانات الملكية!", 'info');
        })
        .subscribe();

      return () => {
        radarChannel.unsubscribe();
      };
    }
  }, [isAuthorized]);

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : currentRole === 'agent' ? 'admin' : 'agent';
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      showToast(`تم تغيير الرتبة إلى ${newRole} بنجاح 👑`, 'royal');
      // No need to call fetchUsers manually due to real-time subscription
    } catch (err: any) {
      showToast("فشل الترقية: " + err.message, 'error');
    }
  };

  const fetchStats = async () => {
    try {
      // Total Users
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      setTotalUsers(usersCount || 0);

      // Active Codes
      const { count: codesCount } = await supabase
        .from('activation_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_used', false);
      setActiveCodesCount(codesCount || 0);

      // Mock Active Calls (Normally we'd have a room_participants table or similar)
      setActiveCalls(Math.floor(Math.random() * 12) + 3);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsersList(data || []);
    } catch (err) {
      console.error("Users fetch error:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const generateSovereignCodes = async () => {
    setIsGenerating(true);
    try {
      const codes = [];
      const reward_type = 'gold_membership'; // Default for these plans
      
      for (let i = 0; i < codeCount; i++) {
        const randomCode = 'SNNS-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        codes.push({
          code: randomCode,
          reward_type: reward_type,
          is_used: false,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          metadata: { plan: codePlan }
        });
      }

      const { error } = await supabase
        .from('activation_codes')
        .insert(codes);

      if (error) throw error;
      
      showToast(`⚡ تم توليد ${codeCount} كود سيادي بنجاح!`, 'royal');
      fetchStats();
    } catch (err: any) {
      showToast("فشل التوليد: " + err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      
      if (error) throw error;
      showToast(`تم تغيير حالة المستخدم إلى ${newStatus === 'banned' ? 'محظور' : 'نشط'}`, 'info');
      fetchUsers();
    } catch (err: any) {
      showToast("فشل التحديث: " + err.message, 'error');
    }
  };

  const filteredUsers = usersList.filter(u => 
    (u.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <ShieldBan className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-white text-2xl font-black">الدخول مرفوض</h1>
          <p className="text-gray-500">لا تملك صلاحيات كافية للوصول لغرفة القيادة.</p>
          <button onClick={() => window.location.href = '/'} className="text-neon-gold border border-neon-gold/50 px-6 py-2 rounded-full font-bold">العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-neon-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020202] text-gray-100 p-8 font-cairo select-none" dir="rtl">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-900 pb-6 mb-8 gap-4">
          <div>
              <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#22c55e] rounded-full shadow-[0_0_12px_#22c55e] animate-pulse"></div>
                  <h1 className="text-white text-3xl font-black tracking-tight">غرفة القيادة والتحكم السيادية</h1>
              </div>
              <p className="text-gray-500 text-xs mt-1.5 font-medium tracking-wide">المراقب العام للعمليات، الأكواد، والمكالمات المشفرة داخل المملكة</p>
          </div>
          
          <div className="flex items-center gap-4 bg-[#0a0a0a] border border-gray-900 px-5 py-3 rounded-2xl shadow-lg">
              <div className="text-left font-mono">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">SERVER STATUS</p>
                  <p className="text-[#22c55e] text-xs font-bold tracking-widest animate-pulse text-left">STABLE • 99.9%</p>
              </div>
              <div className="w-[1px] h-8 bg-gray-800"></div>
              <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-bold">المسؤول الحالي</p>
                  <p className="text-neon-gold text-xs font-black">أدمن السيادة 👑</p>
              </div>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <motion.div whileHover={{ y: -5 }} className="bg-[#060606] border border-gray-900 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-[#22c55e]/30 shadow-md">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-gray-500 text-xs font-bold">المستكشفين المسجلين</p>
                      <h3 className="text-white text-3xl font-black font-mono mt-2">{totalUsers.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-[#22c55e]/5 rounded-xl text-[#22c55e] border border-[#22c55e]/10 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
                      <Users className="w-5 h-5" />
                  </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22c55e]/30 to-transparent"></div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-[#060606] border border-gray-900 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-[#22c55e]/30 shadow-md">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-gray-500 text-xs font-bold">المكالمات النشطة حالياً</p>
                      <h3 className="text-[#22c55e] text-3xl font-black font-mono mt-2 flex items-center gap-2">
                          <span>{activeCalls}</span>
                          <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-ping"></span>
                      </h3>
                  </div>
                  <div className="p-3 bg-[#22c55e]/5 rounded-xl text-[#22c55e] border border-[#22c55e]/10">
                      <PhoneCall className="w-5 h-5 animate-bounce" />
                  </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#22c55e]/50 to-transparent"></div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-[#060606] border border-gray-900 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-neon-gold/30 shadow-md">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-gray-500 text-xs font-bold">رموز السيادة النشطة</p>
                      <h3 className="text-neon-gold text-3xl font-black font-mono mt-2">{activeCodesCount}</h3>
                  </div>
                  <div className="p-3 bg-neon-gold/5 rounded-xl text-neon-gold border border-neon-gold/10">
                      <Key className="w-5 h-5" />
                  </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-gold/30 to-transparent"></div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-[#060606] border border-gray-900 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-gray-800 shadow-md">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-gray-500 text-xs font-bold">معدل نقل البيانات (P2P)</p>
                      <h3 className="text-gray-300 text-2xl font-black font-mono mt-2.5">94.2 Gbps</h3>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-xl text-gray-400 border border-gray-800">
                      <Activity className="w-5 h-5" />
                  </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
          </motion.div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Code Generation Section */}
          <div className="bg-[#050505] border border-gray-900 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                  <div className="flex items-center gap-2.5 mb-4">
                      <Zap className="w-5 h-5 text-neon-gold drop-shadow-[0_0_5px_rgba(255,215,0,0.2)]" />
                      <h2 className="text-white font-black text-lg">توليد رموز الاشتراك الملوكية</h2>
                  </div>
                  <p className="text-gray-500 text-xs mb-6 leading-relaxed">أنشئ أكواد ورموز مشفرة لبيعها للوكلاء والمستخدمين لتفعيل ميزات البث والاتصال المرئي الفخمة.</p>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-gray-400 text-xs font-bold mb-2">نوع الباقة الملكية</label>
                          <select 
                            value={codePlan}
                            onChange={(e) => setCodePlan(e.target.value)}
                            className="w-full bg-black border border-gray-900 rounded-xl px-4 py-3 text-gray-200 text-xs font-medium focus:border-[#22c55e] focus:outline-none transition-colors"
                          >
                              <option value="vip_sovereign">👑 باقة السيادة المطلقة (سنة كاملة)</option>
                              <option value="prime_broadcast">⚡ باقة البث والمكالمات (6 أشهر)</option>
                              <option value="test_drive">📡 كود تجريبي (شهر واحد)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-gray-400 text-xs font-bold mb-2">عدد الأكواد المطلوبة</label>
                          <input 
                            type="number" 
                            value={codeCount}
                            onChange={(e) => setCodeCount(parseInt(e.target.value) || 1)}
                            min="1" 
                            max="50" 
                            className="w-full bg-black border border-gray-900 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-[#22c55e] focus:outline-none"
                          />
                      </div>
                  </div>
              </div>

              <button 
                onClick={generateSovereignCodes}
                disabled={isGenerating}
                className="w-full mt-6 bg-gradient-to-r from-[#22c55e] to-[#4ade80] text-black font-black text-sm py-3.5 rounded-xl shadow-[0_4px_20px_rgba(34,197,94,0.25)] hover:shadow-[0_4px_30px_#22c55e] hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'صك وتوليد الأكواد الفورية ⚡'}
              </button>
          </div>

          {/* User Management Section */}
          <div className="lg:col-span-2 bg-[#050505] border border-gray-900 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-900 mb-6 gap-4">
                  <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-[#22c55e] drop-shadow-[0_0_5px_rgba(34,197,94,0.2)]" />
                      <h2 className="text-white font-black text-lg">التحكم بالمستكشفين والشبكة</h2>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input 
                      type="text" 
                      placeholder="ابحث بالاسم أو البريد الإلكتروني..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-black border border-gray-900 rounded-xl px-9 py-2 text-xs text-white placeholder-gray-600 w-full focus:border-[#22c55e] focus:outline-none"
                    />
                  </div>
              </div>

              <div className="overflow-x-auto min-h-[300px]">
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="w-8 h-8 text-neon-gold animate-spin" />
                    </div>
                  ) : (
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="border-b border-gray-900 text-gray-500 text-xs font-bold">
                                <th className="pb-3 pr-2">المستكشف</th>
                                <th className="pb-3">البريد الإلكتروني</th>
                                <th className="pb-3">الرتبة</th>
                                <th className="pb-3">الحالة الأمنية</th>
                                <th className="pb-3 pl-2 text-left">الإجراء والتحكم</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-medium divide-y divide-gray-950">
                            {filteredUsers.map((u, idx) => (
                              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="py-4 pr-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-800">
                                      <img 
                                        src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=111&color=D4AF37`} 
                                        alt={u.username}
                                        className="w-full h-full object-cover" 
                                      />
                                    </div>
                                    <span className="font-bold text-gray-200">{u.username}</span>
                                  </div>
                                </td>
                                <td className="py-4 text-gray-500 font-mono text-[10px]">{u.id.substring(0, 15)}...</td>
                                <td className="py-4">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${u.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : u.role === 'agent' ? 'bg-neon-gold/10 text-neon-gold border border-neon-gold/20' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                                    {u.role || 'user'}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'banned' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'}`} />
                                    <span className={u.status === 'banned' ? 'text-red-500' : 'text-green-500'}>{u.status === 'banned' ? 'محظور' : 'نشط'}</span>
                                  </div>
                                </td>
                                <td className="py-4 pl-2 text-left">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => toggleUserRole(u.id, u.role || 'user')}
                                      className="px-3 py-1.5 bg-black border border-gray-900 rounded-lg text-gray-400 hover:text-neon-gold hover:border-neon-gold/40 transition-all font-bold text-[10px] uppercase"
                                    >
                                      ترقية
                                    </button>
                                    <button 
                                      onClick={() => toggleUserStatus(u.id, u.status)}
                                      className={`px-3 py-1.5 rounded-lg border transition-all font-bold text-[10px] uppercase ${u.status === 'banned' ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-black' : 'bg-red-950/20 border-red-900/30 text-red-400 hover:bg-red-600 hover:text-white'}`}
                                    >
                                      {u.status === 'banned' ? 'إلغاء' : 'حظر قطعي'}
                                    </button>
                                    <button className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-500 hover:text-white transition-all">
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                    </table>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
}
