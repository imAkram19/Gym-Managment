import React, { useState } from 'react';
import {
  Search,
  Share2,
  Check,
  Crown,
  Trophy,
  Medal,
  Flame,
  Zap,
  Calendar,
  Shield,
  ArrowRight,
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

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const podiumTop3 = athletes.slice(0, 3);
  const podiumOrder = [
    podiumTop3[1], // 2nd (Silver)
    podiumTop3[0], // 1st (Gold)
    podiumTop3[2], // 3rd (Bronze)
  ].filter(Boolean);

  const maxVisits = Math.max(...athletes.slice(0, 5).map((a) => a.monthlyVisits || 1), 30);

  const handleShareRank = (athlete: PublicAthleteRank) => {
    const text = `🏆 I am ranked #${athlete.rank} out of ${totalAthletes} athletes at Iron Gym Warangal with a ${athlete.streak}-day unbroken streak! See the live leaderboard: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedId(athlete.id);
    setTimeout(() => setCopiedId(null), 2500);

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const getTierBadge = (tier: PublicAthleteRank['tier']) => {
    switch (tier) {
      case 'Titan':
        return {
          label: 'Titan Tier',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Crown,
        };
      case 'Beast':
        return {
          label: 'Beast Tier',
          bg: 'bg-slate-200 text-slate-800 border-slate-300',
          icon: Zap,
        };
      case 'Warrior':
        return {
          label: 'Warrior Tier',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Shield,
        };
      default:
        return {
          label: 'Rookie',
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          icon: Shield,
        };
    }
  };

  return (
    <section id="leaderboard" className="py-10 sm:py-24 bg-white border-b border-slate-200/80 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Live Broadcast Indicator */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] sm:text-[11px] font-mono text-slate-700 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE BIOMETRIC SYNC · {totalAthletes} REGISTERED</span>
            </div>
            <h2 className="text-xl sm:text-4xl font-medium tracking-tight text-slate-900 leading-tight">
              Live athlete leaderboard.
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Every turnstile check-in builds your workout streak and unlocks podium status. Track your standing among Warangal’s most disciplined lifters.
            </p>
          </div>

          {/* Gamified Filter Tabs (Horizontal Scroll on Mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap touch-pan-x">
            <button
              type="button"
              onClick={() => setFilterType('streaks')}
              className={`h-9 px-3.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 cursor-pointer ${
                filterType === 'streaks'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Streak Master</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('monthly')}
              className={`h-9 px-3.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 cursor-pointer ${
                filterType === 'monthly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Month Consistency</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('total')}
              className={`h-9 px-3.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 cursor-pointer ${
                filterType === 'total'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Century Club</span>
            </button>
          </div>
        </div>

        {/* ── Member Achievement Lookup & Reveal Card (Top, Below Filters) ── */}
        <div className="max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-[#fafafa] border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-mono text-slate-800 uppercase tracking-wider font-medium flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Lookup Your Personal Iron Rank</span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                Turnstile Synced
              </span>
            </div>

            {/* Input with 16px font-size to prevent iOS Safari auto-zoom */}
            <div className="relative flex items-center bg-white border border-slate-300 focus-within:border-slate-900 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 transition-colors shadow-xs">
              <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type member name (e.g. Rahul) or phone..."
                className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-base sm:text-xs outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="h-7 px-2 flex items-center justify-center text-xs text-slate-500 hover:text-slate-900 rounded active:scale-90 transition-transform cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Achievement Unlocked Reveal Card */}
            {searchResult && (
              <div className="mt-3 sm:mt-4 p-4 sm:p-5 rounded-xl bg-white border-2 border-slate-900 shadow-md animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900 text-amber-400 flex flex-col items-center justify-center font-mono font-bold leading-none flex-shrink-0">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">RANK</span>
                      <span className="text-base sm:text-lg text-white">#{searchResult.rank}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-medium text-slate-900">{searchResult.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium uppercase border border-slate-200">
                          {searchResult.tier}
                        </span>
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Active Member · Top {searchResult.percentile}%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleShareRank(searchResult)}
                    type="button"
                    className="w-full sm:w-auto h-10 sm:h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer shadow-xs"
                  >
                    {copiedId === searchResult.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedId === searchResult.id ? 'Copied Link' : 'Share Rank Card'}</span>
                  </button>
                </div>

                {/* Milestone Badge Banner */}
                <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-amber-900 truncate">
                    <Trophy className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span className="truncate">
                      {searchResult.rank <= 3
                        ? 'Podium Champion Badge Unlocked'
                        : searchResult.streak >= 10
                        ? '10+ Days Unbroken Discipline'
                        : 'Active Streak Builder'}
                    </span>
                  </div>
                  <span className="font-mono text-amber-700 font-bold flex-shrink-0 ml-2">{searchResult.streak}D STREAK</span>
                </div>

                {/* Consistency Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px] sm:text-xs">
                    <span className="text-slate-600 font-normal">Monthly Attendance</span>
                    <span className="font-mono text-slate-900 font-medium tabular-nums">
                      {searchResult.monthlyVisits} / 30 workouts ({Math.min(100, Math.round((searchResult.monthlyVisits / 26) * 100))}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((searchResult.monthlyVisits / 26) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {searchQuery && !searchResult && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                No member record found for "{searchQuery}". Ask at reception to sync your biometric turnstile profile.
              </div>
            )}
          </div>
        </div>

        {/* ── Olympic Pedestal Podium: 3 Side-by-Side Steps on Mobile & Desktop ── */}
        <div className="max-w-4xl mx-auto mb-10 sm:mb-14">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 items-end">
            {podiumOrder.map((athlete) => {
              const isFirst = athlete.rank === 1;
              const isSecond = athlete.rank === 2;

              return (
                <div
                  key={athlete.id}
                  className={`relative rounded-xl sm:rounded-2xl flex flex-col justify-between transition-all ${
                    isFirst
                      ? 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white border-2 border-amber-400 shadow-sm -translate-y-2 sm:-translate-y-4'
                      : isSecond
                      ? 'bg-white border sm:border-2 border-slate-300 shadow-xs sm:-translate-y-1'
                      : 'bg-white border sm:border-2 border-amber-700/20 shadow-xs'
                  }`}
                >
                  {/* Top Status & Rank Badge */}
                  <div className="p-2 sm:p-5 pb-2 text-center">
                    <div className="flex items-center justify-center mb-1.5 sm:mb-3">
                      <span
                        className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono uppercase tracking-wider border ${
                          isFirst
                            ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold'
                            : isSecond
                            ? 'bg-slate-200 text-slate-800 border-slate-300 font-medium'
                            : 'bg-amber-900/10 text-amber-900 border-amber-800/20 font-medium'
                        }`}
                      >
                        {isFirst ? (
                          <>
                            <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-950 flex-shrink-0" />
                            <span>1st</span>
                          </>
                        ) : isSecond ? (
                          <>
                            <Medal className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-700 flex-shrink-0" />
                            <span>2nd</span>
                          </>
                        ) : (
                          <>
                            <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-800 flex-shrink-0" />
                            <span>3rd</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Avatar Initials Circle */}
                    <div className="flex flex-col items-center text-center my-1 sm:my-2">
                      <div
                        className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-mono text-xs sm:text-lg font-bold mb-1 shadow-xs ${
                          isFirst
                            ? 'bg-amber-400 text-slate-950 ring-2 sm:ring-4 ring-amber-200'
                            : isSecond
                            ? 'bg-slate-800 text-white ring-2 sm:ring-4 ring-slate-100'
                            : 'bg-amber-900 text-amber-100 ring-2 sm:ring-4 ring-amber-100'
                        }`}
                      >
                        {athlete.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>

                      <h3 className="text-xs sm:text-base font-medium text-slate-900 tracking-tight truncate max-w-full px-1">
                        {athlete.name}
                      </h3>
                      <div className="hidden sm:block text-xs text-slate-500 mt-0.5 font-normal">
                        {isFirst ? 'Reigning Iron Leader' : 'Podium Contender'}
                      </div>
                    </div>

                    {/* Streak Info */}
                    <div className="mt-1.5 sm:mt-4 pt-1.5 sm:pt-3 border-t border-slate-100">
                      <div className="text-[11px] sm:text-sm font-bold text-slate-900 tabular-nums flex items-center justify-center gap-0.5">
                        <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>{athlete.streak}d</span>
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
                        {athlete.monthlyVisits} visits
                      </div>
                    </div>
                  </div>

                  {/* Physical Pedestal Base */}
                  <div
                    className={`py-1 sm:py-2 text-center rounded-b-xl sm:rounded-b-2xl font-mono font-bold text-[10px] sm:text-xs uppercase tracking-wider border-t ${
                      isFirst
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : isSecond
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-amber-900/5 text-amber-900 border-amber-800/10'
                    }`}
                  >
                    0{athlete.rank}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Top 5 Active Contenders Table with Touch Targets ── */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono text-slate-700 uppercase tracking-wider font-medium flex items-center gap-2">
              <span>Top 5 Gym Leaders</span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-500 font-normal hidden sm:inline">Recalculated upon turnstile check-in</span>
            </h3>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs divide-y divide-slate-100">
            {athletes.slice(0, 5).map((athlete) => {
              const tierStyle = getTierBadge(athlete.tier);
              const progressPct = Math.round((athlete.monthlyVisits / maxVisits) * 100);

              return (
                <div
                  key={athlete.id}
                  className="p-3 sm:p-5 flex items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors"
                >
                  {/* Left: Rank, Avatar, Name & Tier */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 ${
                        athlete.rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : athlete.rank === 2
                          ? 'bg-slate-200 text-slate-800'
                          : athlete.rank === 3
                          ? 'bg-amber-900/20 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      0{athlete.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-medium text-slate-900 truncate">{athlete.name}</span>
                        <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded border flex-shrink-0 ${tierStyle.bg}`}>
                          {athlete.tier}
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                        <span>{athlete.monthlyVisits} workouts this month</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Streak & Share Button */}
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    {/* Relative consistency indicator (Desktop only) */}
                    <div className="hidden md:flex flex-col items-end gap-1 w-28">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">Discipline Meter</div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-slate-900 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Streak badge */}
                    <div className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-900 flex items-center gap-1 tabular-nums">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{athlete.streak}d</span>
                    </div>

                    {/* Share action with 36px touch target */}
                    <button
                      type="button"
                      onClick={() => handleShareRank(athlete)}
                      title="Share achievement"
                      className="w-8 h-8 rounded-lg bg-slate-100 active:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                    >
                      {copiedId === athlete.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Live Note */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs text-slate-500 gap-1.5 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Biometric turnstiles online in Warangal</span>
            </div>
            <a
              href="#hero"
              className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium active:opacity-75"
            >
              <span>Train at Iron Gym to earn your rank</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
