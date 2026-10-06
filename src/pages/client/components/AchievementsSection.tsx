import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, ChevronLeft, ChevronRight } from 'lucide-react';

export interface RankedAchievement {
  title: string;
  year: string;
  tier: 'gold' | 'brown' | 'silver';
  tierLabel: string;
  badge: string;
  description: string;
}

// Ordered strictly: Gold (Champions) -> Brown (Classics & University) -> Silver (District Foundation)
const RANKED_ACHIEVEMENTS: RankedAchievement[] = [
  // 1. GOLD TIER (Champion Ones)
  {
    title: 'Mr South India Champion',
    year: '2019',
    tier: 'gold',
    tierLabel: 'Pinnacle Gold',
    badge: '1st Place Champion',
    description: 'Gold champion across all 5 southern states. The peak of regional bodybuilding supremacy.',
  },
  {
    title: 'Shafi Sami Classic',
    year: '2026',
    tier: 'gold',
    tierLabel: 'State Gold',
    badge: 'Reigning Mr Telangana',
    description: 'Current 2026 reigning state champion gold medalist with peak muscle density.',
  },
  {
    title: 'Mr Telangana (Back-to-Back)',
    year: '2010',
    tier: 'gold',
    tierLabel: 'State Gold',
    badge: 'Defending Champion',
    description: 'Back-to-back state title defense with overwhelming conditioning.',
  },
  {
    title: 'Mr Telangana Champion',
    year: '2009',
    tier: 'gold',
    tierLabel: 'State Gold',
    badge: '1st Place Gold',
    description: 'Crowned Mr Telangana, cementing undisputed authority across the state.',
  },

  // 2. BROWN / BRONZE TIER (Classics & 3x University Dynasty)
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
    year: '2009 – 2011',
    tier: 'brown',
    tierLabel: 'University Dynasty',
    badge: '3x Best Physique',
    description: 'Unprecedented 3 consecutive years crowned Best Physique in Kakatiya University.',
  },

  // 3. SILVER TIER (Origin & Foundation)
  {
    title: 'Mr Warangal',
    year: '2008',
    tier: 'silver',
    tierLabel: 'District Silver',
    badge: 'District Foundation',
    description: 'Where the legacy began — undisputed champion of Warangal district.',
  },
];

export const AchievementsSection: React.FC = () => {
  // Mobile Stack swipe state
  const [mobileIndex, setMobileIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Subtle auto-advance for mobile cards after 1.5s initial delay: 2 seconds per card
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const initialDelay = setTimeout(() => {
      interval = setInterval(() => {
        setMobileIndex((prev) => (prev + 1) % RANKED_ACHIEVEMENTS.length);
      }, 2000); // exactly 2 seconds per card
    }, 1500); // starts after 1.5 seconds

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
      // Swipe right -> advance down into stack
      handleNextMobile();
    } else if (diff < -40) {
      // Swipe left
      handlePrevMobile();
    }
    setTouchStartX(null);
  };

  // Card styling helper based on Tier (Gold, Brown, Silver)
  const getCardStyle = (tier: RankedAchievement['tier']) => {
    switch (tier) {
      case 'gold':
        return {
          cardBg: 'bg-gradient-to-b from-amber-50/90 via-white to-white border-2 border-amber-400 shadow-md',
          badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
          iconBg: 'bg-amber-100 text-amber-600 border border-amber-300',
          accentColor: 'text-amber-800',
          tierName: 'Gold Champion',
        };
      case 'brown':
        return {
          cardBg: 'bg-gradient-to-b from-stone-100/90 via-white to-white border-2 border-amber-700/40 shadow-sm',
          badgeBg: 'bg-amber-900/10 text-amber-900 border border-amber-800/30',
          iconBg: 'bg-amber-800/10 text-amber-800 border border-amber-700/30',
          accentColor: 'text-amber-900',
          tierName: 'Classic Honor',
        };
      case 'silver':
        return {
          cardBg: 'bg-gradient-to-b from-slate-100/90 via-white to-white border-2 border-slate-300 shadow-sm',
          badgeBg: 'bg-slate-200 text-slate-800 border border-slate-300',
          iconBg: 'bg-slate-200 text-slate-700 border border-slate-300',
          accentColor: 'text-slate-700',
          tierName: 'Silver Origin',
        };
    }
  };

  return (
    <section id="achievements" className="py-12 sm:py-20 bg-white relative overflow-hidden border-t border-slate-200/80 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] sm:text-xs font-semibold mb-2 sm:mb-3">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>CHAMPION HALL OF FAME</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
            Titles & <span className="text-blue-600">Accolades</span>
          </h2>
          <p className="mt-1.5 text-slate-600 text-xs sm:text-sm">
            Gold Championships &bull; Classic Honors &bull; Silver Foundation
          </p>
        </div>

        {/* ── DESKTOP & TABLET: Infinite Moving Carousel (Right to Left Loop) ── */}
        <div className="hidden sm:block overflow-hidden relative w-full pb-4">
          {/* Subtle edge fades for smooth infinite flow */}
          <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Marquee Track: Double-rendered for 100% gapless infinite loop */}
          <div className="animate-marquee-rtl flex gap-5">
            {[...RANKED_ACHIEVEMENTS, ...RANKED_ACHIEVEMENTS].map((item, idx) => {
              const styles = getCardStyle(item.tier);
              return (
                <div
                  key={`${item.title}-${item.year}-${idx}`}
                  className={`w-[300px] flex-shrink-0 rounded-2xl p-5 flex flex-col justify-between ${styles.cardBg} transition-all duration-200 hover:-translate-y-1`}
                >
                  <div>
                    {/* Badge & Year */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-sans">
                        {item.tierLabel}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.year}
                      </span>
                    </div>

                    {/* Medal Icon & Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2.5 rounded-xl ${styles.iconBg} flex-shrink-0`}>
                        {item.tier === 'gold' ? (
                          <Crown className="w-5 h-5 text-amber-600" />
                        ) : item.tier === 'brown' ? (
                          <Trophy className="w-5 h-5 text-amber-800" />
                        ) : (
                          <Medal className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Waheed Khan</span>
                    <span className={`font-bold ${styles.accentColor}`}>{item.badge}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MOBILE PHONES: Subtle 2-Second Card Transition (Swipe or Auto-Advance) ── */}
        <div className="sm:hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="relative min-h-[240px] w-full">
            {RANKED_ACHIEVEMENTS.map((item, idx) => {
              const isCurrent = idx === mobileIndex;
              const styles = getCardStyle(item.tier);

              return (
                <div
                  key={`mobile-${item.title}-${idx}`}
                  className={`w-full rounded-2xl p-5 ${styles.cardBg} transition-all duration-500 ease-out absolute inset-0 flex flex-col justify-between ${
                    isCurrent
                      ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto z-10'
                      : 'opacity-0 translate-x-4 scale-[0.98] pointer-events-none z-0'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${styles.badgeBg}`}>
                        {item.tierLabel}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.year}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-2.5">
                      <div className={`p-2.5 rounded-xl ${styles.iconBg} flex-shrink-0`}>
                        {item.tier === 'gold' ? (
                          <Crown className="w-5 h-5 text-amber-600" />
                        ) : item.tier === 'brown' ? (
                          <Trophy className="w-5 h-5 text-amber-800" />
                        ) : (
                          <Medal className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] mt-2">
                    <span className="text-slate-400 font-medium">Coach Waheed Khan</span>
                    <span className={`font-bold ${styles.accentColor}`}>{item.badge}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Stack Swipe Buttons & Indicators */}
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5">
              {RANKED_ACHIEVEMENTS.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setMobileIndex(dotIdx)}
                  aria-label={`Go to card ${dotIdx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    dotIdx === mobileIndex
                      ? 'w-5 bg-blue-600'
                      : 'w-1.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMobile}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors"
                aria-label="Previous card"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMobile}
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm transition-colors"
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
