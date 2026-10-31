import React from 'react';
import { Award, ShieldCheck, Flame, Users, MessageCircle, ArrowRight } from 'lucide-react';
import { GYM_DETAILS } from '../clientData';

export const CoachSpotlight: React.FC = () => {
  const coachWhatsAppUrl = `https://wa.me/${GYM_DETAILS.phone.replace('+', '')}?text=${encodeURIComponent(GYM_DETAILS.whatsappCoachMessage)}`;

  const pillars = [
    {
      title: 'Biomechanical Form',
      desc: 'Joint-sparing lifting technique and strict progressive overload protocols to build lasting muscle without chronic injury.',
      icon: ShieldCheck,
    },
    {
      title: '8x Gold Championship Career',
      desc: 'Proven contest-stage pedigree from Mr. Warangal in 2008 through the 2026 Shafi Sami Classic.',
      icon: Award,
    },
    {
      title: 'Real Nutrition Guidance',
      desc: 'Targeted caloric splits, clean protein requirements, and sustainable meal timing without extreme gimmick starvation diets.',
      icon: Flame,
    },
    {
      title: 'Direct Floor Mentorship',
      desc: 'Coach Waheed is personally present on the gym floor during morning and evening sessions to spot lifts and correct posture.',
      icon: Users,
    },
  ];

  return (
    <section id="coach" className="py-10 sm:py-24 bg-white border-b border-slate-200/80 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-xl mb-8 sm:mb-12">
          <div className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
            Head Coach & Mentorship
          </div>
          <h2 className="text-xl sm:text-4xl font-medium tracking-tight text-slate-900 leading-tight">
            Coaching anchored in 18 years of stage discipline.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            At Iron Gym, you train under direct supervision from Mr. South India Waheed Khan. No junior interns, no algorithm routines.
          </p>
        </div>

        {/* Coach Quote & Philosophy */}
        <div className="mb-8 sm:mb-12 p-4 sm:p-8 rounded-xl bg-slate-50 border border-slate-200/90">
          <p className="text-sm sm:text-lg text-slate-800 font-normal leading-relaxed">
            “The barbell is the ultimate truth-teller. It does not care about trends or excuses. If you show up every day with humility and focus, physical strength and mental resilience inevitably follow.”
          </p>
          <div className="mt-3.5 pt-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="font-medium text-slate-900">Waheed Khan — Founder & Master Coach</span>
            <span className="text-[11px] sm:text-xs text-slate-500">Mr. South India · Multi-time Mr. Telangana</span>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mb-8 sm:mb-10">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-slate-900 tracking-normal mb-0.5 sm:mb-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Direct Action Link on Mobile: Full-width button with 44px touch height */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-slate-900 text-white">
          <div>
            <div className="text-xs sm:text-sm font-medium text-white">
              Want 1-on-1 personal guidance or contest preparation?
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Discuss your fitness goals directly with Coach Waheed Khan on WhatsApp.
            </div>
          </div>
          <a
            href={coachWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto h-11 sm:h-10 px-4 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-medium inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-transform flex-shrink-0 shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Consult Coach on WhatsApp</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>

      </div>
    </section>
  );
};
