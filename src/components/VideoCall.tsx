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
    <div className="fixed inset-0 bg-[#020202]/95 z-[250] flex items-center justify-center p-4 font-cairo select-none overflow-hidden backdrop-blur-md">
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl bg-[#050505] border border-gray-900 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(34,197,94,0.1)] relative flex flex-col h-[600px]"
      >
        {/* Header */}
        <div className="p-5 bg-black/60 border-b border-gray-900/50 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-[#22c55e] rounded-full shadow-[0_0_12px_#22c55e] animate-pulse"></span>
                <span className="text-white font-black text-xs tracking-[0.2em] uppercase">SECURE LIVE CALL</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#22c55e] text-[10px] font-mono bg-[#22c55e]/5 px-3 py-1 border border-[#22c55e]/20 rounded-lg font-black tracking-widest hidden sm:block">
                {formatTime(timer)} ● LIVE
              </span>
              <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/5 px-3 py-1 border border-[#D4AF37]/20 rounded-lg font-black font-mono tracking-widest">
                E2EE VIA SNNS-TURN
              </span>
            </div>
        </div>

        {/* Video Stage */}
        <div className="flex-grow bg-[#010101] relative p-6 flex gap-4 items-center justify-center overflow-hidden">
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#22c55e 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

            {/* Remote Video Container */}
            <div className="w-full h-full bg-[#070707] border border-gray-900 rounded-3xl relative overflow-hidden flex items-center justify-center group shadow-inner">
                {errorStatus ? (
                  <div className="flex flex-col items-center gap-4 text-center p-10">
                    <Shield className="w-16 h-16 text-red-500/20" />
                    <p className="text-red-500 font-black text-sm uppercase tracking-widest">{errorStatus}</p>
                  </div>
                ) : (
                  <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover bg-black"
                  />
                )}
                
                <div className="absolute bottom-6 right-6 bg-black/80 border border-gray-800/50 px-4 py-2 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-xl transition-transform group-hover:scale-105" dir="rtl">
                    <span className="text-white text-xs font-black tracking-tight">{targetName}</span>
                    <div className="w-1.5 h-1.5 bg-[#22c55e] rounded-full shadow-[0_0_8px_#22c55e]"></div>
                </div>

                {/* Gift Overlay */}
                <AnimatePresence>
                  {activeGift && (
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0, y: 50 }}
                      animate={{ scale: [0.5, 1.2, 1], opacity: 1, y: 0 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="absolute inset-0 z-50 flex items-center justify-center p-10 pointer-events-none"
                    >
                      <div className="relative flex flex-col items-center">
                        <span className="text-9xl animate-bounce drop-shadow-[0_0_50px_rgba(255,215,0,0.4)]">
                          {activeGift.emoji}
                        </span>
                        <motion.span 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 text-[#FFD700] font-black text-xl uppercase tracking-[0.3em] bg-black/90 px-6 py-3 border border-gold/30 rounded-xl shadow-2xl backdrop-blur-xl"
                        >
                          {activeGift.name} Received
                        </motion.span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            {/* Local Video Container (PIP) */}
            <motion.div 
              drag
              dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
              className="absolute top-10 left-10 w-44 h-60 bg-[#0a0a0a] border-2 border-[#22c55e]/30 rounded-3xl overflow-hidden shadow-2xl z-40 group cursor-move hover:border-[#22c55e]/60 transition-all duration-300"
            >
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover bg-black scale-x-[-1] transition-opacity duration-500 ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
                    <VideoOff className="w-8 h-8 text-white/5" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-xl text-[10px] text-gray-300 font-black backdrop-blur-md border border-white/5">أنت (المستكشف)</div>
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                   {!isMicOn && <MicOff className="w-4 h-4 text-red-500 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]" />}
                </div>
            </motion.div>

        </div>

        {/* Controls Footer */}
        <div className="p-8 bg-black/80 border-t border-gray-900 flex items-center justify-center gap-6 relative backdrop-blur-md">
            
            <button 
                onClick={toggleMic}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-lg group ${
                  isMicOn 
                  ? 'bg-[#090909] border-gray-800 text-gray-400 hover:text-[#22c55e] hover:border-[#22c55e]/40' 
                  : 'bg-red-500/10 border-red-500/40 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
                }`}
            >
                {isMicOn ? <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button 
                onClick={onHangUp}
                className="px-10 h-14 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-xs shadow-[0_8px_30px_rgba(220,38,38,0.3)] hover:shadow-[0_8px_40px_#dc2626] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 group"
            >
                <PhoneOff className="w-5 h-5 rotate-[135deg] group-hover:animate-bounce" /> 
                <span dir="rtl">إنهاء الاتصال الآمن</span>
            </button>

            <button 
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-lg group ${
                  isVideoOn 
                  ? 'bg-[#090909] border-gray-800 text-gray-400 hover:text-[#22c55e] hover:border-[#22c55e]/40' 
                  : 'bg-red-500/10 border-red-500/40 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
                }`}
            >
                {isVideoOn ? <VideoIcon className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => setShowGifts(!showGifts)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-lg group ${
                showGifts 
                ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]' 
                : 'bg-[#090909] border-gray-800 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/40'
              }`}
            >
                <GiftIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>

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

      </motion.div>
    </div>
  );

}
