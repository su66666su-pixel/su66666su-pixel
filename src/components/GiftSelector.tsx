import React from 'react';
import { motion } from 'motion/react';

interface Gift {
  id: string;
  name: string;
  emoji: string;
  points: number;
  label?: string;
  isHot?: boolean;
}

interface GiftSelectorProps {
  onSendGift: (gift: Gift) => void;
  userPoints?: number;
}

const GIFTS: Gift[] = [
  { id: 'rose', name: 'Rose', emoji: '🌹', points: 0, label: 'مجاني' },
  { id: 'falcon', name: 'Falcon', emoji: '🦅', points: 500 },
  { id: 'supercar', name: 'Supercar', emoji: '🏎️', points: 5000, isHot: true },
  { id: 'crown', name: 'Crown', emoji: '👑', points: 10000 },
];

export default function GiftSelector({ onSendGift, userPoints = 0 }: GiftSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-4 p-6 bg-[#0A0A0A] border-t-2 border-[#D4AF37] rounded-t-[3rem] shadow-[0_-20px_50px_rgba(212,175,55,0.1)]" dir="rtl">
      {GIFTS.map((gift) => (
        <motion.div
          key={gift.id}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSendGift(gift)}
          className={`flex flex-col items-center p-2 rounded-2xl transition-all cursor-pointer relative ${
            gift.points > 0 
              ? gift.isHot 
                ? 'border border-[#FFD700] bg-[#FFD700]/10 shadow-[0_0_15px_rgba(255,215,0,0.1)]' 
                : 'border border-[#D4AF37]/20 bg-gradient-to-b from-[#D4AF37]/5 to-transparent'
              : 'hover:bg-white/5'
          }`}
        >
          {gift.isHot && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-[8px] px-1.5 py-0.5 rounded font-black italic text-white z-10 shadow-lg">
              HOT
            </span>
          )}
          <span className="text-3xl mb-1 filter drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
            {gift.emoji}
          </span>
          <span className={`text-[10px] ${gift.points === 0 ? 'text-gray-500' : 'text-[#FFD700] font-black'}`}>
            {gift.points === 0 ? 'مجاني' : `${gift.points.toLocaleString()} نقطة`}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
