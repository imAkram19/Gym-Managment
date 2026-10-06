import React from 'react';
import { Check, Sparkles, MessageCircle } from 'lucide-react';
import { GYM_PLANS, GYM_DETAILS } from '../clientData';

export const MembershipPlans: React.FC = () => {
  const getWhatsAppPlanUrl = (planName: string) => {
    const text = `Hi Iron Gym team, I am interested in joining under the "${planName}" plan. Please share admission details and slot availability!`;
    return `https://wa.me/${GYM_DETAILS.phone.replace('+', '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="plans" className="py-12 sm:py-20 bg-slate-50/70 relative overflow-hidden border-t border-slate-200/80 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-semibold mb-2 sm:mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>TRANSPARENT PASSES</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
            Membership <span className="text-blue-600">Passes</span>
          </h2>
          <p className="mt-1 text-slate-600 text-xs sm:text-sm">
            Flexible passes tailored for consistent training.
          </p>
        </div>

        {/* 3 Tier Grid — Aligned & Equal Height on PC */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {GYM_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all bg-white ${
                plan.isPopular
                  ? 'border-2 border-blue-600 shadow-md ring-2 ring-blue-100 relative'
                  : 'border border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div>
                {/* Top Badge & Duration Row */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[11px] font-normal uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      plan.isPopular
                        ? 'bg-blue-600 text-white shadow-xs font-medium'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {plan.isPopular ? '★ Most Popular' : plan.tag || 'Standard Pass'}
                  </span>
                  <span className="text-xs font-mono font-normal text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {plan.duration}
                  </span>
                </div>

                {/* Plan Title (Dedicated row to guarantee zero wrapping collision) */}
                <h3 className="text-base sm:text-lg font-medium text-slate-800 uppercase tracking-tight mb-3">
                  {plan.name}
                </h3>

                {/* Price Display */}
                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans">{plan.price}</span>
                  {plan.originalPrice && (
                    <span className="text-xs text-slate-400 line-through font-sans">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 ml-1">/ all-inclusive</span>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <a
                  href={getWhatsAppPlanUrl(plan.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
                    plan.isPopular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>Select via WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
