import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Monitor,
  Shield,
  Crown,
  Expand,
  Settings,
  Gift as GiftIcon,
  Bird
} from 'lucide-react';
import GiftSelector from './GiftSelector';

interface ActiveGift {
  type: string;
  emoji: string;
  name: string;
  timestamp: number;
}

interface VideoCallProps {
  onHangUp: () => void;
  targetName: string;
}

export default function VideoCall({ onHangUp, targetName }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showGifts, setShowGifts] = useState(false);
  const [activeGift, setActiveGift] = useState<ActiveGift | null>(null);

  const handleSendGift = (gift: any) => {
    setActiveGift({
      type: gift.name,
      emoji: gift.emoji,
      name: gift.name,
      timestamp: Date.now()
    });
    
    setShowGifts(false);

    // Auto-clear after 4 seconds
    setTimeout(() => {
      setActiveGift(null);
    }, 4000);
  };

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }

    startCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = !isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[150] flex flex-col font-sans overflow-hidden">
      {/* Encryption Header */}
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-dim-gold/30 flex items-center justify-center bg-royal-black shadow-[0_0_15px_rgba(255,215,0,0.1)]">
            <Crown className="w-5 h-5 crown-icon" />
          </div>
          <div className="text-right" dir="rtl">
            <h2 className="text-neon-gold font-bold tracking-tight text-sm uppercase text-shadow-gold">SNNS Sovereignty Bridge</h2>
            <div className="flex items-center gap-2 text-[8px] text-neon-gold/40 uppercase tracking-[0.3em]">
              <Shield className="w-2 h-2" /> 
              AES-GCM 256bit Encrypted
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 pointer-events-auto">
          <div className="text-right" dir="rtl">
             <p className="text-off-white text-sm font-bold">{targetName}</p>
             <p className="text-green-500 text-[8px] uppercase tracking-widest animate-pulse">00:12:45 Secure Session</p>
          </div>
          <button className="text-gold/50 hover:text-gold transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-4 pt-32 pb-32 h-full bg-black">
        {/* Local Stream (Host) */}
        <div className="relative group overflow-hidden border-2 border-[#FFD700] bg-[#050505] shadow-[0_0_30px_rgba(255,215,0,0.1)]">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover grayscale brightness-110 transition-all duration-700 ${!isVideoOn ? 'opacity-0' : 'opacity-100'}`}
          />
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#080808]">
               <VideoOff className="w-16 h-16 text-gold/10" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black/50 px-2 text-xs py-1 text-off-white font-medium" dir="rtl">
            المضيف
          </div>
          <div className="absolute top-6 left-6 flex gap-2">
             {!isMicOn && <MicOff className="w-4 h-4 text-red-500 fill-red-500/20" />}
          </div>
          {/* Scanning lines effect */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
        </div>

        {/* Remote Stream (Guest - Placeholder or Real) */}
        <div className="relative group overflow-hidden border border-gray-600 bg-[#080808] transition-all duration-500">
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
            <div className="w-32 h-32 border border-white/5 p-2 bg-[#0c0c0c] relative">
              <img 
                src={`https://ui-avatars.com/api/?name=${targetName}&background=111&color=555&size=256`} 
                alt="Guest" 
                className="w-full h-full object-cover filter grayscale opacity-30"
              />
              <div className="absolute inset-[-10px] border border-white/5 animate-ping opacity-20" />
              
              {/* Gift Animation Container */}
              <AnimatePresence>
                {activeGift && (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: [0.5, 1.2, 1], opacity: 1, y: 0 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center"
                  >
                    {activeGift.type === 'Falcon' ? (
                      <div className="relative flex flex-col items-center">
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          <Bird 
                            className="w-16 h-16 text-[#FFD700] drop-shadow-[0_0_20px_#FFD700]" 
                            strokeWidth={1.5}
                          />
                        </motion.div>
                        <span className="absolute -top-12 text-[#FFD700] font-black whitespace-nowrap text-xs bg-black/80 px-3 py-1 border border-[#FFD700]/30 shadow-2xl">
                          صقر ملكي! 🦅
                        </span>
                      </div>
                    ) : (
                      <div className="relative flex flex-col items-center">
                        <span className="text-7xl animate-bounce drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]">
                          {activeGift.emoji}
                        </span>
                        <span className="mt-2 text-[#FFD700] font-black text-[10px] uppercase tracking-widest bg-black/80 px-2 py-1">
                          {activeGift.name} Received
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="text-center">
              <p className="text-gray-text text-xs uppercase tracking-[0.4em]">Establishing Secure Node...</p>
              <div className="flex gap-1 justify-center mt-3">
                {[0,1,2].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 bg-gold rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/50 px-2 text-xs py-1 text-off-white font-medium" dir="rtl">
            الضيف
          </div>
        </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-10 py-6 bg-royal-black/80 border border-neon-gold/20 backdrop-blur-2xl z-30 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMic}
            className={`p-4 rounded-none border transition-all ${isMicOn ? 'border-white/10 text-off-white hover:border-neon-gold/30' : 'border-red-500/50 text-red-500 bg-red-500/10'}`}
          >
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`p-4 rounded-none border transition-all ${isVideoOn ? 'border-white/10 text-off-white hover:border-neon-gold/30' : 'border-red-500/50 text-red-500 bg-red-500/10'}`}
          >
            {isVideoOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowGifts(!showGifts)}
            className={`p-4 rounded-none border transition-all ${showGifts ? 'border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10' : 'border-white/10 text-off-white hover:border-neon-gold/30'}`}
          >
            <GiftIcon className="w-6 h-6" />
          </motion.button>

          <div className="w-px h-10 bg-white/10 mx-2" />

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-4 rounded-none border border-white/10 text-off-white hover:border-neon-gold/30 transition-all hidden md:flex"
          >
            <Monitor className="w-6 h-6" />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-4 rounded-none border border-white/10 text-off-white hover:border-neon-gold/30 transition-all"
          >
            <Expand className="w-6 h-6" />
          </motion.button>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05, backgroundColor: '#ff4444' }}
          whileTap={{ scale: 0.95 }}
          onClick={onHangUp}
          className="bg-red-600 text-white p-5 rounded-none shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center gap-3 font-black uppercase tracking-widest text-xs"
        >
          <PhoneOff className="w-6 h-6 rotate-[135deg]" />
          <span className="hidden sm:inline">Terminate Connection</span>
        </motion.button>
      </div>

      {/* Gift Selector Overlay */}
      <AnimatePresence mode="wait">
        {showGifts && (
          <GiftSelector 
            onSendGift={handleSendGift} 
            onClose={() => setShowGifts(false)}
          />
        )}
      </AnimatePresence>

      {/* Aesthetic Overlays */}
      <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20 z-10" />
      <div className="absolute top-1/2 left-0 w-32 h-px bg-gold/10 z-10" />
      <div className="absolute top-1/2 right-0 w-32 h-px bg-gold/10 z-10" />
    </div>
  );
}
