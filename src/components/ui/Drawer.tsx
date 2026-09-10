import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = 'right',
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: position === 'bottom' ? 'h-1/3' : 'max-w-xs',
    md: position === 'bottom' ? 'h-1/2' : 'max-w-md',
    lg: position === 'bottom' ? 'h-2/3' : 'max-w-lg',
    xl: position === 'bottom' ? 'h-3/4' : 'max-w-xl',
  };

  const getSlideAnimation = () => {
    if (position === 'left') {
      return { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } };
    }
    if (position === 'bottom') {
      return { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };
    }
    return { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };
  };

  const anim = getSlideAnimation();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div
            className={cn(
              'fixed flex pointer-events-none',
              position === 'right' ? 'inset-y-0 right-0 justify-end' : '',
              position === 'left' ? 'inset-y-0 left-0 justify-start' : '',
              position === 'bottom' ? 'inset-x-0 bottom-0 justify-end flex-col' : ''
            )}
          >
            <motion.div
              initial={anim.initial}
              animate={anim.animate}
              exit={anim.exit}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                'pointer-events-auto w-full bg-white shadow-2xl flex flex-col',
                position !== 'bottom' ? 'h-full' : '',
                sizeClasses[size]
              )}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-[#FAF6F0]/60 shrink-0">
                  <div>
                    {typeof title === 'string' ? (
                      <h3 className="font-serif text-lg font-bold text-neutral-900">{title}</h3>
                    ) : (
                      title
                    )}
                    {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
                  </div>
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="px-6 py-4 border-t border-neutral-100 bg-[#FAF6F0]/40 shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
