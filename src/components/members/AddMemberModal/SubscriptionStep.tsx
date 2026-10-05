import React from 'react';
import { Calendar, Clock, ShieldCheck } from 'lucide-react';
import type { StepProps } from './types';
import { clsx } from 'clsx';

export const SubscriptionStep: React.FC<StepProps> = ({
  formData,
  updateFormData,
  errors,
  touched,
  setTouched,
}) => {
  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const planPresets = [
    { name: 'Monthly', duration: 1, defaultPrice: 1200 },
    { name: 'Quarterly', duration: 3, defaultPrice: 3200 },
    { name: 'Semi-Annually', duration: 6, defaultPrice: 5800 },
    { name: 'Annually', duration: 12, defaultPrice: 10500 },
    { name: 'Custom', duration: 1, defaultPrice: 0 },
  ];

  const handlePresetSelect = (preset: typeof planPresets[0]) => {
    const isCustom = preset.name === 'Custom';
    const duration = preset.duration;
    const priceStr = isCustom ? (formData.price || '') : String(preset.defaultPrice);

    // Calculate End Date
    let newEndDate = formData.endDate;
    try {
      const start = new Date(formData.startDate || new Date().toISOString().split('T')[0]);
      if (!isNaN(start.getTime())) {
        start.setMonth(start.getMonth() + duration);
        newEndDate = start.toISOString().split('T')[0];
      }
    } catch {}

    updateFormData({
      planSelect: preset.name,
      planName: isCustom ? '' : preset.name,
      durationMonths: duration,
      price: priceStr,
      endDate: newEndDate,
      initialPayment: priceStr, // Auto match initial payment
    });
    setTouched((prev) => ({ ...prev, planName: true, price: true }));
  };

  const handleStartDateChange = (startDateStr: string) => {
    let newEndDate = formData.endDate;
    try {
      const start = new Date(startDateStr);
      if (!isNaN(start.getTime())) {
        start.setMonth(start.getMonth() + Number(formData.durationMonths || 1));
        newEndDate = start.toISOString().split('T')[0];
      }
    } catch {}

    updateFormData({
      startDate: startDateStr,
      endDate: newEndDate,
    });
  };

  const handleDurationChange = (months: number) => {
    let newEndDate = formData.endDate;
    try {
      const start = new Date(formData.startDate);
      if (!isNaN(start.getTime())) {
        start.setMonth(start.getMonth() + months);
        newEndDate = start.toISOString().split('T')[0];
      }
    } catch {}

    updateFormData({
      durationMonths: months,
      endDate: newEndDate,
    });
  };

  return (
    <div className="space-y-5">
      {/* Plan Preset Chips */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Select Membership Plan <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {planPresets.map((preset) => {
            const isSelected = formData.planSelect === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={clsx(
                  'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={clsx(
                      'text-sm font-bold',
                      isSelected ? 'text-blue-700' : 'text-slate-800'
                    )}
                  >
                    {preset.name}
                  </span>
                  {isSelected && <ShieldCheck className="w-4 h-4 text-blue-600" />}
                </div>
                {preset.name !== 'Custom' && (
                  <span className="text-xs text-slate-500 font-mono mt-1">
                    {preset.duration} mo · ₹{preset.defaultPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Plan Name if selected */}
      {formData.planSelect === 'Custom' && (
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Custom Plan Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.planName}
            onChange={(e) => updateFormData({ planName: e.target.value })}
            onBlur={() => markTouched('planName')}
            placeholder="e.g. Student 45-Day Pass"
            className={clsx(
              'w-full px-3 py-2.5 text-sm rounded-lg border outline-none transition-all',
              touched.planName && errors.planName
                ? 'border-red-300 bg-red-50/40'
                : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            )}
          />
          {touched.planName && errors.planName && (
            <p className="text-xs text-red-600 mt-1 font-medium">{errors.planName}</p>
          )}
        </div>
      )}

      {/* Price & Duration Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Price */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Plan Price (₹) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">
              ₹
            </span>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => {
                const val = e.target.value;
                updateFormData({
                  price: val,
                  initialPayment: formData.initialPayment === formData.price ? val : formData.initialPayment,
                });
              }}
              onBlur={() => markTouched('price')}
              placeholder="e.g. 1200"
              className={clsx(
                'w-full pl-8 pr-4 py-2.5 text-sm font-mono font-bold rounded-lg border outline-none transition-all',
                touched.price && errors.price
                  ? 'border-red-300 bg-red-50/40'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              )}
            />
          </div>
          {touched.price && errors.price && (
            <p className="text-xs text-red-600 mt-1 font-medium">{errors.price}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Duration (Months) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="number"
              min={1}
              max={60}
              value={formData.durationMonths}
              onChange={(e) => handleDurationChange(Math.max(1, Number(e.target.value)))}
              onBlur={() => markTouched('durationMonths')}
              className="w-full pl-9 pr-4 py-2.5 text-sm font-mono rounded-lg border border-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Start Date & End Date Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Start Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              onBlur={() => markTouched('startDate')}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            End Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => updateFormData({ endDate: e.target.value })}
              onBlur={() => markTouched('endDate')}
              className={clsx(
                'w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border outline-none transition-all',
                touched.endDate && errors.endDate
                  ? 'border-red-300 bg-red-50/40'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              )}
            />
          </div>
          {touched.endDate && errors.endDate && (
            <p className="text-xs text-red-600 mt-1 font-medium">{errors.endDate}</p>
          )}
        </div>
      </div>
    </div>
  );
};
