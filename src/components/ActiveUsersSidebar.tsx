import React from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';

export default function ActiveUsersSidebar() {
  const activeUsers = [
    {
      id: '1',
      name: 'سلطان القحطاني',
      status: 'نشط الآن',
      avatar: 'https://ui-avatars.com/api/?name=Sultan&background=0A0A0A&color=FFD700',
      isOnline: true,
      isPrivate: false
    },
    {
      id: '2',
      name: 'حساب خاص',
      status: 'مختفي',
      avatar: 'https://ui-avatars.com/api/?name=Guest&background=333&color=999',
      isOnline: false,
      isPrivate: true
    }
  ];

  return (
    <aside id="activeUsersSidebar" className="hidden xl:flex w-64 bg-[#0A0A0A] border-r border-[#D4AF37] h-full flex-col z-10">
      <div className="p-4 border-b border-[#333]">
        <h2 className="text-[#FFD700] font-bold text-sm tracking-widest text-right" dir="rtl">المتواجدون الآن</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeUsers.map((user) => (
          <motion.div 
            key={user.id}
            whileHover={{ backgroundColor: "rgba(212, 175, 55, 0.1)" }}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group ${user.isPrivate ? 'grayscale-[0.5]' : ''}`}
            dir="rtl"
          >
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.isPrivate ? 'Private' : user.name} 
                className={`w-10 h-10 rounded-full border border-[#D4AF37] shadow-[0_0_5px_#FFD700] ${user.isPrivate ? 'border-gray-600 shadow-none' : ''}`}
              />
              {user.isPrivate ? (
                <span className="absolute bottom-0 right-0 text-[10px] bg-black rounded-full p-0.5 text-[#D4AF37]">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              ) : (
                user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A0A0A] shadow-[0_0_8px_#22c55e] online-pulse" />
                )
              )}
            </div>
            
            <div className="flex flex-col text-right">
              <span className={`text-sm font-semibold ${user.isPrivate ? 'text-gray-500' : 'text-gray-200'}`}>
                {user.isPrivate ? 'حساب خاص' : user.name}
              </span>
              <span className={`text-[10px] ${user.isOnline ? 'text-green-400' : 'text-gray-600'}`}>
                {user.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </aside>
  );
}
