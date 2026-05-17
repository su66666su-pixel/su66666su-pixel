import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, ShieldCheck, Stars, Shield, Trees, Sword, Mail, Bolt, Loader2 } from 'lucide-react';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import ChatList from './components/ChatList';
import { useToast } from './components/Toast';
import { supabase } from './supabase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [loginEmail, setLoginEmail] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;

    try {
      setIsLoggingIn(true);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) {
        console.error("❌ فشل إرسال رابط الدخول:", error.message);
        showToast("فشل إرسال الرابط، تحقق من صحة البريد الإلكتروني.", 'error');
      } else {
        console.log("🚀 تم قذف الرابط الأمني إلى البريد بنجاح!");
        showToast("👑 تم إرسال رابط الدخول المشفر لبريدك! افحص الوارد الآن.", 'success');
        setLoginEmail('');
      }
    } catch (err: any) {
      console.error("Login logic failed", err);
      showToast("حدث خطأ تقني في بوابة الدخول", 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

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
    <>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#050505] border border-gray-900 rounded-3xl p-8 shadow-[0_0_30px_rgba(34,197,94,0.05)] text-right font-cairo select-none"
            >
              <div className="flex flex-col items-center mb-6 text-center">
                  <div className="w-16 h-14 flex items-center justify-center bg-black border-2 border-[#22c55e] rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.25)] mb-4">
                      <span className="text-white font-black text-2xl font-mono tracking-tighter">SA</span>
                  </div>
                  <h2 className="text-white text-xl font-black">بوابة الدخول السيادية</h2>
                  <p className="text-gray-500 text-xs mt-1">سجل دخولك لتفعيل الرادار وبدء البث المشفر</p>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                      <label className="block text-gray-400 text-xs font-bold mb-2 pr-1">البريد الإلكتروني المشفر</label>
                      <div className="relative">
                          <input 
                            type="email" 
                            required 
                            placeholder="name@snns.shop" 
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full bg-black border border-gray-900 rounded-xl px-4 py-3 pl-10 text-white text-sm font-mono focus:border-[#22c55e] focus:outline-none transition-all duration-300 placeholder-gray-700 text-left"
                            dir="ltr"
                          />
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-4 h-4" />
                      </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoggingIn}
                    className="w-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] text-black font-black text-sm py-3.5 rounded-xl shadow-[0_4px_20px_rgba(34,197,94,0.2)] hover:shadow-[0_4px_30px_#22c55e] hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isLoggingIn ? (
                        <>
                          <span>جاري تأمين الرابط...</span>
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <span>طلب رمز الدخول الفوري</span>
                          <Bolt className="w-4 h-4" />
                        </>
                      )}
                  </button>
              </form>

              <div className="flex items-center my-6 gap-3">
                  <div className="flex-1 h-[1px] bg-gray-900"></div>
                  <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">أو الدخول السريع</span>
                  <div className="flex-1 h-[1px] bg-gray-900"></div>
              </div>

              <button 
                onClick={handleGoogleLogin} 
                className="w-full bg-black border border-gray-900 rounded-xl py-3 px-4 flex items-center justify-center gap-3 text-gray-300 hover:text-white hover:border-gray-800 transition-all duration-300"
              >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span className="text-xs font-bold text-right">متابعة بواسطة حساب Google</span>
              </button>
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
    </>
  );
}
