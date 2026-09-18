import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Toast container */}
      <div 
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(t => {
          const typeStyles = {
            success: 'bg-white dark:bg-[#1A211D] border-sage-500 text-[#1A201C] dark:text-[#F4EFEA]',
            danger: 'bg-white dark:bg-[#1A211D] border-red-500 text-[#1A201C] dark:text-[#F4EFEA]',
            warning: 'bg-white dark:bg-[#1A211D] border-amber-500 text-[#1A201C] dark:text-[#F4EFEA]',
            info: 'bg-white dark:bg-[#1A211D] border-charcoal-300 dark:border-charcoal-600 text-[#1A201C] dark:text-[#F4EFEA]',
          }[t.type];

          const IconComponent = {
            success: <CheckCircle2 className="w-5 h-5 text-sage-600 dark:text-sage-400 shrink-0" />,
            danger: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />,
            warning: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
            info: <Info className="w-5 h-5 text-charcoal-500 dark:text-charcoal-400 shrink-0" />,
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-medium animate-fade-in ${typeStyles}`}
            >
              {IconComponent}
              <div className="flex-1 text-sm font-medium leading-snug">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
