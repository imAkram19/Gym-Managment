import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | 'full';
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'lg',
  headerActions,
  footer,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Save previous active element & handle focus trap + Escape key
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }

        // Focus trap
        if (e.key === 'Tab' && panelRef.current) {
          const focusable = panelRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      // Focus first focusable element inside drawer
      const timer = setTimeout(() => {
        if (panelRef.current) {
          const firstFocusable = panelRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      }, 50);

      // Prevent background scrolling while open
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-xl sm:max-w-2xl',
    xl: 'max-w-3xl',
    full: 'max-w-full',
  }[width];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-hidden flex justify-end"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* SlideOver Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
            transition={
              isOpen
                ? { duration: 0.28, ease: [0.32, 0.72, 0, 1] } // drawer ease
                : { duration: 0.22, ease: [0.23, 1, 0.32, 1] } // snappy ease-out
            }
            className={clsx(
              'relative z-10 w-full bg-white shadow-2xl flex flex-col h-full border-l border-slate-200/80',
              widthClasses
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="min-w-0 flex-1 pr-4">
                {typeof title === 'string' ? (
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight truncate">
                    {title}
                  </h2>
                ) : (
                  title
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {headerActions}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close panel (Escape)"
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
              {children}
            </div>

            {/* Optional Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
