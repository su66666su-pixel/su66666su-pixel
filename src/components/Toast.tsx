import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Crown, Check, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'royal';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 w-full max-w-md px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0, scale: 0.9 }}
              className={`
                pointer-events-auto
                px-6 py-4 rounded-none border-2 flex items-center gap-4 shadow-2xl backdrop-blur-xl w-full
                ${toast.type === 'royal' 
                  ? 'bg-black/90 border-[#FFD700] text-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.2)]' 
                  : toast.type === 'success'
                  ? 'bg-green-950/90 border-green-500/50 text-green-400'
                  : toast.type === 'error'
                  ? 'bg-red-950/90 border-red-500/50 text-red-400'
                  : 'bg-zinc-900/90 border-zinc-700/50 text-zinc-300'
                }
              `}
            >
              <div className="flex-shrink-0">
                {toast.type === 'royal' && <Crown className="w-5 h-5" />}
                {toast.type === 'success' && <Check className="w-5 h-5" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {toast.type === 'info' && <Sparkles className="w-5 h-5" />}
              </div>
              
              <div className="flex-1" dir="rtl">
                <p className={`text-xs font-black uppercase tracking-widest leading-relaxed`}>
                  {toast.message}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
