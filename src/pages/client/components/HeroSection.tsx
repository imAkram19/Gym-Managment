import React from 'react';
import { Flame, MessageCircle, MapPin, Trophy } from 'lucide-react';
import { GYM_DETAILS } from '../clientData';

export const HeroSection: React.FC = () => {
  const whatsappUrl = `https://wa.me/${GYM_DETAILS.phone.replace('+', '')}?text=${encodeURIComponent(GYM_DETAILS.whatsappMessage)}`;

  const scrollToLeaderboard = (e: React.MouseEvent) => {
    e.preventDefault();
    document.querySelector('#leaderboard')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="hidden sm:block relative pt-4 pb-2 sm:pt-20 sm:pb-16 overflow-hidden bg-gradient-to-b from-blue-50/50 via-slate-50 to-white font-sans">
      {/* Light Background Ambiance */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-blue-100/70 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-amber-100/50 rounded-full blur-[120px]" />
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #18213a 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        {/* Championship Ribbon — Hidden on Mobile */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold mb-3.5 shadow-sm">
          <Trophy className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span className="truncate">Home of Champions · Founded by Waheed Khan</span>
        </div>

        {/* Compact Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase font-sans leading-tight mb-2 sm:mb-2.5">
          Built By Champions. <span className="text-blue-600">Forged in Iron.</span>
        </h1>

        {/* Short Subtitle with Coach Waheed Khan (Warangal prefix hidden on mobile) */}
        <p className="max-w-lg mx-auto text-xs sm:text-sm md:text-base text-slate-600 font-normal leading-relaxed mb-3 sm:mb-6">
          <span className="hidden sm:inline">Warangal’s premier strength & bodybuilding center. </span>
          Coached directly by Mr. South India <strong className="text-slate-900 font-semibold">Waheed Khan</strong>.
        </p>

        {/* Side-by-Side Action Group on Mobile & Desktop */}
        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto sm:flex sm:flex-row sm:items-center sm:justify-center sm:gap-4 sm:max-w-none mb-0 sm:mb-12">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
            <span className="truncate">Free 1-Day Pass</span>
          </a>

          <button
            onClick={scrollToLeaderboard}
            type="button"
            className="flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300 flex-shrink-0" />
            <span className="truncate">Leaderboard</span>
          </button>
        </div>

        {/* Credentials Grid — Hidden on Mobile */}
        <div className="hidden md:grid grid-cols-4 gap-3.5 max-w-4xl mx-auto pt-4 border-t border-slate-200">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-center shadow-sm">
            <div className="text-2xl font-black text-blue-600 font-sans">18+</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Years of Legacy</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-center shadow-sm">
            <div className="text-2xl font-black text-amber-600 font-sans">8+</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">State & Zonal Titles</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-center shadow-sm">
            <div className="text-2xl font-black text-blue-600 font-sans">500+</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Athletes Transformed</div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-center shadow-sm">
            <div className="text-2xl font-black text-slate-900 font-sans">100%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Real Mentorship</div>
          </div>
        </div>

        {/* Address badge — Hidden on Mobile */}
        <div className="hidden sm:inline-flex mt-4 sm:mt-8 items-center gap-1.5 text-xs text-slate-500 font-medium">
          <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
          <span className="truncate">Max, Pochamma Maidan, Warangal</span>
        </div>
      </div>
    </section>
  );
};
