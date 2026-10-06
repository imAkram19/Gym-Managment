import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTime12h } from '../../lib/formatters';

export type CheckInFeedbackData =
  | {
      type: 'success';
      memberId: string;
      memberName: string;
      planName?: string;
      time: string;
    }
  | {
      type: 'denied';
      memberId?: string;
      memberName: string;
      reason: string;
      time: string;
    }
  | null;

interface CheckInFeedbackProps {
  data: CheckInFeedbackData;
  onDismiss: () => void;
  autoDismissMs?: number;
}

/**
 * CheckInFeedback — Full-screen/banner biometric verification feedback
 * Green scan pulse animation for access granted; red shake with renewal CTA for denied.
 */
export const CheckInFeedback: React.FC<CheckInFeedbackProps> = ({
  data,
  onDismiss,
  autoDismissMs = 4000,
}) => {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [data, autoDismissMs, onDismiss]);

  if (!data) return null;

  const isSuccess = data.type === 'success';

  return (
    <AnimatePresence>
      <div
        role="alert"
        aria-live="assertive"
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none"
      >
        <motion.div
          initial={{ opacity: 0, y: -24, scale: shouldReduceMotion ? 1 : 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: shouldReduceMotion ? 1 : 0.95 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="pointer-events-auto rounded-2xl shadow-2xl overflow-hidden border p-px"
          style={{
            borderColor: isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            background: isSuccess
              ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
          }}
        >
          <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-[15px] flex items-start gap-4">
            {/* Visual Icon with Scan Animation */}
            <div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
              {isSuccess ? (
                <>
                  <span
                    className="absolute w-10 h-10 rounded-full bg-emerald-400 opacity-60 scan-pulse-ring"
                    aria-hidden="true"
                  />
                  <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 z-10">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-600 scan-deny-shake">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Information Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: isSuccess ? '#15803d' : '#b91c1c' }}
                >
                  {isSuccess ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {formatTime12h(data.time)}
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 truncate mt-0.5">
                {data.memberName}
              </h4>

              {isSuccess ? (
                <p className="text-xs text-slate-600 mt-1">
                  Verified via biometric check-in · {data.planName || 'Active Membership'}
                </p>
              ) : (
                <div className="mt-1 space-y-2">
                  <p className="text-xs text-red-700 font-medium">
                    {data.reason}
                  </p>
                  {data.memberId && (
                    <Link
                      to={`/members/${data.memberId}`}
                      onClick={onDismiss}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                    >
                      <span>Renew Membership Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss feedback"
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
