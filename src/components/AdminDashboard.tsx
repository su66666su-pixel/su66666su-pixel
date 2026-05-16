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
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

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
      const fetchFinancialStats = async () => {
        try {
          const { data, error } = await supabase
            .from('coin_transactions')
            .select('amount')
            .eq('transaction_type', 'subscription');

          if (error) {
            console.error("Error fetching financial stats:", error);
            return;
          }

          if (data) {
            const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
            setTotalRevenue(total);
            setSubscriberCount(data.length);
          }
        } catch (err) {
          console.error("Unexpected error fetching stats:", err);
        }
      };

      fetchFinancialStats();
    }
  }, [isAuthorized]);

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
          <a href="#" className="flex items-center gap-3 p-3 bg-[#D4AF37] text-black rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <LayoutDashboard className="w-5 h-5" />
            <span>لوحة التحكم</span>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 text-gray-400 hover:text-[#FFD700] hover:bg-[#1a1a1a] rounded-xl transition-all group">
            <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>إدارة المستخدمين</span>
          </a>
          <a href="#" className="flex items-center gap-3 p-3 text-gray-400 hover:text-[#FFD700] hover:bg-[#1a1a1a] rounded-xl transition-all group">
            <Coins className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>العملات والاشتراكات</span>
          </a>
        </nav>

        <div className="mt-auto p-4 bg-neon-gold/5 border border-neon-gold/10 rounded-xl">
          <p className="text-[10px] text-neon-gold font-bold uppercase tracking-widest text-center">
            Sovereign Admin Panel v4.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-dot-pattern">
        
        {/* Header - Royal Financial Statistics */}
        <div className="flex justify-between items-center mb-10 border-b border-[#D4AF37]/20 pb-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-black text-[#FFD700] tracking-tight"
            >
              الإحصائيات المالية الملكية
            </motion.h1>
            <p className="text-gray-500 text-sm mt-1">تتبع نمو اشتراكات الـ 10 ريال لحظياً</p>
          </div>
          <div className="flex gap-4">
            <button className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-800 text-[#FFD700] hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-2 text-xs font-bold shadow-lg">
              <ArrowUpRight className="w-4 h-4" />
              تصدير التقرير
            </button>
            <div className="flex items-center gap-3 bg-[#0f0f0f] pr-1 pl-4 py-1 rounded-full border border-white/5">
              <img 
                src="https://ui-avatars.com/api/?name=Admin&background=D4AF37&color=000" 
                className="w-10 h-10 rounded-full border-2 border-[#FFD700]" 
                alt="Admin"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-white">المشرف العام</p>
                <p className="text-[8px] text-gray-500 uppercase tracking-widest">Master Root</p>
              </div>
            </div>
          </div>
        </div>

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
            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">معدل التحويل (Conversion)</p>
            <h3 className="text-3xl font-black text-white mt-3 tracking-tighter">8.4%</h3>
            <div className="w-full bg-gray-900 h-2 mt-4 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '8.4%' }}
                   className="bg-[#FFD700] h-full shadow-[0_0_10px_#FFD700]" 
                />
            </div>
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
                  <tr key={`request-${request.id}-${idx}`} className="group hover:bg-white/[0.02] transition-all">
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
