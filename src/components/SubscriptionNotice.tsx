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
    if (!isOpen) return;

    const scriptId = 'paypal-sdk-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initPayPalButtons = () => {
      const paypal = (window as any).paypal;
      if (paypal && paypalContainerRef.current) {
        // Clear previous buttons if any
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
              plan_id: 'P-23V643418K057153XNIDSGBY'
            });
          },
          onApprove: (data: any, actions: any) => {
            // Retrieve plan_id from the data or assume the one we provided
            const planId = data.plan_id || 'P-23V643418K057153XNIDSGBY';
            activateTier(planId, data.subscriptionID);
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
      // Small delay to ensure the modal is fully rendered and the ref is attached
      const timer = setTimeout(initPayPalButtons, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            className="relative bg-[#0f0f0f] border-2 border-[#D4AF37] rounded-[3rem] p-10 max-w-sm w-full text-center shadow-[0_0_60px_rgba(212,175,55,0.15)] overflow-y-auto max-h-[90vh]"
            dir="rtl"
          >
            {/* Background elements */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#FFD700] opacity-10 blur-[80px]" />
            
            <button 
              onClick={onClose}
              className="absolute top-8 left-8 text-gray-600 hover:text-[#FFD700] transition-colors z-20"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6 relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-b from-[#FFD700] to-[#D4AF37] shadow-[0_0_25px_rgba(255,215,0,0.4)] mb-4 animate-pulse">
                <Gem className="text-black w-10 h-10" />
              </div>
              <h2 className="text-white text-2xl font-black tracking-tight">تفعيل البرواز الذهبي</h2>
              <p className="text-gray-500 text-xs mt-2 font-medium">اشترك الآن واحصل على كامل الصلاحيات السيادية</p>
            </div>

            <div className="bg-[#151515] rounded-[2rem] p-6 mb-6 border border-white/5 relative group">
                <div className="text-4xl font-black text-white tracking-tighter">10.00 <span className="text-xs text-gray-500 font-medium">ر.س / شهر</span></div>
                <p className="text-[10px] text-green-500 mt-2 font-black uppercase tracking-widest">تفعيل فوري للصلاحيات 🔥</p>
                <div className="absolute top-2 right-4 opacity-5">
                   <Star className="w-12 h-12 text-[#D4AF37]" />
                </div>
            </div>

            <ul className="text-right space-y-3 mb-8 px-2 text-xs text-gray-400 font-medium">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                  <span>البرواز الذهبي الملكي حول صورتك</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                  <span>مكالمات فيديو بدقة 4K فائقة</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                  <span>شارة "الملك" الذهبية الموثقة</span>
                </li>
            </ul>

            <div id="paypal-button-container" ref={paypalContainerRef} className="my-6 min-h-[150px] relative z-10" />

            <p className="mt-8 text-[9px] text-gray-600 italic leading-relaxed">
              سيتم تفعيل مميزاتك فور تأكيد الاشتراك من PayPal
              <br />
              Secure Payment Processed by PayPal & SNNS Encryption
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
