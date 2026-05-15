import React from 'react';
import { motion } from 'motion/react';
import { 
  Crown, 
  LayoutDashboard, 
  Users, 
  Coins, 
  Bell, 
  EllipsisVertical, 
  TrendingUp, 
  ArrowUpRight 
} from 'lucide-react';

export default function AdminDashboard() {
  const joinRequests = [
    {
      id: '1',
      name: 'سلطان القحطاني',
      plan: 'احترافية ملكية',
      status: 'نشط',
      avatar: 'https://ui-avatars.com/api/?name=Sultan&background=D4AF37&color=000'
    },
    {
      id: '2',
      name: 'فيصل العتيبي',
      plan: 'عضوية ذهبية',
      status: 'قيد الانتظار',
      avatar: 'https://ui-avatars.com/api/?name=Faisal&background=333&color=FFD700'
    },
    {
      id: '3',
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
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-black tracking-tight"
            >
              مرحباً بك، مدير النظام 👋
            </motion.h2>
            <p className="text-gray-500 mt-1">إليك ملخص نشاط SNNS لهذا اليوم</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-[#0f0f0f] p-3 rounded-full border border-white/5 text-[#FFD700] hover:scale-110 transition-all relative group">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f0f0f]" />
            </button>
            <div className="flex items-center gap-3 bg-[#0f0f0f] pr-1 pl-4 py-1 rounded-full border border-white/5">
              <img 
                src="https://ui-avatars.com/api/?name=Admin&background=D4AF37&color=000" 
                className="w-10 h-10 rounded-full border-2 border-[#FFD700]" 
                alt="Admin"
              />
              <div className="text-left">
                <p className="text-xs font-bold">المشرف العام</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest">Master Root</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-16 h-16 text-[#FFD700]" />
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              إجمالي الإيرادات
              <ArrowUpRight className="w-3 h-3 text-green-400" />
            </p>
            <h3 className="text-2xl font-black text-[#FFD700] mt-2 tabular-nums">1,250,680 ر.س</h3>
            <div className="h-1 bg-white/5 mt-6 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "66%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" 
              />
            </div>
            <p className="text-[10px] text-green-400 mt-2 font-bold">+12.5% منذ الشهر الماضي</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/5 shadow-2xl"
          >
             <p className="text-gray-500 text-sm">المستخدمين النشطين</p>
             <h3 className="text-2xl font-black text-white mt-2 tabular-nums">42,890</h3>
             <div className="flex gap-1 mt-4">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className={`h-8 w-full bg-white/5 rounded-sm overflow-hidden relative`}>
                    <div className="absolute bottom-0 w-full bg-neon-gold/20" style={{ height: `${Math.random() * 100}%` }} />
                  </div>
                ))}
             </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/5 shadow-2xl"
          >
             <p className="text-gray-500 text-sm">الجلسات الحالية</p>
             <h3 className="text-2xl font-black text-green-400 mt-2 tabular-nums">1,402</h3>
             <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full online-pulse" />
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Real-time Traffic</span>
             </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/5 shadow-2xl bg-gradient-to-br from-[#0f0f0f] to-neon-gold/5"
          >
             <p className="text-gray-500 text-sm">تقييم المنصة</p>
             <h3 className="text-2xl font-black text-[#FFD700] mt-2 tabular-nums">4.9/5.0</h3>
             <div className="mt-4 flex text-neon-gold gap-0.5">
                {[1,2,3,4,5].map(i => <Crown key={i} className="w-3 h-3 fill-current" />)}
             </div>
          </motion.div>
        </div>

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
                {joinRequests.map((request) => (
                  <tr key={request.id} className="group hover:bg-white/[0.02] transition-all">
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
