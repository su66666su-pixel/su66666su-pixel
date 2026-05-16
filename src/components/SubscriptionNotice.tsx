import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, X, Check, Star, Gem } from 'lucide-react';
import { supabase } from '../supabase';
import confetti from 'canvas-confetti';

interface SubscriptionNoticeProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionNotice({ user, isOpen, onClose }: SubscriptionNoticeProps) {
  const paypalContainerRef = React.useRef<HTMLDivElement>(null);
  const [selectedTier, setSelectedTier] = React.useState<string | null>(null);

  const launchRoyalFireworks = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#FFD700', '#D4AF37', '#FFFFFF'] });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#FFD700', '#D4AF37', '#FFFFFF'] });
    }, 250);
  };

  const TIERS = [
    {
      id: 'P-BRONZE',
      name: 'الملك البرونزي',
      price: '10',
      emoji: '🥉',
      color: '#D4AF37',
      features: ['البرواز الذهبي الأساسي', 'شارة التاج البرونزي', 'مكالمات فيديو HD'],
    },
    {
      id: 'P-23V643418K057153XNIDSGBY',
      name: 'الملك الذهبي',
      price: '99',
      emoji: '👑',
      color: '#FFD700',
      isPremium: true,
      features: ['الاسم المتوهج بالنيون', '5000 نقطة هدايا شهرياً', 'أولوية قصوى في الخريطة', 'سحب أرباح بدون عمولة'],
    },
    {
      id: 'P-SILVER',
      name: 'الملك الفضي',
      price: '35',
      emoji: '🥈',
      color: '#C0C0C0',
      features: ['برواز نيوني متحرك', 'معرفة زوار البروفايل', '1000 نقطة هدايا'],
    },
  ];

  const activateTier = async (planId: string, subscriptionID: string) => {
    let tierName = "ذهبي";
    if (planId === 'P-BRONZE') tierName = "برونزي";
    if (planId === 'P-SILVER') tierName = "فضي";
    if (planId === 'P-GOLD' || planId === 'P-23V643418K057153XNIDSGBY') tierName = "ذهبي";

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_premium: true,
          subscription_tier: tierName,
          subscription_id: subscriptionID,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.uid);

      if (error) throw error;
      
      launchRoyalFireworks();
      alert(`تهانينا! تم تفعيل رتبة الـ ${tierName} والبرواز الذهبي بنجاح! 👑💎`);
      
      setTimeout(() => {
        onClose();
        window.location.reload(); 
      }, 5000);
    } catch (err) {
      console.error("Failed to activate tier:", err);
      alert("حدث خطأ أثناء تفعيل الرتبة. يرجى مراسلة الدعم الفني.");
    }
  };

  React.useEffect(() => {
    if (!isOpen || !selectedTier) return;

    const scriptId = 'paypal-sdk-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initPayPalButtons = () => {
      const paypal = (window as any).paypal;
      if (paypal && paypalContainerRef.current) {
        paypalContainerRef.current.innerHTML = '';
        
        paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe'
          },
          createSubscription: (data: any, actions: any) => {
            return actions.subscription.create({
              plan_id: selectedTier
            });
          },
          onApprove: (data: any, actions: any) => {
            activateTier(selectedTier, data.subscriptionID);
          },
          onError: (err: any) => {
            console.error('PayPal Error:', err);
          }
        }).render(paypalContainerRef.current);
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://www.paypal.com/sdk/js?client-id=BAAglZKZcUuERJm33KKXC8K1KrUco40riEzuyiU_3m3wbvIRRbz1UN3yfvKdN4eMWMD4uiIhKgQsQqU4Uc&vault=true&intent=subscription";
      script.setAttribute('data-sdk-integration-source', 'button-factory');
      script.async = true;
      script.onload = initPayPalButtons;
      document.head.appendChild(script);
    } else {
      const timer = setTimeout(initPayPalButtons, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedTier]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto bg-black/95 backdrop-blur-xl">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            className="relative bg-[#050505] p-8 md:p-12 max-w-6xl w-full rounded-[3rem] shadow-[0_0_100px_rgba(255,215,0,0.1)] min-h-[80vh] flex flex-col"
            dir="rtl"
          >
            <button 
              onClick={onClose}
              className="absolute top-8 left-8 text-gray-500 hover:text-[#FFD700] transition-colors z-20"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-black text-[#FFD700] mb-4">اختر رتبتك في نظام السيادة</h1>
              <p className="text-gray-500 font-medium">انضم إلى طبقة الملوك واستمتع بمميزات لا محدودة</p>
            </div>

            {!selectedTier ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
                {TIERS.map((tier) => (
                  <motion.div
                    key={tier.id}
                    whileHover={{ y: -10 }}
                    className={`bg-[#0f0f0f] p-8 rounded-[2.5rem] flex flex-col transition-all cursor-pointer relative ${tier.isPremium ? 'border-2 border-[#FFD700] scale-105 shadow-[0_0_50px_rgba(255,215,0,0.15)]' : 'border border-gray-800 hover:border-[#D4AF37]'}`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    {tier.isPremium && (
                      <div className="absolute -top-4 right-1/2 translate-x-1/2 bg-[#FFD700] text-black text-[10px] px-4 py-1 rounded-full font-black uppercase tracking-widest">
                        الأكثر فخامة
                      </div>
                    )}
                    <div className="text-4xl mb-6">{tier.emoji}</div>
                    <h3 className={`text-2xl font-bold mb-2 ${tier.isPremium ? 'text-[#FFD700]' : 'text-white'}`}>{tier.name}</h3>
                    <div className="text-4xl font-black text-white mb-8">
                      {tier.price} <span className="text-xs text-gray-500 font-medium">ر.س / شهر</span>
                    </div>
                    
                    <ul className="space-y-4 mb-10 flex-1 text-sm text-gray-400">
                      {tier.features.map((feature, idx) => (
                        <li key={`${tier.id}-feature-${idx}`} className="flex items-center gap-3">
                          <Check className={`w-4 h-4 ${tier.isPremium ? 'text-[#FFD700]' : 'text-[#D4AF37]'}`} />
                          <span className={tier.isPremium ? 'text-gray-200 font-medium' : ''}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest transition-all ${tier.isPremium ? 'bg-[#FFD700] text-black shadow-[0_0_20px_#FFD700]' : 'bg-gray-800 text-white hover:bg-[#D4AF37] hover:text-black'}`}>
                      {tier.isPremium ? 'امتلاك السيادة' : 'اشتراك'}
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                <button 
                  onClick={() => setSelectedTier(null)}
                  className="mb-8 text-gray-500 hover:text-white flex items-center gap-2 text-sm font-bold"
                >
                  <X className="w-4 h-4" /> العودة للرتب
                </button>
                
                <div className="w-full bg-[#0f0f0f] border-2 border-[#FFD700] rounded-[3rem] p-10 text-center shadow-[0_0_50px_rgba(255,215,0,0.15)]">
                  <div className="mb-6">
                    <Gem className="w-12 h-12 text-[#FFD700] mx-auto animate-pulse mb-4" />
                    <h2 className="text-white text-2xl font-bold">تأكيد الاشتراك</h2>
                    <p className="text-gray-500 text-xs mt-2">أنت بصدد تفعيل رتبة {TIERS.find(t => t.id === selectedTier)?.name}</p>
                  </div>

                  <div ref={paypalContainerRef} className="my-6 min-h-[150px]" />

                  <p className="text-[10px] text-gray-600 mt-4 italic">
                    سيتم تفعيل مميزاتك فور تأكيد الاشتراك من PayPal
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
