import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Crown,
  Search,
  Share2,
  Check,
} from 'lucide-react';
import { usePublicLeaderboard, type PublicAthleteRank } from '../usePublicLeaderboard';

export const MemberRankFinder: React.FC = () => {
  const {
    athletes,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    searchResult,
    totalAthletes,
  } = usePublicLeaderboard();

  const [copied, setCopied] = useState(false);

  // Top 3 Podium
  const podiumTop3 = athletes.slice(0, 3);
  const podiumOrder = [
    podiumTop3[1], // 2nd (Silver)
    podiumTop3[0], // 1st (Gold)
    podiumTop3[2], // 3rd (Bronze)
  ].filter(Boolean);

  const handleShareRank = (athlete: PublicAthleteRank) => {
    const text = `🔥 I am ranked #${athlete.rank} out of ${totalAthletes} athletes at Iron Gym Warangal with a ${athlete.streak}-day workout streak! 💪 Check where you stand at Iron Gym: ${window.location.origin}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <section id="leaderboard" className="py-12 sm:py-20 bg-slate-50/70 relative overflow-hidden border-t border-slate-200/80 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] sm:text-xs font-semibold mb-2 sm:mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            <span>REAL-TIME LEADERBOARD</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
            Where Do <span className="text-blue-600">You Stand?</span>
          </h2>
          <p className="mt-1.5 text-slate-600 text-xs sm:text-sm">
            Check your personal streak rank or view the gym’s top athletes.
          </p>
        </div>

        {/* Member Lookup Search Bar (Compact & Accessible) */}
        <div className="max-w-md mx-auto mb-6 sm:mb-10">
          <div className="relative flex items-center bg-white border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 py-1.5 sm:py-2 shadow-sm transition-all">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or phone..."
              className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 placeholder:text-xs text-xs sm:text-sm font-medium outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-slate-500 hover:text-slate-800 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded ml-1 font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Searched Athlete Card Reveal */}
          {searchResult && (
            <div className="mt-4 p-4 sm:p-6 rounded-2xl bg-white border-2 border-blue-500 shadow-md animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-sm">
                    #{searchResult.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base sm:text-lg font-black text-slate-900">{searchResult.name}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                        {searchResult.tier}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600">
                      Ranked <strong className="text-blue-600">#{searchResult.rank}</strong> of {totalAthletes} athletes
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleShareRank(searchResult)}
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Share WhatsApp'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500">Streak</div>
                  <div className="text-sm sm:text-base font-black text-amber-600 flex items-center justify-center gap-0.5">
                    <Flame className="w-3.5 h-3.5 fill-amber-600" />
                    <span>{searchResult.streak}d</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500">This Month</div>
                  <div className="text-sm sm:text-base font-black text-slate-900">
                    {searchResult.monthlyVisits} Visits
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500">All-Time</div>
                  <div className="text-sm sm:text-base font-black text-blue-600">
                    {searchResult.totalVisits}
                  </div>
                </div>
              </div>
            </div>
          )}

          {searchQuery && !searchResult && (
            <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-sm">
              No athlete found for "{searchQuery}". Ask at reception to sync your account.
            </div>
          )}
        </div>

        {/* Podium Top 3 — On Mobile: #1 (Gold) renders FIRST! On Desktop: Olympic middle #1 */}
        <div className="max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-end">
            {podiumOrder.map((athlete) => {
              const isFirst = athlete.rank === 1;
              const isSecond = athlete.rank === 2;

              // Ensures on mobile 1st place is #1 on top (order-1), 2nd is order-2, 3rd is order-3
              const orderClass = isFirst
                ? 'order-1 md:order-2'
                : isSecond
                ? 'order-2 md:order-1'
                : 'order-3 md:order-3';

              return (
                <div
                  key={athlete.id}
                  className={`relative rounded-2xl p-4 sm:p-5 text-center border transition-all ${orderClass} ${
                    isFirst
                      ? 'bg-gradient-to-b from-amber-50 via-white to-white border-2 border-amber-400 shadow-md md:-translate-y-3'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex justify-center mb-2.5">
                    <div
                      className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center text-base sm:text-lg font-black ${
                        isFirst
                          ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 ring-3 ring-amber-100'
                          : isSecond
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isFirst ? <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" /> : `#${athlete.rank}`}
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">{athlete.name}</h3>
                  <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                    {isFirst ? '🏆 1st Champion' : isSecond ? '🥈 2nd Place' : '🥉 3rd Place'}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-around text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-semibold">Streak</div>
                      <div className="font-black text-amber-600 flex items-center gap-0.5 justify-center mt-0.5">
                        <Flame className="w-3 h-3 fill-amber-600" />
                        <span>{athlete.streak}d</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-semibold">Month</div>
                      <div className="font-black text-slate-900 mt-0.5">{athlete.monthlyVisits} visits</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Board: TOP 5 ONLY as requested */}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-blue-600" />
              <span>Top 5 Leaders</span>
            </h3>

            {/* Filter buttons hidden on mobile as requested */}
            <div className="hidden md:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={() => setFilterType('streaks')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  filterType === 'streaks'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Streak 🔥
              </button>
              <button
                type="button"
                onClick={() => setFilterType('monthly')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  filterType === 'monthly'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly 📅
              </button>
              <button
                type="button"
                onClick={() => setFilterType('total')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  filterType === 'total'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All-Time ⚡
              </button>
            </div>
          </div>

          {/* Table displaying TOP 5 ONLY */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {athletes.slice(0, 5).map((athlete) => (
                <div
                  key={athlete.id}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        athlete.rank === 1
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : athlete.rank === 2
                          ? 'bg-slate-200 text-slate-800'
                          : athlete.rank === 3
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {athlete.rank}
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">{athlete.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {athlete.monthlyVisits} workouts this month
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="flex items-center gap-0.5 text-xs sm:text-sm font-black text-amber-600">
                        <Flame className="w-3.5 h-3.5 fill-amber-600" />
                        <span>{athlete.streak}d</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleShareRank(athlete)}
                      title="Share to WhatsApp"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-600"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 text-center text-[11px] text-slate-400 font-medium">
            Biometric check-ins update leaderboard ranks in real time.
          </div>
        </div>
      </div>
    </section>
  );
};
