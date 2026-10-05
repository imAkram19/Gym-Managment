import React from 'react';
import { CreditCard, Banknote, QrCode, FileText } from 'lucide-react';
import type { StepProps } from './types';
import { clsx } from 'clsx';

export const PaymentStep: React.FC<StepProps> = ({
  formData,
  updateFormData,
  errors,
  touched,
  setTouched,
}) => {
  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const totalPrice = Number(formData.price) || 0;
  const initialPaymentNum = Number(formData.initialPayment) || 0;
  const balanceRemaining = Math.max(0, totalPrice - initialPaymentNum);

  const paymentMethods: Array<{
    id: 'cash' | 'upi' | 'card' | 'other';
    label: string;
    icon: any;
  }> = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'upi', label: 'UPI / QR', icon: QrCode },
    { id: 'card', label: 'Card / POS', icon: CreditCard },
    { id: 'other', label: 'Other', icon: FileText },
  ];

  return (
    <div className="space-y-5">
      {/* Price Summary Banner */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 block">Total Plan Price</span>
          <span className="text-lg font-bold font-mono text-slate-900">
            ₹{totalPrice.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Balance Pending</span>
          <span
            className={clsx(
              'text-sm font-bold font-mono',
              balanceRemaining > 0 ? 'text-amber-600' : 'text-emerald-600'
            )}
          >
            ₹{balanceRemaining.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Payment Amount */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Initial Payment Received (₹) <span className="text-red-500">*</span>
          </label>
          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateFormData({ initialPayment: String(totalPrice) })}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              Full (₹{totalPrice.toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              onClick={() => updateFormData({ initialPayment: '0' })}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Pay Later (₹0)
            </button>
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">
            ₹
          </span>
          <input
            type="number"
            value={formData.initialPayment}
            onChange={(e) => updateFormData({ initialPayment: e.target.value })}
            onBlur={() => markTouched('initialPayment')}
            placeholder="e.g. 1200"
            className={clsx(
              'w-full pl-8 pr-4 py-2.5 text-sm font-mono font-bold rounded-lg border outline-none transition-all',
              touched.initialPayment && errors.initialPayment
                ? 'border-red-300 bg-red-50/40'
                : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            )}
          />
        </div>
        {touched.initialPayment && errors.initialPayment && (
          <p className="text-xs text-red-600 mt-1 font-medium">
            {errors.initialPayment}
          </p>
        )}
      </div>

      {/* Payment Method Selector */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Payment Method <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {paymentMethods.map((m) => {
            const isSelected = formData.paymentMethod === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => updateFormData({ paymentMethod: m.id })}
                className={clsx(
                  'p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs text-blue-700 font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                )}
              >
                <Icon className={clsx('w-5 h-5', isSelected ? 'text-blue-600' : 'text-slate-400')} />
                <span className="text-xs font-medium">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Notes / Receipt Reference */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Admin Note / UPI Ref / Transaction ID
        </label>
        <input
          type="text"
          value={formData.adminNote}
          onChange={(e) => updateFormData({ adminNote: e.target.value })}
          placeholder="e.g. GPay UPI ref #8273618 or Receipt #04"
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
    </div>
  );
};
