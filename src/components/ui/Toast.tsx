import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeToast, ToastMessage } from '../../store/slices/uiSlice';
import { cn } from '../../utils/cn';

export const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#7B2435] shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
  };

  const bgMap = {
    success: 'bg-white border-emerald-200 shadow-lg shadow-emerald-900/5',
    error: 'bg-white border-rose-200 shadow-lg shadow-rose-900/5',
    info: 'bg-white border-[#EADBDA] shadow-lg shadow-[#7B2435]/5',
    warning: 'bg-white border-amber-200 shadow-lg shadow-amber-900/5',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.92, transition: { duration: 0.35, ease: 'easeInOut' } }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-2xl border shadow-lg max-w-md w-full pointer-events-auto transition-all',
        bgMap[toast.type]
      )}
    >
      {iconMap[toast.type]}
      <div className="flex-1 text-xs">
        {toast.title && <h4 className="font-bold text-neutral-900 mb-0.5">{toast.title}</h4>}
        <p className="text-neutral-700 leading-relaxed font-medium">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-neutral-400 hover:text-neutral-700 p-1 -mr-1 rounded-full cursor-pointer transition-colors"
        aria-label="Dismiss toast notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={(id) => dispatch(removeToast(id))}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
