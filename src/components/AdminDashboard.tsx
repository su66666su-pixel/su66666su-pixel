import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../supabase';
import { 
  Crown, 
  LayoutDashboard, 
  Users, 
  Coins, 
  Bell, 
  EllipsisVertical, 
  TrendingUp, 
  ArrowUpRight,
  Star
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'coins'>('stats');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    const checkProtection = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/';
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        alert("⚠️ عذراً يا ملك، هذه المنطقة مخصصة للإدارة العليا فقط!");
        window.location.href = '/';
      } else {
        setIsAuthorized(true);
      }
    };

    checkProtection();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      if (activeTab === 'stats') {
        const fetchFinancialStats = async () => {
          try {
            // Fetch Transactions
            const { data: transData, error: transError } = await supabase
              .from('coin_transactions')
              .select('amount')
              .eq('transaction_type', 'subscription');

            if (!transError && transData) {
              const total = transData.reduce((sum, item) => sum + (item.amount || 0), 0);
              setTotalRevenue(total);
              setSubscriberCount(transData.length);
            }

            // Fetch User Count
            const { count, error: userError } = await supabase
              .from('user_profiles')
              .select('*', { count: 'exact', head: true });
            
            if (!userError) setTotalUsers(count || 0);

          } catch (err) {
            console.error("Unexpected error fetching stats:", err);
          }
        };

        fetchFinancialStats();
      } else if (activeTab === 'users') {
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
            console.error("Error fetching users:", err);
          } finally {
            setIsLoadingUsers(false);
          }
        };
        fetchUsers();
      }
    }
  }, [isAuthorized, activeTab]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Error updating role:", err);
      alert("فشل تحديث الرتبة ❌");
    }
  };

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505]">
        <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const chartData = {
    labels: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    datasets: [
      {
        label: 'الإيرادات اليومية',
        data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#FFD700',
        pointBorderColor: '#000',
        pointHoverRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0a0a0a',
        titleColor: '#FFD700',
        bodyColor: '#fff',
        borderColor: '#D4AF37',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        rtl: true,
        titleFont: { family: 'Cairo' },
        bodyFont: { family: 'Cairo' },
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8E9299', font: { family: 'Cairo', size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#8E9299', font: { family: 'Cairo', size: 10 } }
      }
    }
  };

  const joinRequests = [
    {
      id: 'request-1',
      name: 'سلطان القحطاني',
      plan: 'احترافية ملكية',
      status: 'نشط',
      avatar: 'https://ui-avatars.com/api/?name=Sultan&background=D4AF37&color=000'
    },
    {
      id: 'request-2',
      name: 'فيصل العتيبي',
      plan: 'عضوية ذهبية',
      status: 'قيد الانتظار',
      avatar: 'https://ui-avatars.com/api/?name=Faisal&background=333&color=FFD700'
    },
    {
      id: 'request-3',
      name: 'نورة الدوسري',
      plan: 'احترافية ملكية',
      status: 'نشط',
      avatar: 'https://ui-avatars.com/api/?name=Noura&background=D4AF37&color=000'
    }
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-white font-cairo" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f0f0f] border-l border-white/5 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center shadow-[0_0_15px_#FFD700]">
            <Crown className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-[#FFD700]">SNNS.PRO</h1>
        </div>
        
        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeTab === 'stats' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'text-gray-400 hover:text-[#FFD700] hover:bg-[#1a1a1a]'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>لوحة التحكم</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'text-gray-400 hover:text-[#FFD700] hover:bg-[#1a1a1a]'}`}
          >
            <Users className="w-5 h-5" />
            <span>إدارة المستخدمين</span>
          </button>
          <button 
            onClick={() => setActiveTab('coins')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeTab === 'coins' ? 'bg-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'text-gray-400 hover:text-[#FFD700] hover:bg-[#1a1a1a]'}`}
          >
            <Coins className="w-5 h-5" />
            <span>العملات والاشتراكات</span>
          </button>
        </nav>

        <div className="mt-auto p-4 bg-neon-gold/5 border border-neon-gold/10 rounded-xl">
          <p className="text-[10px] text-neon-gold font-bold uppercase tracking-widest text-center">
            Sovereign Admin Panel v4.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-dot-pattern">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10 border-b border-[#D4AF37]/20 pb-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-black text-[#FFD700] tracking-tight uppercase"
            >
              {activeTab === 'stats' ? 'Royal Financial Statistics' : activeTab === 'users' ? 'User Management' : 'Economy Hub'}
            </motion.h1>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === 'stats' ? 'تتبع نمو اشتراكات الـ 10 ريال لحظياً' : activeTab === 'users' ? 'إدارة رتب الملوك والوكلاء في السيادة' : 'إدارة خزانة السيادة والعملات والاشتراكات'}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-3 bg-[#0f0f0f] pr-1 pl-4 py-1 rounded-full border border-white/5">
              <img 
                src="https://ui-avatars.com/api/?name=Admin&background=D4AF37&color=000" 
                className="w-10 h-10 rounded-full border-2 border-[#FFD700]" 
                alt="Admin"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-white uppercase">Master Root</p>
                <span className="text-[8px] bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20">ADMINISTRATOR</span>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'stats' ? (
          <>
            {/* Stats Grid - Enhanced Financial Focus */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[#0f0f0f] p-8 rounded-[2rem] border border-gray-800 relative overflow-hidden group shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                  <Coins className="w-20 h-20 text-[#FFD700]" />
                </div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">إجمالي الدخل (PayPal)</p>
                <h3 className="text-3xl font-black text-[#FFD700] mt-3 tracking-tighter" id="totalRevenue">{totalRevenue.toLocaleString()}.00 $</h3>
                <div className="flex items-center gap-1 mt-3">
                  <span className="text-[10px] text-green-500 font-bold">+12% عن الشهر الماضي</span>
                  <TrendingUp className="w-3 h-3 text-green-500" />
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[#0f0f0f] p-8 rounded-[2rem] border border-gray-800 shadow-2xl"
              >
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">المشتركون النشطون</p>
                <h3 className="text-3xl font-black text-white mt-3 tabular-nums" id="activeSubscribers">{subscriberCount.toLocaleString()}</h3>
                <p className="text-[10px] text-[#D4AF37] mt-3 font-bold">قيد التجربة: 148 مستخدم</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[#0f0f0f] p-8 rounded-[2rem] border border-gray-800 shadow-2xl"
              >
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">إجمالي المستخدمين</p>
                <h3 className="text-3xl font-black text-white mt-3 tabular-nums" id="totalUsers">{totalUsers.toLocaleString()}</h3>
                <p className="text-[10px] text-neon-gold mt-3 font-bold">ملوك مسجلون في السيادة</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-[#0f0f0f] p-8 rounded-[2rem] border border-gray-800 bg-gradient-to-br from-[#0f0f0f] to-neon-gold/5 shadow-2xl"
              >
                 <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">تقييم المنصة</p>
                 <h3 className="text-3xl font-black text-white mt-3 tracking-tighter">4.9/5.0</h3>
                 <div className="mt-4 flex text-neon-gold gap-1">
                    {[1,2,3,4,5].map((i, idx) => <Star key={`stat-star-${i}-${idx}`} className="w-3.5 h-3.5 fill-current" />)}
                 </div>
              </motion.div>
            </div>

            {/* Profit growth chart section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0f0f0f] p-10 rounded-[3rem] border border-gray-800 shadow-2xl mb-10"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-lg font-black text-[#FFD700] uppercase tracking-wider">منحنى نمو الأرباح</h3>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest font-bold">Daily Revenue Projection & Realized Profit</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FFD700]" />
                    <span className="text-[10px] text-gray-500 uppercase font-black">Revenue</span>
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] font-bold text-gray-400">
                    LIVE UPDATE
                  </div>
                </div>
              </div>
              <div className="h-[400px] relative">
                <Line data={chartData} options={chartOptions} />
              </div>
            </motion.div>

            {/* Table Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0f0f0f] rounded-2xl border border-white/5 p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-[#FFD700] uppercase tracking-wider">أحدث طلبات الانضمام</h3>
                <button className="text-[10px] bg-white/5 px-4 py-2 rounded-full font-bold hover:bg-white/10 transition-all border border-white/5">
                  عرض الكل
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-gray-500 border-b border-white/5">
                      <th className="pb-4 font-bold text-xs uppercase tracking-widest">المستخدم</th>
                      <th className="pb-4 font-bold text-xs uppercase tracking-widest">الخطة</th>
                      <th className="pb-4 font-bold text-xs uppercase tracking-widest">الحالة</th>
                      <th className="pb-4 font-bold text-xs uppercase tracking-widest text-left pl-4">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {joinRequests.map((request, idx) => (
                      <tr key={`join-req-${request.id || idx}-${idx}`} className="group hover:bg-white/[0.02] transition-all">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img src={request.avatar} className="w-10 h-10 rounded-full border border-white/10" alt={request.name} />
                              {request.status === 'نشط' && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0f0f0f] rounded-full" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-200">{request.name}</p>
                              <p className="text-[10px] text-gray-500">ID: #{Math.floor(Math.random() * 10000)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${request.plan === 'احترافية ملكية' ? 'bg-[#D4AF37]' : 'bg-neon-gold'}`} />
                            <span className="text-xs font-bold text-[#D4AF37]">{request.plan}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`
                            px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                            ${request.status === 'نشط' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}
                          `}>
                            {request.status}
                          </span>
                        </td>
                        <td className="py-4 text-left pl-4">
                          <button className="text-gray-600 hover:text-[#FFD700] transition-colors p-2 hover:bg-white/5 rounded-lg">
                            <EllipsisVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        ) : activeTab === 'users' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0f0f] rounded-3xl border border-white/5 overflow-hidden shadow-2xl"
          >
            {isLoadingUsers ? (
              <div className="h-64 flex items-center justify-center">
                 <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-8 py-6 font-black text-xs uppercase tracking-[0.2em] text-gray-400">الملك / المستخدم</th>
                      <th className="px-8 py-6 font-black text-xs uppercase tracking-[0.2em] text-gray-400">الاشتراك</th>
                      <th className="px-8 py-6 font-black text-xs uppercase tracking-[0.2em] text-gray-400">الرتبة السيادية</th>
                      <th className="px-8 py-6 font-black text-xs uppercase tracking-[0.2em] text-gray-400 text-left">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersList.map((u, idx) => (
                      <tr key={`u-row-${u.id}-${idx}`} className="hover:bg-gold/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 border border-gold/30 p-0.5 rounded-lg">
                               <img 
                                 src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=111&color=D4AF37`} 
                                 className="w-full h-full object-cover rounded shadow-md group-hover:scale-105 transition-transform" 
                               />
                            </div>
                            <div>
                               <p className="font-black text-sm text-off-white">{u.username}</p>
                               <p className="text-[10px] text-gray-500 font-mono italic">{u.id.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${u.is_premium ? 'bg-gold/10 text-gold border border-gold/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                             {u.membership_tier || 'مستكشف'}
                           </span>
                        </td>
                        <td className="px-8 py-5">
                           <select 
                             value={u.role || 'user'}
                             onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                             className="bg-[#1a1a1a] border border-white/10 text-xs font-bold text-off-white px-3 py-2 rounded-lg focus:border-gold outline-none transition-all cursor-pointer"
                           >
                             <option value="user">USER (مواطن)</option>
                             <option value="agent">AGENT (وكيل)</option>
                             <option value="admin">ADMIN (مشرف)</option>
                           </select>
                        </td>
                        <td className="px-8 py-5 text-left">
                           <button className="text-gray-500 hover:text-gold transition-colors">
                              <EllipsisVertical className="w-5 h-5" />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-[#0f0f0f] rounded-3xl border border-dashed border-gray-800">
             <Coins className="w-12 h-12 text-gray-700 mb-4" />
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Economy Management Module Coming Soon</p>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 text-center">
           <p className="text-[8px] text-gray-600 uppercase tracking-[0.8em]">
             End-to-End Sovereign Encryption Active // Node: Royal-Cluster-01
           </p>
        </div>
      </main>
    </div>
  );
}
