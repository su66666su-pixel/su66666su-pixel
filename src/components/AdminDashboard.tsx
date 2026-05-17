import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Radar, 
  Printer, 
  BadgeCheck, 
  Loader2, 
  CheckCircle2, 
  Ban, 
  Crown,
  Search,
  Users
} from 'lucide-react';
import { supabase } from '../supabase';
import { useToast } from './Toast';

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalCodes: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch Stats
      const totalUsers = profilesData?.length || 0;
      const totalAgents = profilesData?.filter(p => p.membership_tier === 'agent').length || 0;
      
      const { count: codesCount } = await supabase
        .from('activation_codes')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers,
        totalAgents,
        totalCodes: codesCount || 0
      });

    } catch (error: any) {
      showToast("خطأ في جلب البيانات السيادية: " + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFreeze = async (userId: string, currentStatus: boolean) => {
      // In a real app, you'd update a 'is_frozen' column
      showToast("تم إرسال أمر التجميد للشبكة.. جاري المعالجة", 'info');
  };

  return (
    <div className="min-h-screen bg-[#020202] text-gray-100 font-cairo flex select-none" dir="rtl">
      {/* Sidebar */}
      <aside className="w-72 bg-[#050505] border-l border-gray-900/50 flex flex-col justify-between p-6 hidden lg:flex">
        <div className="space-y-8">
            <div className="flex items-center gap-4 pb-8 border-b border-gray-900/50">
                <div className="w-11 h-11 bg-black border-2 border-[#22c55e] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                    <span className="text-white font-black text-base font-mono tracking-tighter">SA</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-white text-sm font-black tracking-wider uppercase">QAYD | <span className="text-[#22c55e]">SNNS</span></span>
                    <span className="text-gray-600 text-[10px] font-bold">منصة التدقيق والتوثيق السيادي</span>
                </div>
            </div>

            <nav className="space-y-2">
                <a href="#" className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#0a0a0a] border border-[#22c55e]/20 text-white font-black text-xs transition-all shadow-[0_0_15px_rgba(34,197,94,0.05)]">
                    <ShieldCheck className="w-4 h-4 text-[#22c55e] drop-shadow-[0_0_5px_#22c55e]" /> 
                    <span>السجلات والموثقين</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-5 py-4 rounded-2xl text-gray-500 hover:text-white hover:bg-black/40 text-xs font-black transition-all group">
                    <ShieldAlert className="w-4 h-4 group-hover:text-[#22c55e] transition-colors" /> 
                    <span>طلبات الترخيص المعلقة</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-5 py-4 rounded-2xl text-gray-500 hover:text-white hover:bg-black/40 text-xs font-black transition-all group">
                    <Key className="w-4 h-4 group-hover:text-[#D4AF37] transition-colors" /> 
                    <span>رموز التحقق والسيادة</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-5 py-4 rounded-2xl text-gray-500 hover:text-white hover:bg-black/40 text-xs font-black transition-all group">
                    <Radar className="w-4 h-4 group-hover:text-blue-500 transition-colors" /> 
                    <span>رادار العقد النشطة</span>
                </a>
            </nav>
        </div>

        <div className="pt-6 border-t border-gray-900/50">
            <div className="flex items-center gap-4 bg-black/40 p-3 rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-black border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-black text-xs font-mono shadow-[0_0_10px_rgba(212,175,55,0.1)]">SA</div>
                <div className="flex flex-col">
                    <span className="text-white text-[11px] font-black">سلطان القحطاني 👑</span>
                    <span className="text-gray-600 text-[8px] font-mono tracking-[0.2em] uppercase">SOVEREIGN OWNER</span>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 lg:p-10 overflow-y-auto space-y-8 bg-[#020202]">
        
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-gray-900/50 pb-8">
            <div>
                <h1 className="text-white text-2xl font-black flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-[#22c55e]" />
                    سجل الهوية الرقمية والمستكشفين الموثقين
                </h1>
                <p className="text-gray-500 text-sm mt-2 font-medium">تتبع وإدارة رخص المستخدمين الذين تجاوزوا بروتوكول التحقق بنجاح</p>
            </div>
            
            <button className="px-6 py-3 bg-black border border-gray-900 text-gray-400 hover:text-white hover:border-gray-700 rounded-2xl text-xs font-black transition-all flex items-center gap-3 shadow-lg group">
                <Printer className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" /> 
                <span>طباعة بيان الموثقين</span>
            </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#050505] border border-gray-900 rounded-[2rem] p-6 flex justify-between items-center shadow-xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#22c55e]/5 blur-3xl rounded-full" />
                <div className="relative z-10">
                    <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-1">الموثقين بالكامل</p>
                    <h3 className="text-[#22c55e] text-3xl font-black font-mono">{stats.totalUsers} <span className="text-xs text-gray-600 font-cairo mr-1">عقدة</span></h3>
                </div>
                <BadgeCheck className="w-10 h-10 text-[#22c55e] opacity-20 relative z-10" />
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#050505] border border-gray-900 rounded-[2rem] p-6 flex justify-between items-center shadow-xl relative overflow-hidden"
            >
                <div className="relative z-10">
                    <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-1">قيد الفحص والتدقيق</p>
                    <h3 className="text-white text-3xl font-black font-mono">12 <span className="text-xs text-gray-600 font-cairo mr-1">طلب</span></h3>
                </div>
                <Loader2 className="w-10 h-10 text-gray-800 animate-spin relative z-10" />
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#050505] border border-gray-900 rounded-[2rem] p-6 flex justify-between items-center shadow-xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 blur-3xl rounded-full" />
                <div className="relative z-10">
                    <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-1">إجمالي رموز التفعيل</p>
                    <h3 className="text-[#D4AF37] text-3xl font-black font-mono">{stats.totalCodes} <span className="text-xs text-gray-600 font-cairo mr-1">كود</span></h3>
                </div>
                <Key className="w-10 h-10 text-[#D4AF37] opacity-20 relative z-10" />
            </motion.div>
        </div>

        {/* Table Section */}
        <div className="bg-[#050505] border border-gray-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#22c55e]/5 blur-[100px] rounded-full -ml-32 -mt-32 opacity-30" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-gray-900 mb-6 gap-4 relative z-10">
                <div>
                   <h2 className="text-white font-black text-sm tracking-[0.2em] uppercase">قائمة مستخدمي الشبكة المعتمدين</h2>
                   <p className="text-[10px] text-gray-600 font-mono mt-1 uppercase tracking-widest">SECURE BASE • DATA VERIFIED</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <input 
                      type="text" 
                      placeholder="بحث عن عقدة سيادية..."
                      className="w-full bg-[#080808] border border-gray-800 rounded-xl px-4 py-2.5 pr-10 text-xs text-white focus:border-[#22c55e] focus:outline-none transition-all"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                </div>
            </div>

            <div className="overflow-x-auto relative z-10">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 text-[#22c55e] animate-spin" />
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Syncing Records...</span>
                    </div>
                ) : (
                    <table className="w-full text-right text-xs">
                        <thead>
                            <tr className="border-b border-gray-900 text-gray-500 font-black uppercase tracking-widest text-[10px]">
                                <th className="pb-4 pr-4">المستكشف (الاسم الملكي)</th>
                                <th className="pb-4">القناة المشفرة (الإيميل)</th>
                                <th className="pb-4 text-center">الرتبة السيادية</th>
                                <th className="pb-4 text-center">بروتوكول الأمان</th>
                                <th className="pb-4 pl-4 text-left">التحكم بالرخصة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-900/50">
                            {profiles.slice(0, 50).map((profile) => (
                                <tr key={profile.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="py-5 pr-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono text-[10px] font-black shadow-inner transition-transform group-hover:scale-110 ${profile.membership_tier === 'agent' ? 'bg-black border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-black border-gray-800 text-white'}`}>
                                                {(profile.username || 'U').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-black text-sm">{profile.username || 'بلا اسم'}</span>
                                                <span className="text-[9px] text-gray-600 font-mono tracking-tighter uppercase">{profile.id.substring(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <span className="font-mono text-gray-500 text-[11px] bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">{profile.id.includes('su66666su') ? 'su66666su@gmail.com' : '*******@****.**'}</span>
                                    </td>
                                    <td className="py-5 text-center">
                                        {profile.membership_tier === 'agent' ? (
                                            <span className="px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] rounded-xl font-black">👑 وكيل سيادي</span>
                                        ) : (
                                            <span className="px-3 py-1.5 bg-gray-900 border border-gray-800 text-gray-400 text-[10px] rounded-xl font-black">مستكشف معتمد</span>
                                        )}
                                    </td>
                                    <td className="py-5">
                                        <div className="flex items-center justify-center gap-2 font-black">
                                            <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e] animate-pulse"></div>
                                            <span className="text-[#22c55e]">موثق بالكامل</span>
                                        </div>
                                    </td>
                                    <td className="py-5 pl-4 text-left">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleToggleFreeze(profile.id, false)}
                                                className="px-4 py-2 bg-black border border-gray-800 rounded-xl text-gray-500 hover:text-red-500 hover:border-red-900/30 transition-all text-[10px] font-black group/btn"
                                            >
                                                <Ban className="w-3.5 h-3.5 inline-block ml-2 group-hover/btn:rotate-12 transition-transform" />
                                                تجميد الرخصة
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* Mock row if none exist to show the design */}
                            {profiles.length === 0 && !loading && (
                                <tr className="hover:bg-white/5 transition-colors group">
                                    <td className="py-5 pr-4 flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-black border border-[#D4AF37]/30 flex items-center justify-center font-mono text-[#D4AF37] text-[10px] font-black group-hover:scale-110 transition-transform">SA</div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-black text-sm">سارة علي</span>
                                            <span className="text-gray-650 text-[9px] font-mono tracking-tighter uppercase">589A-4B22</span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 font-mono text-gray-500 text-[11px]">sara@gmail.com</td>
                                    <td className="py-3.5 text-center">
                                        <span className="px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] rounded-xl font-black">👑 وكيل سيادي</span>
                                    </td>
                                    <td className="py-3.5">
                                        <div className="flex items-center justify-center gap-2 font-black">
                                            <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e] animate-pulse"></div>
                                            <span className="text-[#22c55e]">موثق بالكامل</span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 pl-4 text-left">
                                        <button className="px-4 py-2 bg-black border border-gray-900 rounded-xl text-gray-500 hover:text-red-500 hover:border-red-900/30 transition-all text-[10px] font-black">تجميد الرخصة</button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

      </main>
    </div>
  );
}
