import React from 'react';
import { MessageCircle, ArrowDown, MapPin, Award } from 'lucide-react';
import { GYM_DETAILS } from '../clientData';

export const HeroSection: React.FC = () => {
  const whatsappUrl = `https://wa.me/${GYM_DETAILS.phone.replace('+', '')}?text=${encodeURIComponent(GYM_DETAILS.whatsappMessage)}`;

  const scrollToLeaderboard = (e: React.MouseEvent) => {
    e.preventDefault();
    document.querySelector('#leaderboard')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative pt-6 pb-12 sm:pt-16 sm:pb-24 border-b border-slate-200/80 bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Subhead & Actions */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            
            {/* Context meta line */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-slate-500 tracking-normal">
              <span className="inline-flex items-center gap-1 text-slate-700">
                <MapPin className="w-3 h-3 text-slate-700 flex-shrink-0" />
                <span>Warangal</span>
              </span>
              <span className="text-slate-300">•</span>
              <span>Est. 2008</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700">Coached by Waheed Khan</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.12] sm:leading-[1.08]">
              Built by champions. <br className="hidden sm:inline" />
              Hardened in heavy iron.
            </h1>

            {/* Subhead */}
            <p className="max-w-xl text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
              Warangal’s premier strength and contest-prep training floor. Olympic power racks, heavy dumbbells, and direct mentorship from Mr. South India.
            </p>

            {/* Actions on Mobile: Full-width stacked buttons with 48px touch height */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 sm:h-12 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Claim Free 1-Day Pass</span>
              </a>

              <button
                onClick={scrollToLeaderboard}
                type="button"
                className="h-11 sm:h-12 px-4 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm border border-slate-300 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <span>View Gym Leaderboard</span>
                <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Proof metrics row: Balanced 3-column scale */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 sm:pt-6 border-t border-slate-200/90 max-w-lg">
              <div>
                <div className="text-xl sm:text-3xl font-medium text-slate-900 tabular-nums">18+</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Years coaching</div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl font-medium text-slate-900 tabular-nums">8</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">State titles</div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl font-medium text-slate-900 tabular-nums">500+</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Athletes trained</div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Frame (Compact on mobile) */}
          <div className="lg:col-span-5 flex justify-center pt-2 sm:pt-0">
            <div className="relative w-full max-w-sm sm:max-w-md rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-xs">
              <img
                src="/coach-hero.jpg"
                alt="Coach Waheed Khan at Iron Gym"
                className="w-full h-[250px] sm:h-[460px] object-cover object-top opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 text-white">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-amber-300/90 mb-0.5">
                  <Award className="w-3 h-3 text-amber-300" />
                  <span>MR. SOUTH INDIA GOLD</span>
                </div>
                <div className="text-sm sm:text-lg font-medium text-white tracking-normal">
                  Waheed Khan
                </div>
                <div className="text-[10px] sm:text-xs text-slate-300">
                  Head Coach & Founder, Iron Gym Warangal
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
