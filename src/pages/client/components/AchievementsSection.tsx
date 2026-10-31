import React, { useState, useEffect } from 'react';
import { Award, ChevronLeft, ChevronRight } from 'lucide-react';

export interface RankedAchievement {
  title: string;
  year: string;
  tier: 'gold' | 'brown' | 'silver';
  tierLabel: string;
  badge: string;
  description: string;
}

const RANKED_ACHIEVEMENTS: RankedAchievement[] = [
  {
    title: 'Mr. South India Champion',
    year: '2019',
    tier: 'gold',
    tierLabel: 'Pinnacle Gold',
    badge: '1st Place Champion',
    description: 'Gold champion across all 5 southern states. Peak regional bodybuilding authority.',
  },
  {
    title: 'Shafi Sami Classic',
    year: '2026',
    tier: 'gold',
    tierLabel: 'State Gold',
    badge: 'Reigning Mr. Telangana',
    description: 'Current 2026 reigning state champion gold medalist with peak muscle conditioning.',
  },
  {
    title: 'Mr. Telangana (Title Defense)',
    year: '2010',
    tier: 'gold',
    tierLabel: 'State Gold',
    badge: 'Defending Champion',
    description: 'Back-to-back state title defense with overwhelming conditioning and symmetry.',
  },
  {
    title: 'Mr. Telangana Champion',
    year: '2009',
    tier: 'gold',
    tierLabel: 'State Gold',
    badge: '1st Place Gold',
    description: 'Crowned Mr. Telangana, cementing undisputed authority across the state.',
  },
  {
    title: 'Naresh Surya Classic',
    year: '2024',
    tier: 'brown',
    tierLabel: 'Classic Honor',
    badge: 'Classic Title',
    description: 'Decade-long dominance proven on the elite national classic open stage.',
  },
  {
    title: 'Naresh Surya Classic',
    year: '2019',
    tier: 'brown',
    tierLabel: 'Classic Honor',
    badge: 'Classic Title',
    description: 'Open classic champion with unmatched symmetry and conditioning.',
  },
  {
    title: 'Kakatiya University (3x)',
    year: '2009–2011',
    tier: 'brown',
    tierLabel: 'University Dynasty',
    badge: '3x Best Physique',
    description: '3 consecutive years crowned Best Physique in Kakatiya University.',
  },
  {
    title: 'Mr. Warangal',
    year: '2008',
    tier: 'silver',
    tierLabel: 'District Foundation',
    badge: 'District Foundation',
    description: 'Where the competitive legacy began—undisputed champion of Warangal district.',
  },
];

export const AchievementsSection: React.FC = () => {
  const [mobileIndex, setMobileIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const initialDelay = setTimeout(() => {
      interval = setInterval(() => {
        setMobileIndex((prev) => (prev + 1) % RANKED_ACHIEVEMENTS.length);
      }, 3500);
    }, 1500);

    return () => {
      clearTimeout(initialDelay);
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleNextMobile = () => {
    setMobileIndex((prev) => (prev + 1) % RANKED_ACHIEVEMENTS.length);
  };

  const handlePrevMobile = () => {
    setMobileIndex((prev) => (prev - 1 + RANKED_ACHIEVEMENTS.length) % RANKED_ACHIEVEMENTS.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff > 40) {
      handleNextMobile();
    } else if (diff < -40) {
      handlePrevMobile();
    }
    setTouchStartX(null);
  };

  return (
    <section id="achievements" className="py-10 sm:py-24 bg-[#fafafa] border-b border-slate-200/80 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-xl mb-8 sm:mb-12">
          <div className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
            Competitive Record
          </div>
          <h2 className="text-xl sm:text-4xl font-medium tracking-tight text-slate-900 leading-tight">
            Championship titles and regional podiums.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Every title won on stage by Coach Waheed Khan reflects the standard of discipline taught on the Iron Gym floor.
          </p>
        </div>

        {/* ── DESKTOP & TABLET: Infinite Moving Carousel with Quiet Cards ── */}
        <div className="hidden sm:block overflow-hidden relative w-full pb-4">
          <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[#fafafa] to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-[#fafafa] to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee-rtl flex gap-4">
            {[...RANKED_ACHIEVEMENTS, ...RANKED_ACHIEVEMENTS].map((item, idx) => (
              <div
                key={`${item.title}-${item.year}-${idx}`}
                className="w-[280px] flex-shrink-0 rounded-xl p-5 flex flex-col justify-between bg-white border border-slate-200/90 transition-colors hover:border-slate-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-mono text-[11px] text-slate-500 uppercase">
                      {item.tierLabel}
                    </span>
                    <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 tabular-nums">
                      {item.year}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 mb-2.5">
                    <Award className="w-4 h-4 text-slate-700 mt-0.5 flex-shrink-0" />
                    <h3 className="text-sm font-medium text-slate-900 tracking-tight leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Waheed Khan</span>
                  <span className="font-medium text-slate-800">{item.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MOBILE PHONES: Native Gesture Swipe Carousel ── */}
        <div
          className="sm:hidden touch-pan-y select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative min-h-[190px] w-full">
            {RANKED_ACHIEVEMENTS.map((item, idx) => {
              const isCurrent = idx === mobileIndex;

              return (
                <div
                  key={`mobile-${item.title}-${idx}`}
                  className={`w-full rounded-xl p-4 sm:p-5 bg-white border border-slate-200 absolute inset-0 flex flex-col justify-between transition-all duration-300 ease-out shadow-xs ${
                    isCurrent
                      ? 'opacity-100 translate-x-0 pointer-events-auto z-10'
                      : 'opacity-0 translate-x-3 pointer-events-none z-0'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                        {item.tierLabel}
                      </span>
                      <span className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 tabular-nums">
                        {item.year}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 mb-1.5">
                      <Award className="w-4 h-4 text-slate-700 mt-0.5 flex-shrink-0" />
                      <h3 className="text-sm font-medium text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] mt-1.5">
                    <span className="text-slate-400">Coach Waheed Khan</span>
                    <span className="font-medium text-slate-800">{item.badge}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Navigation Bar with 36px Touch Targets */}
          <div className="mt-3.5 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              {RANKED_ACHIEVEMENTS.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setMobileIndex(dotIdx)}
                  aria-label={`Go to item ${dotIdx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    dotIdx === mobileIndex ? 'w-4 bg-slate-900' : 'w-1.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMobile}
                className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform cursor-pointer"
                aria-label="Previous card"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMobile}
                className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                aria-label="Next card"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
