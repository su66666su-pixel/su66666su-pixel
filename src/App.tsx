import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, ShieldCheck, Stars, Shield, Trees, Sword } from 'lucide-react';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import ChatList from './components/ChatList';
import { ToastProvider } from './components/Toast';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Error logging in:", error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark-bg overflow-hidden relative">
        {/* Background Decorative Glow */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle_at_center,_var(--color-gold)_0%,_transparent_70%)] blur-[100px]"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            {/* Outer Rotating Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-40px] border border-gold/10 rounded-full"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-60px] border border-gold/5 rounded-full"
            />

            {/* Central Animated Crown */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1], 
                rotate: [0, 5, -5, 0],
                filter: ["drop-shadow(0 0 10px rgba(212,175,55,0.4))", "drop-shadow(0 0 30px rgba(212,175,55,0.6))", "drop-shadow(0 0 10px rgba(212,175,55,0.4))"]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="bg-black/40 p-10 rounded-full border border-gold/20 backdrop-blur-sm"
            >
              <Crown className="w-16 h-16 text-gold" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <h2 className="text-gold font-light tracking-[0.5em] text-[10px] uppercase mb-2">Initializing Sovereignty</h2>
            <div className="flex items-center justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`dot-${i}`}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1 h-1 bg-gold rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      {user ? (
        <ChatList user={user} onLogout={handleLogout} />
      ) : (
        <div className="relative min-h-screen bg-dark-bg text-off-white font-sans selection:bg-gold selection:text-black overflow-hidden flex flex-col">
          {/* Background Decor */}
          <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(circle_at_center,_var(--color-gold)_0%,_transparent_70%)] opacity-30 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,_#1A1A1A_0%,_transparent_70%)] blur-[120px]"></div>
            <div className="absolute inset-0 bg-dot-pattern"></div>
          </div>

      {/* Side Decoration Vertical Text */}
      <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 rotate-180 items-center space-x-4 opacity-30 z-10" style={{ writingMode: 'vertical-rl' }}>
        <span className="text-[10px] uppercase tracking-[0.5em] text-gold font-black">Digital Sovereignty Reserved</span>
        <div className="h-24 w-[1px] bg-gold"></div>
      </div>

      {/* Top Navigation */}
      <nav className="z-20 px-12 py-8 flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-4 select-none group cursor-default">
            <div className="relative w-14 h-14 flex items-center justify-center bg-[#050505] border-2 border-gold rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all duration-500 group-hover:scale-105">
                <div className="flex flex-col items-center justify-center">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-[#22c55e] drop-shadow-[0_0_8px_#22c55e]"
                    >
                      <Trees className="w-6 h-6 mb-0.5" />
                    </motion.div>
                    <div className="flex gap-1 -mt-1 text-gold">
                        <Sword className="w-3 h-3 rotate-45" />
                        <Sword className="w-3 h-3 -rotate-45" />
                    </div>
                </div>
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#22c55e] rounded-full shadow-[0_0_8px_#22c55e]"></div>
            </div>
            
            <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                    <span className="text-white font-black text-2xl tracking-wider">SNNS</span>
                    <span className="px-2 py-0.5 bg-gradient-to-r from-[#22c55e] to-[#4ade80] text-black text-[10px] font-black rounded-md uppercase tracking-widest shadow-[0_3px_10px_rgba(34,197,94,0.3)]">PRO</span>
                </div>
                <span className="text-gray-500 text-[9px] uppercase tracking-widest font-bold mt-0.5">شبكة العقدة السيادية ● المملكة العربية السعودية</span>
            </div>
        </div>
        <div className="hidden md:flex text-[10px] uppercase tracking-[0.2em] text-gray-text space-x-12">
          <span className="hover:text-gold cursor-pointer transition-colors duration-300">Security</span>
          <span className="hover:text-gold cursor-pointer transition-colors duration-300">Architecture</span>
          <span className="hover:text-gold cursor-pointer transition-colors duration-300">Support</span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center z-10 px-6 py-12">
        <AnimatePresence mode="wait">
          {!user && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center max-w-md w-full"
            >
              {/* Sovereign Crown Icon */}
              <div className="mb-12 flex justify-center">
                <motion.div 
                  className="relative"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  <div className="w-28 h-28 border-2 border-gold/20 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(212,175,55,0.05)] bg-[#050505] relative overflow-hidden">
                    <Crown className="w-12 h-12 text-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
                    <motion.div
                      className="absolute inset-0 border border-gold/30 rounded-full"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-dark-bg px-4 py-1 border border-gold/40 rounded-full whitespace-nowrap">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gold">Identity</p>
                  </div>
                </motion.div>
              </div>

              <motion.h1 
                className="text-5xl md:text-6xl font-light mb-8 text-center tracking-tight leading-tight font-serif italic text-gold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
              >
                Unlock the <span className="text-white not-italic font-sans font-bold uppercase tracking-[0.1em] text-4xl">Sovereign</span> Tier
              </motion.h1>

              <motion.p 
                className="text-gray-text text-lg mb-12 text-center font-light leading-relaxed max-w-[380px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                مرحباً بك في عالم التواصل السيادي. ارتقِ بخصوصيتك إلى مستويات ملكية لا تقبل المساومة.
              </motion.p>

              <motion.div
                className="w-full space-y-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <button 
                  onClick={handleGoogleLogin}
                  className="group relative w-full h-16 flex items-center justify-center space-x-4 bg-transparent border-2 border-gold text-gold font-bold tracking-[0.2em] text-sm uppercase rounded-none transition-all duration-500 hover:bg-gold hover:text-dark-bg active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    className="w-5 h-5 group-hover:brightness-0 group-hover:invert-0 transition-all" 
                  />
                  <span>الدخول عبر جوجل</span>
                </button>

                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-[#333]">
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                  <span className="px-6 flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Encrypted Access Only
                  </span>
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Details */}
      <footer className="z-20 px-12 py-8 flex justify-between items-end border-t border-white/5 bg-transparent">
        <div className="space-y-3">
          <p className="text-[10px] text-gray-text uppercase tracking-widest font-black">Status</p>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)] animate-pulse"></div>
            <p className="text-[10px] font-mono text-off-white tracking-widest">SECURE_NODE_ALPHA_01 // ACTIVE</p>
          </div>
        </div>
        
        <div className="hidden sm:flex space-x-16">
          <div className="text-right space-y-1">
            <p className="text-[10px] text-gray-text uppercase tracking-widest font-black">Architecture</p>
            <p className="text-[10px] font-mono tracking-tighter uppercase">Hybrid_Cloud_v4</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] text-gray-text uppercase tracking-widest font-black">Protocol</p>
            <p className="text-[10px] font-mono tracking-tighter uppercase">E2EE-MARQUE-ROYAL</p>
          </div>
        </div>
      </footer>
        </div>
      )}
    </ToastProvider>
  );
}
