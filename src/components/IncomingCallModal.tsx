import { motion } from 'motion/react';
import { Phone, PhoneOff, Crown } from 'lucide-react';

interface IncomingCallModalProps {
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({ callerName, onAccept, onReject }: IncomingCallModalProps) {
  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-royal-black border-2 border-neon-gold p-12 rounded-none text-center shadow-[0_0_50px_rgba(255,215,0,0.2)] max-w-sm w-full relative overflow-hidden"
      >
        {/* Background pulses */}
        <div className="absolute inset-0 border border-neon-gold/10 animate-pulse pointer-events-none" />
        
        <div className="relative mb-8">
          <div className="w-28 h-28 border border-dim-gold/30 p-1 mx-auto bg-dark-bg relative">
            <img 
              src={`https://ui-avatars.com/api/?name=${callerName}&background=111&color=FFD700&size=128`} 
              alt="Caller" 
              className="w-full h-full object-cover grayscale"
            />
          </div>
          <motion.div 
            className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neon-gold p-2 shadow-[0_0_15px_rgba(255,215,0,0.5)]"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-5 h-5 text-royal-black" />
          </motion.div>
        </div>

        <h2 className="text-neon-gold text-2xl font-black mb-2 tracking-widest uppercase text-shadow-gold">Incoming Call</h2>
        <p className="text-off-white/60 mb-10 font-light tracking-wide italic" dir="rtl">
          {callerName} يتصل بك عبر SNNS
        </p>
        
        <div className="flex gap-8 justify-center">
          <motion.button 
            onClick={onReject}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-red-900/20 border border-red-500/50 p-5 rounded-none text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <PhoneOff className="w-8 h-8" />
          </motion.button>
          
          <motion.button 
            onClick={onAccept}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-green-900/20 border border-green-500/50 p-5 rounded-none text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)]"
          >
            <Phone className="w-8 h-8 animate-bounce" />
          </motion.button>
        </div>
        
        <div className="mt-12 text-[8px] text-gold/30 uppercase tracking-[0.5em] font-black">
          Encrypted Sovereign Protocol V4
        </div>
      </motion.div>
    </div>
  );
}
