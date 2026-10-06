import React from 'react';
import { Trophy, Award, Crown, Quote, Flame, MessageCircle } from 'lucide-react';
import { GYM_DETAILS } from '../clientData';

export const CoachSpotlight: React.FC = () => {
  const coachWhatsAppUrl = `https://wa.me/${GYM_DETAILS.phone.replace('+', '')}?text=${encodeURIComponent(GYM_DETAILS.whatsappCoachMessage)}`;

  return (
    <section id="coach" className="pt-4 pb-12 sm:py-20 bg-slate-50/70 relative overflow-hidden border-t border-slate-200/80 font-sans">
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-100/50 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-amber-100/50 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold mb-2 sm:mb-3">
            <Crown className="w-3.5 h-3.5 text-blue-600" />
            <span>FOUNDER & MASTER COACH</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase">
            Meet Coach <span className="text-blue-600">Waheed Khan</span>
          </h2>
          <p className="mt-1.5 text-slate-600 text-xs sm:text-sm">
            Mr. South India · Multi-Time Mr. Telangana · 18+ Years of Stage Dominance
          </p>
        </div>

        {/* Coach Profile Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center max-w-6xl mx-auto">
          {/* Coach Photo Column */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group w-full max-w-md">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-blue-500/20 via-amber-400/20 to-blue-600/20 opacity-60 group-hover:opacity-100 blur-md transition-all duration-500" />
              
              <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-lg">
                <img
                  src="/coach-hero.jpg"
                  alt="Coach Waheed Khan - Iron Gym Founder"
                  className="w-full h-[320px] sm:h-[480px] object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />

                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                      Master Coach
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/20 border border-white/30 text-white text-[10px] font-semibold backdrop-blur-md">
                      Mr. South India
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    Waheed Khan
                  </h3>
                  <p className="text-[11px] text-amber-300 font-medium">
                    Founder & Head Coach · Iron Gym Warangal
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coach Story & Credentials Column */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {/* Short & Punchy Quote block */}
            <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
              <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500/30 mb-1" />
              <p className="text-slate-800 text-sm sm:text-base font-medium italic leading-relaxed">
                “The barbell respects only consistency and discipline. We don’t just train bodies — we forge character.”
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">— Waheed Khan</span>
                <span className="text-slate-500 text-[11px]">Founder, Iron Gym</span>
              </div>
            </div>

            {/* Core Coaching Pillars */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">8x Gold Titles</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
                  From Mr. Warangal to 2026 Shafi Sami Classic.
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Biomechanical Form</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
                  Injury-free progressive overload science.
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Custom Nutrition</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
                  Targeted caloric & macro meal roadmaps.
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Floor Mentorship</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
                  Direct hands-on guidance on the floor.
                </p>
              </div>
            </div>

            {/* Quick WhatsApp Consultation CTA */}
            <div className="pt-1">
              <a
                href={coachWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Consult With Coach Waheed on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
