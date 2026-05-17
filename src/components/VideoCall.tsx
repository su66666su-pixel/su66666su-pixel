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
import { supabase } from '../supabase';

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

interface ActiveGift {
  type: string;
  emoji: string;
  name: string;
  timestamp: number;
}

interface VideoCallProps {
  onHangUp: () => void;
  targetName: string;
  targetUserId: string;
}

export default function VideoCall({ onHangUp, targetName, targetUserId }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showGifts, setShowGifts] = useState(false);
  const [activeGift, setActiveGift] = useState<ActiveGift | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
    async function setupCall() {
      try {
        // 1. Start Local Stream
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        }).catch(async (err) => {
          console.warn("Media access failed, trying fallback...", err);
          return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        });

        setStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        // 2. Initialize PeerConnection
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnectionRef.current = pc;

        mediaStream.getTracks().forEach(track => {
          pc.addTrack(track, mediaStream);
        });

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // 3. Signaling Channel
        const channelId = `call_${targetUserId}`;
        const channel = supabase.channel(channelId);
        channelRef.current = channel;

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            channel.send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: { candidate: event.candidate }
            });
          }
        };

        // 4. Listen for signaling events
        channel
          .on('broadcast', { event: 'video-offer' }, async ({ payload }) => {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({
              type: 'broadcast',
              event: 'video-answer',
              payload: { answer }
            });
          })
          .on('broadcast', { event: 'video-answer' }, async ({ payload }) => {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          })
          .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
            if (payload.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // As the initiator, create an offer
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({
                type: 'broadcast',
                event: 'video-offer',
                payload: { offer }
              });
            }
          });

      } catch (err: any) {
        console.error("Call setup error:", err);
        setErrorStatus("فشل بدء الاتصال السيادي");
      }
    }

    setupCall();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
      peerConnectionRef.current?.close();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [targetUserId]);

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
    <div className="fixed inset-0 bg-black/95 z-[150] flex flex-col justify-between p-6 font-sans select-none animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between w-full border-b border-gray-900 pb-4">
          <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[#22c55e] rounded-full shadow-[0_0_10px_#22c55e] animate-pulse" />
              <span className="text-white font-black tracking-wide" dir="rtl">اتصال مرئي سيادي مشفر</span>
          </div>
          <span className="text-[#D4AF37] text-xs font-mono bg-[#111] border border-[#D4AF37]/30 px-3 py-1 rounded-full">P2P SECURE</span>
      </div>

      {/* Video Content */}
      <div className="relative flex-1 w-full max-w-4xl mx-auto my-4 bg-[#050505] border border-gray-900 rounded-3xl overflow-hidden shadow-[0_0_5px_rgba(34,197,94,0.1)]">
          {/* Remote Video (Guest) */}
          <div className="w-full h-full bg-black relative">
            <video 
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 z-0 pointer-events-none">
               <div className="w-32 h-32 border border-white/5 p-2 bg-[#0c0c0c] relative">
                <img 
                  src={`https://ui-avatars.com/api/?name=${targetName}&background=111&color=555&size=256`} 
                  alt="Guest" 
                  className="w-full h-full object-cover filter grayscale opacity-30"
                />
                <div className="absolute inset-[-10px] border border-white/5 animate-ping opacity-20" />
              </div>
              <p className="text-gray-text text-xs uppercase tracking-[0.4em]">Establishing Secure Node...</p>
            </div>
            
            {/* Gift Animation Container */}
            <AnimatePresence>
              {activeGift && (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0, y: 50 }}
                  animate={{ scale: [0.5, 1.2, 1], opacity: 1, y: 0 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center p-20"
                >
                  <div className="relative flex flex-col items-center">
                    <span className="text-9xl animate-bounce drop-shadow-[0_0_40px_rgba(255,215,0,0.5)]">
                      {activeGift.emoji}
                    </span>
                    <span className="mt-4 text-[#FFD700] font-black text-xl uppercase tracking-widest bg-black/80 px-4 py-2 border border-gold/30">
                      {activeGift.name} Received
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Local Video (PIP) */}
          <div className="absolute bottom-4 right-4 w-40 h-56 bg-[#0a0a0a] border-2 border-[#22c55e] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.3)] z-20 group">
              {errorStatus ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080808] p-4 text-center">
                   <Shield className="w-8 h-8 text-neon-gold/20 mb-2" />
                   <p className="text-neon-gold font-bold text-[10px] uppercase">{errorStatus}</p>
                </div>
              ) : (
                <>
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className={`w-full h-full object-cover grayscale brightness-110 transition-all duration-700 ${!isVideoOn ? 'opacity-0' : 'opacity-100'}`}
                  />
                  {!isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#080808]">
                       <VideoOff className="w-8 h-8 text-gold/10" />
                    </div>
                  )}
                </>
              )}
              {/* Controls inside PIP on hover */}
              <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {!isMicOn && <MicOff className="w-3 h-3 text-red-500 fill-red-500/20" />}
              </div>
          </div>
          
          {/* Call Info Overlay */}
          <div className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-xl border border-gray-800 z-10" dir="rtl">
              <p className="text-white font-bold text-sm tracking-wide">{targetName}</p>
              <p className="text-[#22c55e] text-xs font-mono mt-0.5" dir="ltr">{formatTime(timer)}</p>
          </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center justify-center gap-6 pb-4">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border ${
              isMicOn 
                ? 'bg-[#111] border-gray-800 text-white hover:text-[#22c55e] hover:border-[#22c55e]' 
                : 'bg-red-500/10 border-red-500/50 text-red-500'
            }`}
          >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onHangUp}
            className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all duration-300 flex items-center justify-center"
          >
              <PhoneOff className="w-6 h-6 rotate-[135deg]" />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border ${
              isVideoOn 
                ? 'bg-[#111] border-gray-800 text-white hover:text-[#22c55e] hover:border-[#22c55e]' 
                : 'bg-red-500/10 border-red-500/50 text-red-500'
            }`}
          >
              {isVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowGifts(!showGifts)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border border-gray-800 ${
              showGifts ? 'bg-gold/20 border-gold/50 text-gold' : 'bg-[#111] text-gray-400 hover:text-gold'
            }`}
          >
              <GiftIcon className="w-5 h-5" />
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
    </div>
  );
}
