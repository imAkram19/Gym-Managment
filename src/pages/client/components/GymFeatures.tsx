import React from 'react';
import { Dumbbell, Fingerprint, Award, Activity } from 'lucide-react';

export const GymFeatures: React.FC = () => {
  const pillars = [
    {
      icon: Dumbbell,
      title: 'Heavy Iron',
      desc: 'Olympic power racks, calibrated plates, and dumbbells past 50kg.',
    },
    {
      icon: Fingerprint,
      title: 'Biometric Access',
      desc: 'Rapid turnstile check-in with zero front-desk waiting lines.',
    },
    {
      icon: Award,
      title: 'Coach Mentorship',
      desc: 'Direct lifting adjustments from Mr. South India Waheed Khan.',
    },
    {
      icon: Activity,
      title: 'Streak Tracking',
      desc: 'Automated workout attendance and monthly streak syncing.',
    },
  ];

  return (
    <section id="legacy" className="py-10 sm:py-24 bg-[#fafafa] border-b border-slate-200/80 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-xl mb-8 sm:mb-12">
          <div className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
            Facility & Equipment
          </div>
          <h2 className="text-xl sm:text-4xl font-medium tracking-tight text-slate-900 leading-tight">
            Heavy iron paired with automated access.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Equipped for heavy progressive overload and friction-free daily check-ins.
          </p>
        </div>

        {/* 2x2 Grid on Mobile, 4-Col on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 sm:p-6 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-2.5 sm:mb-4">
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-slate-900 tracking-tight mb-1 sm:mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
