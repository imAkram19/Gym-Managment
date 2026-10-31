import React from 'react';
import { Check, MessageCircle } from 'lucide-react';
import { GYM_PLANS, GYM_DETAILS } from '../clientData';

export const MembershipPlans: React.FC = () => {
  const getWhatsAppPlanUrl = (planName: string) => {
    const text = `Hi Iron Gym team, I am interested in joining under the "${planName}" plan. Please share admission details and slot availability.`;
    return `https://wa.me/${GYM_DETAILS.phone.replace('+', '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="plans" className="py-10 sm:py-24 bg-white border-b border-slate-200/80 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-xl mb-8 sm:mb-12">
          <div className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
            Pricing & Passes
          </div>
          <h2 className="text-xl sm:text-4xl font-medium tracking-tight text-slate-900 leading-tight">
            Transparent passes, zero admission lock-in.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Every pass grants full floor access, biometric entry, and direct lifting mentorship during workout hours.
          </p>
        </div>

        {/* 3 Tier Grid on Mobile: Clean spacing, thumb-friendly actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 items-stretch">
          {GYM_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl p-4 sm:p-6 flex flex-col justify-between transition-colors bg-white border ${
                plan.isPopular
                  ? 'border-slate-900 shadow-sm'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-[11px] sm:text-xs font-mono text-slate-500 uppercase tracking-wider">
                    {plan.duration}
                  </span>
                  {plan.isPopular && (
                    <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-white uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                </div>

                {/* Plan Name */}
                <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-1.5 sm:mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-3xl font-medium text-slate-900 tabular-nums">
                    {plan.price}
                  </span>
                  {plan.originalPrice && (
                    <span className="text-xs text-slate-400 line-through tabular-nums">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 ml-1">/ all-inclusive</span>
                </div>

                {/* Feature Checklist */}
                <div className="space-y-2 sm:space-y-2.5 pt-3 sm:pt-4 border-t border-slate-100 text-xs text-slate-600">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 text-slate-900 mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: 44px Touch Target with Active Tap Scale */}
              <div className="mt-5 sm:mt-8 pt-3 sm:pt-4 border-t border-slate-100">
                <a
                  href={getWhatsAppPlanUrl(plan.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full h-11 rounded-lg text-xs font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-xs ${
                    plan.isPopular
                      ? 'bg-slate-900 hover:bg-slate-800 text-white'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Select Pass via WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
