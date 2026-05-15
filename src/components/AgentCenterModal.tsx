import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';

interface AgentCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function AgentCenterModal({ isOpen, onClose, username }: AgentCenterModalProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `snns.pro/join?ref=${username || 'King'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#0f0f0f] border-2 border-[#D4AF37] rounded-[2rem] p-8 shadow-[0_0_60px_rgba(212,175,55,0.2)] overflow-hidden"
            dir="rtl"
          >
            {/* Design accents */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#FFD700] opacity-10 blur-[80px]" />
            
            <header className="flex justify-between items-center mb-10 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#FFD700] rounded-xl flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-[#FFD700] font-black text-xl tracking-tight">مركز الوكيل المعتمد</h3>
                  <p className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest mt-0.5">Sovereign Agent Hub</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-[#D4AF37] text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">الرتبة: ملكي 👑</span>
                <button 
                  onClick={onClose}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </header>
 
            <div className="grid grid-cols-2 gap-4 mb-8">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-[#151515] p-5 rounded-2xl border border-white/5 group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-3 h-3 text-gray-500 group-hover:text-[#FFD700] transition-colors" />
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">أرباحي المتوفرة</p>
                </div>
                <h4 className="text-[#FFD700] font-black text-xl tabular-nums">450.00 ر.س</h4>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-[#151515] p-5 rounded-2xl border border-white/5 group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">إجمالي المبيعات</p>
                </div>
                <h4 className="text-white font-black text-xl tabular-nums">3,200 ر.س</h4>
              </motion.div>
            </div>
 
            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs text-gray-400 font-bold">رابط الدعوة الملكي الخاص بك</label>
                <p className="text-[10px] text-[#D4AF37] font-black uppercase">عمولة 15%</p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-black border border-white/5 rounded-2xl px-4 py-4 text-[#FFD700] text-xs font-mono overflow-hidden whitespace-nowrap">
                  {referralLink}
                </div>
                <button 
                  onClick={handleCopy}
                  className="bg-[#D4AF37] text-black w-14 rounded-2xl hover:bg-[#FFD700] transition-all flex items-center justify-center shadow-lg active:scale-95"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-4 rounded-2xl">
              <h5 className="text-[#FFD700] text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-center">تعليمات الوكلاء</h5>
              <ul className="text-[10px] text-gray-500 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>تحصل على عمولة فورية مقابل كل اشتراك يتم عن طريق رابطك.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>تتم تسوية الأرباح أسبوعياً عبر PayPal أو التحويل المباشر.</span>
                </li>
              </ul>
            </div>

            <p className="mt-8 text-center text-[7px] text-gray-700 uppercase tracking-[0.6em] font-mono">
              Agent Authenticator: SNNS-REF-PRO-2026
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
