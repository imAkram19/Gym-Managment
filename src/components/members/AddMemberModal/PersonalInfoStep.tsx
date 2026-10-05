import React from 'react';
import { User, Phone, Calendar, MapPin, FileText, Fingerprint, Loader2 } from 'lucide-react';
import type { StepProps } from './types';
import { clsx } from 'clsx';

export const PersonalInfoStep: React.FC<StepProps> = ({
  formData,
  updateFormData,
  errors,
  touched,
  setTouched,
  isCheckingPhone,
  isCheckingDeviceUserId,
  deviceUserIdError,
}) => {
  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <div className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            onBlur={() => markTouched('fullName')}
            placeholder="e.g. Vikram Malhotra"
            className={clsx(
              'w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border outline-none transition-all',
              touched.fullName && errors.fullName
                ? 'border-red-300 bg-red-50/40 focus:ring-2 focus:ring-red-400'
                : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            )}
          />
        </div>
        {touched.fullName && errors.fullName && (
          <p className="text-xs text-red-600 mt-1 font-medium">{errors.fullName}</p>
        )}
      </div>

      {/* Phone & Gender Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Phone Number (10 digits)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="tel"
              name="phone"
              maxLength={10}
              value={formData.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                updateFormData({ phone: val });
              }}
              onBlur={() => markTouched('phone')}
              placeholder="e.g. 9876543210"
              className={clsx(
                'w-full pl-9 pr-10 py-2.5 text-sm font-mono rounded-lg border outline-none transition-all',
                touched.phone && errors.phone
                  ? 'border-red-300 bg-red-50/40 focus:ring-2 focus:ring-red-400'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              )}
            />
            {isCheckingPhone && (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-3" />
            )}
          </div>
          {touched.phone && errors.phone && (
            <p className="text-xs text-red-600 mt-1 font-medium">{errors.phone}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={(e) => updateFormData({ gender: e.target.value as any })}
            onBlur={() => markTouched('gender')}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Date of Birth & Biometric User ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date of Birth */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Date of Birth
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
              onBlur={() => markTouched('dateOfBirth')}
              className={clsx(
                'w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border outline-none transition-all',
                touched.dateOfBirth && errors.dateOfBirth
                  ? 'border-red-300 bg-red-50/40'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              )}
            />
          </div>
          {touched.dateOfBirth && errors.dateOfBirth && (
            <p className="text-xs text-red-600 mt-1 font-medium">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Biometric Device User ID */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Biometric User ID (K40)</span>
            <span className="text-[10px] text-slate-400 font-normal">Optional</span>
          </label>
          <div className="relative">
            <Fingerprint className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              name="deviceUserId"
              value={formData.deviceUserId}
              onChange={(e) => updateFormData({ deviceUserId: e.target.value.replace(/\D/g, '') })}
              placeholder="e.g. 104"
              className={clsx(
                'w-full pl-9 pr-10 py-2.5 text-sm font-mono rounded-lg border outline-none transition-all',
                deviceUserIdError
                  ? 'border-red-300 bg-red-50/40 focus:ring-2 focus:ring-red-400'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              )}
            />
            {isCheckingDeviceUserId && (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-3 top-3" />
            )}
          </div>
          {deviceUserIdError && (
            <p className="text-xs text-red-600 mt-1 font-medium">{deviceUserIdError}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Address / Area
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            placeholder="e.g. MG Road, Bengaluru"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Medical / Fitness Notes */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Medical & Fitness Info
        </label>
        <div className="relative">
          <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            rows={2}
            name="info"
            value={formData.info}
            onChange={(e) => updateFormData({ info: e.target.value })}
            placeholder="Any injuries, allergies, or workout goals..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>
      </div>
    </div>
  );
};
