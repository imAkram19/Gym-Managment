import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { AlertTriangle, AlertCircle, Info, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

/**
 * ConfirmDialog — Replaces window.confirm() and alert()
 * Accessible, keyboard-trapped, beautiful double-bezel styled confirmation modal.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      // Focus cancel button by default to prevent accidental destructive submission
      const timer = setTimeout(() => {
        if (variant === 'danger') {
          cancelBtnRef.current?.focus();
        } else {
          confirmBtnRef.current?.focus();
        }
      }, 60);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }
  }, [isOpen, isLoading, variant, onClose]);

  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-red-600" />,
    warning: <AlertCircle className="w-6 h-6 text-amber-600" />,
    primary: <Info className="w-6 h-6 text-blue-600" />,
  };

  const iconBg = {
    danger: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    primary: 'bg-blue-50 border-blue-200',
  };

  const confirmBtnStyles = {
    danger:
      'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500 shadow-sm shadow-red-500/20',
    warning:
      'bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500 shadow-sm shadow-amber-500/20',
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-500 shadow-sm shadow-blue-500/20',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{
              opacity: 0,
              scale: shouldReduceMotion ? 1 : 0.96,
              y: shouldReduceMotion ? 0 : 8,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: shouldReduceMotion ? 1 : 0.96,
              y: shouldReduceMotion ? 0 : 8,
            }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-10 w-full max-w-md p-px rounded-2xl bg-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="bg-white rounded-[15px] p-6 space-y-5">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    'p-2.5 rounded-xl border flex-shrink-0 flex items-center justify-center',
                    iconBg[variant]
                  )}
                >
                  {icons[variant]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    id="confirm-dialog-title"
                    className="text-base font-bold text-slate-900 tracking-tight"
                  >
                    {title}
                  </h3>
                  <div
                    id="confirm-dialog-desc"
                    className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-line"
                  >
                    {description}
                  </div>
                </div>
                {!isLoading && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  ref={cancelBtnRef}
                  type="button"
                  disabled={isLoading}
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  {cancelLabel}
                </button>
                <button
                  ref={confirmBtnRef}
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    await onConfirm();
                  }}
                  className={clsx(
                    'px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2',
                    confirmBtnStyles[variant]
                  )}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{confirmLabel}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
