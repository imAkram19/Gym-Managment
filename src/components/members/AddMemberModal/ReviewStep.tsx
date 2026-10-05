import React from 'react';
import { User, CreditCard, Fingerprint, ShieldCheck } from 'lucide-react';
import type { AddMemberFormData } from './types';

interface ReviewStepProps {
  formData: AddMemberFormData;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ formData }) => {
  const planName = formData.planSelect === 'Custom' ? formData.planName : formData.planSelect;
  const totalPrice = Number(formData.price) || 0;
  const paidPrice = Number(formData.initialPayment || formData.price) || 0;
  const balance = Math.max(0, totalPrice - paidPrice);

  return (
    <div className="space-y-4">
      {/* Visual Identity Header */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
          {formData.fullName.trim() ? formData.fullName.trim().charAt(0).toUpperCase() : 'M'}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900 truncate">
            {formData.fullName || 'Member Name'}
          </h3>
          <p className="text-xs text-slate-600 font-mono">
            {formData.phone ? `+91 ${formData.phone}` : 'No phone specified'} · {formData.gender}
          </p>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Personal Details Card */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2">
          <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Profile Details
          </h4>
          <div className="space-y-1 text-slate-700">
            <div>
              <span className="text-slate-400">DOB:</span>{' '}
              <span className="font-medium">{formData.dateOfBirth || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400">Address:</span>{' '}
              <span className="font-medium truncate block">{formData.address || '—'}</span>
            </div>
            {formData.deviceUserId && (
              <div className="pt-1 border-t border-slate-100 flex items-center gap-1 text-blue-700 font-semibold font-mono">
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Biometric User #{formData.deviceUserId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Plan Card */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2">
          <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Membership Plan
          </h4>
          <div className="space-y-1 text-slate-700">
            <div>
              <span className="text-slate-400">Plan:</span>{' '}
              <span className="font-bold text-slate-900">{planName}</span> (
              {formData.durationMonths} {formData.durationMonths === 1 ? 'Month' : 'Months'})
            </div>
            <div>
              <span className="text-slate-400">Valid:</span>{' '}
              <span className="font-mono text-slate-800">
                {formData.startDate} → {formData.endDate}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Price:</span>{' '}
              <span className="font-mono font-bold text-slate-900">
                ₹{totalPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Summary (Full Width) */}
        <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            Payment Summary
          </h4>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Paid Today</span>
              <span className="font-mono font-bold text-sm text-emerald-600">
                ₹{paidPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Balance</span>
              <span className="font-mono font-bold text-sm text-slate-700">
                ₹{balance.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Method</span>
              <span className="font-bold text-xs uppercase text-slate-800">
                {formData.paymentMethod}
              </span>
            </div>
          </div>
          {formData.adminNote && (
            <p className="text-[11px] text-slate-500 italic pt-1 truncate">
              Ref/Note: {formData.adminNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
