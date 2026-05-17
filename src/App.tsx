import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, ShieldCheck, Stars, Shield, Trees, Sword, Mail, Bolt, Loader2 } from 'lucide-react';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import ChatList from './components/ChatList';
import AdminDashboard from './components/AdminDashboard';
import { useToast } from './components/Toast';
import { supabase } from './supabase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'user' | 'admin'>('user');
  const { showToast } = useToast();

  useEffect(() => {
    document.title = "SNNS PRO - SNNS";
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        checkAdminRole(user.uid);
      } else {
        setIsAdmin(false);
        setView('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkAdminRole = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', uid)
        .single();
      
      if (data && (data.role === 'admin' || data.role === 'owner')) {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error("Error checking admin role:", err);
    }
  };

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
        setEmailSent(true);
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
        <>
          {isAdmin && (
            <div className="fixed bottom-6 left-6 z-[200] flex gap-2">
               <button 
                onClick={() => setView(view === 'user' ? 'admin' : 'user')}
                className={`px-6 py-3 rounded-2xl font-black text-xs transition-all shadow-2xl flex items-center gap-3 border ${
                  view === 'user' 
                  ? 'bg-black text-[#22c55e] border-[#22c55e]/30' 
                  : 'bg-black text-[#D4AF37] border-[#D4AF37]/30'
                }`}
               >
                 {view === 'user' ? (
                   <>
                     <ShieldCheck className="w-4 h-4" />
                     <span>دخول لوحة الإدارة السيادية</span>
                   </>
                 ) : (
                   <>
                     <Bolt className="w-4 h-4" />
                     <span>العودة للواجهة الملكية</span>
                   </>
                 )}
               </button>
            </div>
          )}
          {view === 'admin' && isAdmin ? (
             <AdminDashboard />
          ) : (
             <ChatList user={user} onLogout={handleLogout} />
          )}
        </>
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
      <header className="z-20 px-6 sm:px-12 py-6 flex justify-between items-center bg-[#050505] border-b border-gray-900">
        <div className="flex items-center gap-3">
            <div className="w-12 h-10 border-2 border-[#D4AF37] rounded-xl flex items-center justify-center p-1 bg-black shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <div className="flex flex-col items-center justify-center">
                    <Trees className="w-5 h-5 text-[#22c55e]" />
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-white text-lg font-black tracking-tighter">SNNS <span className="text-[#22c55e]">PRO</span></span>
                <span className="text-gray-500 text-[10px] -mt-1 font-bold">شبكة العقدة السيادية • المملكة العربية السعودية</span>
            </div>
        </div>
        <nav className="hidden md:flex gap-8 items-center">
            <a href="#" className="text-gray-400 text-[10px] uppercase font-black tracking-widest hover:text-white transition-all">الأمان</a>
            <a href="#" className="text-gray-400 text-[10px] uppercase font-black tracking-widest hover:text-white transition-all">الهيكلية</a>
            <a href="#" className="text-gray-400 text-[10px] uppercase font-black tracking-widest hover:text-white transition-all">الدعم</a>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center py-16 px-6 lg:px-20">
        <div className="w-full max-w-6xl flex flex-col md:flex-row items-center gap-16 lg:gap-24">
            
            {/* Value Proposition Text */}
            <div className="text-right flex-1 order-2 md:order-1" dir="rtl">
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-4xl md:text-5xl lg:text-7xl font-black text-white leading-tight"
                >
                    ارتقِ بخصوصيتك إلى <br /> مستويات <span className="text-gold-sovereign">ملكية</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-400 text-sm md:text-base mt-8 leading-relaxed max-w-xl"
                >
                    مرحباً بك في عالم التواصل السيادي. <br />
                    SNNS PRO توفر لك بيئة مشفرة بالكامل، مستضافة وطنياً، لا تقبل المساومة على أمان بياناتك.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-12 flex items-center gap-4 justify-end opacity-40"
                >
                    <div className="h-[1px] w-12 bg-gray-800"></div>
                    <span className="text-[10px] font-mono tracking-[0.2em]">ENCRYPTED_SOVEREIGN_NODE_v4</span>
                </motion.div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-sm flex-1 order-1 md:order-2">
                <AnimatePresence mode="wait">
                  {!user && !emailSent && (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -20 }}
                      className="bg-[#050505] border border-gray-900 rounded-[32px] p-8 lg:p-10 shadow-[0_0_50px_rgba(34,197,94,0.08)] text-right font-cairo select-none relative overflow-hidden"
                    >
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#22c55e]/10 rounded-full blur-3xl"></div>
                      
                      <div className="flex flex-col items-center mb-8 relative z-10">
                          <div className="w-16 h-14 flex items-center justify-center bg-black border-2 border-[#22c55e] rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)] mb-4 transition-transform hover:scale-110">
                              <span className="text-white font-black text-2xl font-mono tracking-tighter">SA</span>
                          </div>
                          <h2 className="text-white text-xl font-black mb-1">بوابة الدخول السيادية</h2>
                          <p className="text-gray-500 text-xs text-center leading-relaxed">سجل دخولك لتفعيل الرادار وبدء البث المشفر</p>
                      </div>

                      <form onSubmit={handleEmailLogin} className="space-y-5 relative z-10">
                          <div>
                              <label className="block text-gray-400 text-xs font-bold mb-2.5 pr-1 uppercase tracking-widest">البريد الإلكتروني المشفر</label>
                              <div className="relative">
                                  <input 
                                    type="email" 
                                    id="loginEmail" 
                                    required 
                                    placeholder="name@snns.shop" 
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className="w-full bg-black border border-gray-900 rounded-2xl px-5 py-4 pl-12 text-white text-sm font-mono focus:border-[#22c55e] focus:shadow-[0_0_20px_rgba(34,197,94,0.15)] focus:outline-none transition-all duration-300 placeholder-gray-800 text-left"
                                    dir="ltr"
                                  />
                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 w-5 h-5" />
                              </div>
                          </div>

                          <button 
                            type="submit" 
                            disabled={isLoggingIn}
                            className="w-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] text-black font-black text-sm py-4 rounded-2xl shadow-[0_5px_20px_rgba(34,197,94,0.25)] hover:shadow-[0_5px_30px_#22c55e] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {isLoggingIn ? (
                                <>
                                  <span>جاري التحقق الملكي...</span>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                </>
                              ) : (
                                <>
                                  <span>طلب رمز الدخول الفوري ⚡</span>
                                </>
                              )}
                          </button>
                      </form>

                      <div className="flex items-center my-7 gap-3 relative z-10 px-4">
                          <div className="flex-1 h-[1px] bg-gray-900"></div>
                          <span className="text-gray-700 text-[10px] font-black uppercase tracking-widest">أو</span>
                          <div className="flex-1 h-[1px] bg-gray-900"></div>
                      </div>

                      <button 
                        onClick={handleGoogleLogin} 
                        className="w-full bg-black border border-gray-900 rounded-2xl py-4 px-6 flex items-center justify-center gap-4 text-gray-500 hover:text-white hover:border-gray-700 hover:bg-[#080808] transition-all duration-300 group relative z-10"
                      >
                          <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                          <span className="text-xs font-black tracking-tight">متابعة بواسطة حساب Google</span>
                      </button>
                    </motion.div>
                  )}

                  {emailSent && (
                    <motion.div
                      key="email-sent"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full max-w-sm bg-[#050505] border border-[#1a1a1a] rounded-[32px] p-10 shadow-[0_10px_50px_rgba(34,197,94,0.05)] text-right font-cairo select-none"
                    >
                      <div className="flex flex-col items-center mb-6 text-center">
                        <div className="w-[60px] h-[55px] flex items-center justify-center bg-black border-2 border-[#22c55e] rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)] mb-8">
                          <span className="text-white font-mono font-black text-2xl tracking-tighter">SA</span>
                        </div>
                        
                        <h1 className="text-white text-xl font-black mb-2.5">رابط التحقق السيادي</h1>
                        <p className="text-gray-500 text-[13px] leading-[1.8] mb-8">
                          لقد أرسلنا رابط الدخول إلى بريدك الإلكتروني <br />
                          <b className="text-white font-mono">{loginEmail}</b> <br />
                          يرجى مراجعة بريدك والضغط على الرابط لتفعيل وصولك.
                        </p>

                        <div className="w-full space-y-4">
                          <div className="p-4 bg-[#22c55e]/5 border border-[#22c55e]/10 rounded-2xl flex items-center justify-center gap-3 text-[#22c55e]">
                            <Bolt className="w-4 h-4 animate-pulse" />
                            <span className="text-[10px] font-black font-mono tracking-widest">AWAITING SOVEREIGN AUTH</span>
                          </div>

                          <button 
                            onClick={() => setEmailSent(false)}
                            className="w-full py-4 text-gray-600 text-[10px] uppercase font-black tracking-[0.2em] hover:text-gray-400 transition-colors"
                          >
                            Back to Login
                          </button>
                        </div>

                        <div className="mt-10 text-white/5 text-[9px] uppercase tracking-[2px] font-bold">
                          شبكة العقدة السيادية • المملكة العربية السعودية
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
        </div>
      </main>

      <footer className="z-20 px-12 py-8 bg-[#050505] border-t border-gray-900 text-center">
        <p className="text-gray-800 text-[10px] tracking-[0.4em] uppercase font-black">
            © 2024 شبكة العقدة السيادية • جميع الحقوق محفوظة
        </p>
      </footer>
        </div>
      )}
    </>
  );
}
