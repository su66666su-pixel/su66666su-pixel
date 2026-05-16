import React from 'react';
import { motion } from 'motion/react';
import { X, Gift as GiftIcon } from 'lucide-react';

interface Gift {
  id: string;
  name: string;
  emoji: string;
  points: number;
}

interface GiftSelectorProps {
  onSendGift: (gift: Gift) => void;
  onClose?: () => void;
}

const GIFTS: Gift[] = [
  { id: 'star', name: 'نجمة', emoji: '⭐', points: 50 },
  { id: 'crown', name: 'تاج', emoji: '👑', points: 100 },
  { id: 'diamond', name: 'ماسة', emoji: '💎', points: 200 },
];

export default function GiftSelector({ onSendGift, onClose }: GiftSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 font-sans p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#0a0a0a] border-2 border-[#D4AF37] w-full max-w-md p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(212,175,55,0.15)] text-center relative"
      >
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <GiftIcon className="w-12 h-12 text-[#FFD700] mx-auto" />
          </motion.div>
          <h3 className="text-white text-2xl font-black mt-4 tracking-tight" dir="rtl">إرسال كرم ملكي</h3>
          <p className="text-gray-500 text-xs mt-2 uppercase tracking-[0.2em]" dir="rtl">اختر الهدية التي تليق بمجلسك</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {GIFTS.map((gift) => (
            <motion.button
              key={gift.id}
              whileHover={{ scale: 1.05, borderColor: '#FFD700', backgroundColor: 'rgba(255, 215, 0, 0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSendGift(gift)}
              className="flex flex-col items-center p-4 bg-[#111] border border-gray-800 rounded-2xl transition-all group"
            >
              <span className="text-3xl block mb-2 filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
                {gift.emoji}
              </span>
              <span className="text-white text-xs block font-bold mb-1" dir="rtl">{gift.name}</span>
              <span className="text-[#FFD700] text-[10px] block font-black uppercase tracking-wider">
                {gift.points} نقطة
              </span>
            </motion.button>
          ))}
        </div>
        
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-black rounded-2xl shadow-[0_10px_30px_rgba(255,215,0,0.2)] text-xs uppercase tracking-[0.2em]"
            onClick={() => onSendGift(GIFTS[1])} // Default to Crown if they just click send
          >
            إرسال الآن ✨
          </motion.button>
          {onClose && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-8 py-4 bg-white/5 text-gray-400 font-bold rounded-2xl hover:bg-white/10 transition-all text-xs"
            >
              إلغاء
            </motion.button>
          )}
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFD700]/5 blur-3xl rounded-full -mr-12 -mt-12" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#FFD700]/5 blur-3xl rounded-full -ml-12 -mb-12" />
      </motion.div>
    </div>
  );
}
