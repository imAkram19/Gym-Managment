import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, UserPlus, Check, Loader2 } from 'lucide-react';
import { PersonalInfoStep } from './PersonalInfoStep';
import { SubscriptionStep } from './SubscriptionStep';
import { PaymentStep } from './PaymentStep';
import { ReviewStep } from './ReviewStep';
import type { AddMemberFormData } from './types';
import { createMemberWithSubscription } from '../../../lib/api/members';
import { enrollMemberBiometrics, checkDeviceUserIdMapping } from '../../../lib/api/biometrics';
import { supabase } from '../../../lib/supabase';
import { notify } from '../../../lib/toast';
import { clsx } from 'clsx';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState<AddMemberFormData>({
    fullName: '',
    phone: '',
    gender: 'male',
    dateOfBirth: '',
    address: '',
    info: '',
    deviceUserId: '',
    // Subscription
    planSelect: 'Monthly',
    planName: 'Monthly',
    price: '1200',
    durationMonths: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().split('T')[0];
    })(),
    // Payment
    initialPayment: '1200',
    paymentMethod: 'cash',
    adminNote: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Async duplicate checks
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isCheckingDeviceUserId, setIsCheckingDeviceUserId] = useState(false);
  const [deviceUserIdError, setDeviceUserIdError] = useState('');

  const updateFormData = (updates: Partial<AddMemberFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Reset form & handle Escape key / body scroll lock when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setError('');
      setErrors({});
      setTouched({});
      setDeviceUserIdError('');
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Validate form data
  const validateForm = (data: AddMemberFormData) => {
    const errs: Record<string, string> = {};

    // Step 1: Personal Info
    if (!data.fullName.trim()) {
      errs.fullName = 'Full Name is required';
    } else if (data.fullName.trim().length < 3) {
      errs.fullName = 'Name must be at least 3 characters';
    } else if (data.fullName.trim().length > 100) {
      errs.fullName = 'Name must not exceed 100 characters';
    }

    if (data.phone.trim()) {
      if (!/^\d{10}$/.test(data.phone.trim())) {
        errs.phone = 'Phone number must be exactly 10 digits';
      }
    }

    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dob > today) {
        errs.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    // Step 2: Subscription
    const plan = data.planSelect === 'Custom' ? data.planName : data.planSelect;
    if (!plan.trim()) {
      errs.planName = 'Plan Name is required';
    }

    const priceVal = Number(data.price);
    if (isNaN(priceVal) || priceVal <= 0) {
      errs.price = 'Price must be greater than ₹0';
    }

    if (!data.endDate) {
      errs.endDate = 'End date is required';
    } else if (data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
      errs.endDate = 'End date must be after start date';
    }

    // Step 3: Payment
    if (data.initialPayment !== '') {
      const initPay = Number(data.initialPayment);
      if (isNaN(initPay) || initPay < 0) {
        errs.initialPayment = 'Payment cannot be negative';
      } else if (initPay > priceVal) {
        errs.initialPayment = `Payment cannot exceed total price (₹${priceVal.toLocaleString('en-IN')})`;
      }
    }

    return errs;
  };

  // Check duplicate phone in Supabase
  useEffect(() => {
    const checkPhone = async () => {
      if (/^\d{10}$/.test(formData.phone)) {
        setIsCheckingPhone(true);
        try {
          const { data, error: dbErr } = await supabase
            .from('members')
            .select('id')
            .eq('phone', formData.phone);
          if (!dbErr && data && data.length > 0) {
            setErrors((prev) => ({
              ...prev,
              phone: 'Phone number is already registered',
            }));
          }
        } catch {
        } finally {
          setIsCheckingPhone(false);
        }
      }
    };
    checkPhone();
  }, [formData.phone]);

  // Check duplicate device user ID
  useEffect(() => {
    const checkDeviceId = async () => {
      const trimmed = formData.deviceUserId.trim();
      if (!trimmed) {
        setDeviceUserIdError('');
        return;
      }
      setIsCheckingDeviceUserId(true);
      try {
        const numericId = parseInt(trimmed, 10);
        const mapping = await checkDeviceUserIdMapping(numericId);
        if (mapping && mapping.mapped) {
          setDeviceUserIdError(
            `User ID #${numericId} already mapped to ${mapping.memberName}`
          );
        } else {
          setDeviceUserIdError('');
        }
      } catch {
      } finally {
        setIsCheckingDeviceUserId(false);
      }
    };

    const timer = setTimeout(checkDeviceId, 300);
    return () => clearTimeout(timer);
  }, [formData.deviceUserId]);

  // Run validation
  useEffect(() => {
    const errs = validateForm(formData);
    setErrors((prev) => {
      const next = { ...errs };
      if (prev.phone === 'Phone number is already registered' && /^\d{10}$/.test(formData.phone)) {
        next.phone = prev.phone;
      }
      return next;
    });
  }, [formData]);

  // Step validation guards
  const isStep1Valid = () => {
    return (
      formData.fullName.trim().length >= 3 &&
      (!formData.phone || /^\d{10}$/.test(formData.phone)) &&
      !errors.fullName &&
      !errors.phone &&
      !deviceUserIdError
    );
  };

  const isStep2Valid = () => {
    const plan = formData.planSelect === 'Custom' ? formData.planName : formData.planSelect;
    return (
      plan.trim().length > 0 &&
      Number(formData.price) > 0 &&
      formData.startDate !== '' &&
      formData.endDate !== '' &&
      new Date(formData.endDate) > new Date(formData.startDate) &&
      !errors.planName &&
      !errors.price &&
      !errors.endDate
    );
  };

  const isStep3Valid = () => {
    const initPay = Number(formData.initialPayment || 0);
    const totalPrice = Number(formData.price) || 0;
    return initPay >= 0 && initPay <= totalPrice && !errors.initialPayment;
  };

  const handleNext = () => {
    if (currentStep === 1 && !isStep1Valid()) {
      setTouched((prev) => ({ ...prev, fullName: true, phone: true }));
      return;
    }
    if (currentStep === 2 && !isStep2Valid()) {
      setTouched((prev) => ({ ...prev, planName: true, price: true, endDate: true }));
      return;
    }
    if (currentStep === 3 && !isStep3Valid()) {
      setTouched((prev) => ({ ...prev, initialPayment: true }));
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const finalErrors = validateForm(formData);
    if (Object.keys(finalErrors).length > 0 || deviceUserIdError) {
      setErrors(finalErrors);
      notify.error('Please resolve the errors before submitting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const planName = formData.planSelect === 'Custom' ? formData.planName : formData.planSelect;
      const newMember = await createMemberWithSubscription(
        {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim() || undefined,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth || undefined,
          address: formData.address || undefined,
          info: formData.info || undefined,
        },
        {
          planName: planName,
          price: Number(formData.price),
          durationMonths: Number(formData.durationMonths),
          startDate: formData.startDate,
          endDate: formData.endDate,
        },
        {
          amount: Number(formData.initialPayment || formData.price),
          method: formData.paymentMethod,
          adminNote: formData.adminNote,
        }
      );

      // Biometric mapping if entered
      if (formData.deviceUserId.trim()) {
        const numericId = parseInt(formData.deviceUserId.trim(), 10);
        await enrollMemberBiometrics(newMember.id, numericId);
      }

      notify.memberAdded(newMember.fullName);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create member:', err);
      setError(err.message || 'Failed to create member');
      notify.error(err.message || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const steps = [
    { num: 1, label: 'Personal' },
    { num: 2, label: 'Plan' },
    { num: 3, label: 'Payment' },
    { num: 4, label: 'Review' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Shell */}
      <div className="relative z-10 w-full max-w-lg p-px rounded-2xl bg-slate-200/90 shadow-2xl overflow-hidden animate-[scale-in_150ms_cubic-bezier(0.23,1,0.32,1)_both]">
        <div className="bg-white rounded-[15px] flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Add New Member
                </h3>
                <p className="text-xs text-slate-500">Step {currentStep} of 4</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="px-6 pt-4 pb-2 bg-slate-50/30 border-b border-slate-100">
            <div className="flex items-center justify-between relative">
              {steps.map((s, idx) => {
                const isPassed = currentStep > s.num;
                const isCurrent = currentStep === s.num;
                return (
                  <div key={s.num} className="flex-1 flex flex-col items-center relative">
                    {/* Connecting line */}
                    {idx > 0 && (
                      <div
                        className={clsx(
                          'absolute top-3.5 -left-1/2 right-1/2 h-0.5 -z-0 transition-colors',
                          isPassed || isCurrent ? 'bg-blue-600' : 'bg-slate-200'
                        )}
                      />
                    )}
                    {/* Step circle */}
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10',
                        isPassed
                          ? 'bg-blue-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      )}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <span
                      className={clsx(
                        'text-[11px] font-semibold mt-1 tracking-tight',
                        isCurrent
                          ? 'text-blue-600'
                          : isPassed
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Form Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {currentStep === 1 && (
                  <PersonalInfoStep
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                    touched={touched}
                    setTouched={setTouched}
                    isCheckingPhone={isCheckingPhone}
                    isCheckingDeviceUserId={isCheckingDeviceUserId}
                    deviceUserIdError={deviceUserIdError}
                  />
                )}
                {currentStep === 2 && (
                  <SubscriptionStep
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                    touched={touched}
                    setTouched={setTouched}
                  />
                )}
                {currentStep === 3 && (
                  <PaymentStep
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                    touched={touched}
                    setTouched={setTouched}
                  />
                )}
                {currentStep === 4 && <ReviewStep formData={formData} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-all cursor-pointer shadow-sm shadow-blue-500/20"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Enroll Member</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
