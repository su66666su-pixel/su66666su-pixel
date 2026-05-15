import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, X, Check, Star } from 'lucide-react';

interface SubscriptionNoticeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionNotice({ isOpen, onClose }: SubscriptionNoticeProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            className="relative bg-[#0f0f0f] border-2 border-[#D4AF37] rounded-[3rem] p-10 max-w-sm w-full text-center shadow-[0_0_60px_rgba(212,175,55,0.15)] overflow-hidden"
            dir="rtl"
          >
            {/* Background elements */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#FFD700] opacity-10 blur-[80px]" />
            
            <button 
              onClick={onClose}
              className="absolute top-8 left-8 text-gray-600 hover:text-[#FFD700] transition-colors z-20"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-8 relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-b from-[#FFD700] to-[#D4AF37] shadow-[0_0_25px_rgba(255,215,0,0.4)] mb-4">
                <Crown className="text-black w-10 h-10" />
              </div>
              <h2 className="text-white text-2xl font-black tracking-tight">العضوية الملكية</h2>
              <p className="text-[#D4AF37] text-[10px] mt-1 tracking-[0.3em] font-bold uppercase">SOVEREIGN ACCESS</p>
            </div>

            <div className="bg-[#151515] rounded-[2rem] p-6 mb-8 border border-white/5 relative group">
                <div className="text-4xl font-black text-white tracking-tighter">10.00 <span className="text-xs text-gray-500 font-medium">ر.س / شهر</span></div>
                <p className="text-[10px] text-green-500 mt-2 font-black uppercase tracking-widest animate-pulse">أول 3 أشهر مجاناً 🔥</p>
                <div className="absolute top-2 right-4 opacity-5">
                   <Star className="w-12 h-12 text-[#D4AF37]" />
                </div>
            </div>

            <ul className="text-right space-y-4 mb-10 px-2 text-xs text-gray-400 font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                  <span>مكالمات فيديو بدقة 4K</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                  <span>بث مباشر بدون إعلانات</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                  <span>شارة "الملك" الذهبية بجانب اسمك</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                  <span>أولوية في الظهور "بالقريبين مني"</span>
                </li>
            </ul>

            <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
                <input type="hidden" name="cmd" value="_s-xclick" />
                <input type="hidden" name="hosted_button_id" value="SK6RPCV6F289C" />
                <input type="hidden" name="currency_code" value="USD" />
                
                <button 
                  type="submit" 
                  className="w-full py-4 bg-[#FFD700] text-black font-black rounded-2xl shadow-[0_10px_30px_rgba(255,215,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.328a.641.641 0 0 1 .633-.541h9.191c4.14 0 6.643 2.053 6.643 5.4 0 2.946-1.92 6.002-5.46 6.005h-1.543l-.696 4.417a.641.641 0 0 1-.632.541H7.076z"/>
                    </svg>
                    اشتراك سيادي الآن
                </button>
            </form>

            <p className="mt-8 text-[8px] text-gray-700 uppercase tracking-widest font-mono">
              Secure Payment Processed by PayPal & SNNS Encryption
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
