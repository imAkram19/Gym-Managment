import React from 'react';
import { Dumbbell, Fingerprint, Award, Flame } from 'lucide-react';

export const GymFeatures: React.FC = () => {
  const pillars = [
    {
      icon: Dumbbell,
      title: 'Heavy Iron',
      desc: 'Olympic power racks & heavy dumbbells to 50kg+.',
    },
    {
      icon: Fingerprint,
      title: 'Smart Access',
      desc: 'Rapid biometric scan. Zero front-desk wait time.',
    },
    {
      icon: Award,
      title: 'Champion Coach',
      desc: 'Direct mentorship & form checks from Mr. South India.',
    },
    {
      icon: Flame,
      title: 'Leaderboard',
      desc: 'Real-time workout streaks & live athlete rankings.',
    },
  ];

  return (
    <section id="legacy" className="py-10 sm:py-20 bg-white relative border-t border-slate-200/80 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] sm:text-xs font-semibold mb-2 sm:mb-3">
            <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
            <span>THE IRON ADVANTAGE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
            Why Choose <span className="text-blue-600">Iron Gym</span>
          </h2>
          <p className="mt-1 text-slate-600 text-xs sm:text-sm">
            Old-school heavy iron paired with modern biometric tech.
          </p>
        </div>

        {/* 2 per row on Mobile, 4 on Desktop — Icon & Heading strictly on ONE line */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                {/* Icon & Heading strictly in ONE line */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 min-w-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <h3 className="text-[11px] sm:text-xs md:text-sm font-black text-slate-900 uppercase tracking-tight truncate whitespace-nowrap">
                    {item.title}
                  </h3>
                </div>

                <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
