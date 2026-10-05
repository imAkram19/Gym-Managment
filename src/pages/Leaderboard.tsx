import React, { useEffect, useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Crown,
  Zap,
  Search,
  MessageSquare,
  ExternalLink,
  Tv,
  X,
  Minimize2,
  RefreshCw,
  Sun,
  Moon,
  Clock,
  Award,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { getMemberAttendanceMetrics, type MemberAttendanceStat } from '../lib/api/attendance';
import { notify } from '../lib/toast';

type LeaderboardCategory = 'streaks' | 'monthly' | 'weekly' | 'allTime';

export const Leaderboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MemberAttendanceStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<LeaderboardCategory>('streaks');
  const [search, setSearch] = useState('');
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Fetch metrics once on mount — zero extra calls
  const loadMetrics = async (showToast = false) => {
    setLoading(true);
    try {
      const data = await getMemberAttendanceMetrics();
      setMetrics(data);
      if (showToast) {
        notify.success('Leaderboard updated with latest check-ins');
      }
    } catch (err) {
      console.error('Failed to load leaderboard metrics:', err);
      notify.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // Live clock for TV / Kiosk mode
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle ESC key to exit Kiosk mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isKioskMode) {
        setIsKioskMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isKioskMode]);

  // Client-side category sorting (ZERO Supabase calls on tab switch)
  const sortedMetrics = useMemo(() => {
    const list = [...metrics];
    switch (category) {
      case 'streaks':
        return list.sort((a, b) => {
          if (b.currentStreak !== a.currentStreak) {
            return b.currentStreak - a.currentStreak;
          }
          return b.totalVisits - a.totalVisits;
        });
      case 'monthly':
        return list.sort((a, b) => {
          if (b.visitsThisMonth !== a.visitsThisMonth) {
            return b.visitsThisMonth - a.visitsThisMonth;
          }
          return b.currentStreak - a.currentStreak;
        });
      case 'weekly':
        return list.sort((a, b) => {
          if (b.visitsThisWeek !== a.visitsThisWeek) {
            return b.visitsThisWeek - a.visitsThisWeek;
          }
          return b.currentStreak - a.currentStreak;
        });
      case 'allTime':
        return list.sort((a, b) => {
          if (b.totalVisits !== a.totalVisits) {
            return b.totalVisits - a.totalVisits;
          }
          return b.visitsThisMonth - a.visitsThisMonth;
        });
      default:
        return list;
    }
  }, [metrics, category]);

  // Client-side search filtering (ZERO Supabase calls on search)
  const filteredMetrics = useMemo(() => {
    if (!search.trim()) return sortedMetrics;
    const q = search.toLowerCase();
    return sortedMetrics.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q))
    );
  }, [sortedMetrics, search]);

  // Top 3 for the Podium
  const topThree = useMemo(() => {
    return filteredMetrics.slice(0, 3);
  }, [filteredMetrics]);

  // High-level quick stats
  const topStreakMember = useMemo(() => {
    return [...metrics].sort((a, b) => b.currentStreak - a.currentStreak)[0];
  }, [metrics]);

  const topMonthMember = useMemo(() => {
    return [...metrics].sort((a, b) => b.visitsThisMonth - a.visitsThisMonth)[0];
  }, [metrics]);

  const topWeekMember = useMemo(() => {
    return [...metrics].sort((a, b) => b.visitsThisWeek - a.visitsThisWeek)[0];
  }, [metrics]);

  // WhatsApp Shoutout Generator
  const getWhatsAppShoutoutUrl = (
    member: MemberAttendanceStat,
    rank: number
  ) => {
    if (!member.phone) return null;
    let cleanPhone = member.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
    let categoryText = '';
    if (category === 'streaks') {
      categoryText = `🔥 *${member.currentStreak}-Day Active Workout Streak*`;
    } else if (category === 'monthly') {
      categoryText = `🏆 *${member.visitsThisMonth} Sessions in ${currentMonthName}*`;
    } else if (category === 'weekly') {
      categoryText = `⚡ *${member.visitsThisWeek} Sessions This Week*`;
    } else {
      categoryText = `👑 *${member.totalVisits} Lifetime Workouts*`;
    }

    const msg = `🔥 *CHAMPION SHOUTOUT!* 🏆\n\nHey *${member.fullName}*!\n\nHuge congrats from the *Iron Gym Team*! 💪\nYou are currently ranked *#${rank}* on our Leaderboard!\n\n${categoryText}\n\nKeep pushing your limits and inspiring everyone at Iron Gym! 🏋️‍♂️🔥`;

    return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
      msg
    )}`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-amber-300">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-slate-200">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-amber-600">
          3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
        {rank}
      </span>
    );
  };

  const getScoreDisplay = (member: MemberAttendanceStat) => {
    switch (category) {
      case 'streaks':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 font-bold text-sm font-mono whitespace-nowrap">
            <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
            <span>{member.currentStreak}d Streak</span>
          </div>
        );
      case 'monthly':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 font-bold text-sm font-mono whitespace-nowrap">
            <Trophy className="w-4 h-4 text-blue-600" />
            <span>{member.visitsThisMonth} Visits</span>
          </div>
        );
      case 'weekly':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold text-sm font-mono whitespace-nowrap">
            <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <span>{member.visitsThisWeek} This Wk</span>
          </div>
        );
      case 'allTime':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 font-bold text-sm font-mono whitespace-nowrap">
            <Crown className="w-4 h-4 text-purple-600" />
            <span>{member.totalVisits} Total</span>
          </div>
        );
    }
  };

  return (
    <>
      {/* ─── KIOSK / RECEPTION TV MODE ─────────────────────────────────── */}
      {isKioskMode && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-6 overflow-y-auto">
          {/* TV Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  IRON GYM <span className="text-amber-400">LEADERBOARD</span>
                  <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Live Reception Display • Showing {category === 'streaks' ? 'Daily Workout Streaks' : category === 'monthly' ? 'Monthly Consistency' : category === 'weekly' ? 'Weekly Workouts' : 'All-Time Legends'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="font-mono text-xl font-bold text-emerald-400 tracking-wider">
                  {currentTime}
                </span>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Live Reception Desk
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsKioskMode(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Exit TV Mode (Esc)"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* TV Mode Podium */}
          {topThree.length >= 3 && (
            <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto w-full mb-8 items-end pt-4">
              {/* Rank 2 (Silver) */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 text-center flex flex-col items-center shadow-xl relative order-1">
                <div className="absolute -top-4 w-9 h-9 rounded-full bg-slate-300 text-slate-900 font-black text-sm flex items-center justify-center ring-4 ring-slate-900 shadow-md">
                  2
                </div>
                <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-300 font-black text-xl flex items-center justify-center mb-3 overflow-hidden ring-4 ring-slate-400/40">
                  {topThree[1].imageUrl ? (
                    <img src={topThree[1].imageUrl} alt={topThree[1].fullName} className="w-full h-full object-cover" />
                  ) : (
                    topThree[1].fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <h3 className="font-bold text-lg text-white truncate max-w-[200px]">
                  {topThree[1].fullName}
                </h3>
                <div className="mt-2 text-sm font-mono font-bold text-slate-300">
                  {category === 'streaks' && `🔥 ${topThree[1].currentStreak}d Streak`}
                  {category === 'monthly' && `🏆 ${topThree[1].visitsThisMonth} Visits`}
                  {category === 'weekly' && `⚡ ${topThree[1].visitsThisWeek} This Week`}
                  {category === 'allTime' && `👑 ${topThree[1].totalVisits} Total`}
                </div>
                <span className="text-xs text-slate-400 mt-1">
                  {topThree[1].totalVisits} lifetime sessions
                </span>
              </div>

              {/* Rank 1 (Gold - Elevated) */}
              <div className="bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-400 rounded-3xl p-6 text-center flex flex-col items-center shadow-2xl relative order-2 pb-8 transform -translate-y-4">
                <div className="absolute -top-6 w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 font-black text-lg flex items-center justify-center ring-4 ring-slate-950 shadow-xl">
                  👑
                </div>
                <div className="w-20 h-20 rounded-full bg-amber-400/20 text-amber-400 font-black text-2xl flex items-center justify-center mb-3 overflow-hidden ring-4 ring-amber-400/60 shadow-lg shadow-amber-400/20">
                  {topThree[0].imageUrl ? (
                    <img src={topThree[0].imageUrl} alt={topThree[0].fullName} className="w-full h-full object-cover" />
                  ) : (
                    topThree[0].fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 mb-1">
                  #1 Grand Champion
                </span>
                <h3 className="font-black text-xl text-white truncate max-w-[220px]">
                  {topThree[0].fullName}
                </h3>
                <div className="mt-2 text-lg font-mono font-black text-amber-400">
                  {category === 'streaks' && `🔥 ${topThree[0].currentStreak}d Streak`}
                  {category === 'monthly' && `🏆 ${topThree[0].visitsThisMonth} Visits`}
                  {category === 'weekly' && `⚡ ${topThree[0].visitsThisWeek} This Week`}
                  {category === 'allTime' && `👑 ${topThree[0].totalVisits} Total`}
                </div>
                <span className="text-xs text-slate-400 mt-1">
                  {topThree[0].totalVisits} lifetime sessions
                </span>
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="bg-slate-900/90 border border-amber-700/60 rounded-2xl p-5 text-center flex flex-col items-center shadow-xl relative order-3">
                <div className="absolute -top-4 w-9 h-9 rounded-full bg-amber-700 text-amber-100 font-black text-sm flex items-center justify-center ring-4 ring-slate-900 shadow-md">
                  3
                </div>
                <div className="w-16 h-16 rounded-full bg-slate-800 text-amber-600 font-black text-xl flex items-center justify-center mb-3 overflow-hidden ring-4 ring-amber-700/40">
                  {topThree[2].imageUrl ? (
                    <img src={topThree[2].imageUrl} alt={topThree[2].fullName} className="w-full h-full object-cover" />
                  ) : (
                    topThree[2].fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <h3 className="font-bold text-lg text-white truncate max-w-[200px]">
                  {topThree[2].fullName}
                </h3>
                <div className="mt-2 text-sm font-mono font-bold text-amber-300">
                  {category === 'streaks' && `🔥 ${topThree[2].currentStreak}d Streak`}
                  {category === 'monthly' && `🏆 ${topThree[2].visitsThisMonth} Visits`}
                  {category === 'weekly' && `⚡ ${topThree[2].visitsThisWeek} This Week`}
                  {category === 'allTime' && `👑 ${topThree[2].totalVisits} Total`}
                </div>
                <span className="text-xs text-slate-400 mt-1">
                  {topThree[2].totalVisits} lifetime sessions
                </span>
              </div>
            </div>
          )}

          {/* TV Mode Grid for Ranks 4-12 */}
          <div className="max-w-5xl mx-auto w-full flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Top Ranked Athletes
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMetrics.slice(3, 12).map((m, idx) => (
                <div
                  key={m.memberId}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold font-mono flex items-center justify-center shrink-0">
                      {idx + 4}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-white truncate">
                        {m.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {m.totalVisits} total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {category === 'streaks' && `${m.currentStreak}d`}
                      {category === 'monthly' && `${m.visitsThisMonth} visits`}
                      {category === 'weekly' && `${m.visitsThisWeek} visits`}
                      {category === 'allTime' && `${m.totalVisits} total`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── STANDARD DASHBOARD VIEW ────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Header with Title & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-2xs">
                <Trophy className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Leaderboard & Streaks
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Member attendance rankings, consistency streaks, and community hall of fame
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsKioskMode(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Open full-screen TV / Kiosk Mode for reception screens"
            >
              <Tv className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Reception TV Mode</span>
              <span className="sm:hidden">TV Mode</span>
            </button>

            <button
              type="button"
              onClick={() => loadMetrics(true)}
              disabled={loading}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Refresh Leaderboard"
              aria-label="Refresh Leaderboard"
            >
              <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* ── KPI HIGHLIGHT CARDS ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Streak Leader */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Top Active Streak</span>
              <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                {topStreakMember ? `${topStreakMember.currentStreak}d` : '0d'}
              </span>
              <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                {topStreakMember ? topStreakMember.fullName : 'No streaks active'}
              </p>
            </div>
          </div>

          {/* Monthly Leader */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Monthly MVP</span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                {topMonthMember ? `${topMonthMember.visitsThisMonth}` : '0'}
              </span>
              <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                {topMonthMember ? topMonthMember.fullName : 'No visits'}
              </p>
            </div>
          </div>

          {/* Weekly Grinder */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Weekly Top</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                {topWeekMember ? `${topWeekMember.visitsThisWeek}` : '0'}
              </span>
              <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                {topWeekMember ? topWeekMember.fullName : 'No visits'}
              </p>
            </div>
          </div>

          {/* Total Athletes Ranked */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Ranked Athletes</span>
              <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black font-mono text-slate-900 tabular-nums">
                {metrics.length}
              </span>
              <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">
                Active gym members
              </p>
            </div>
          </div>
        </div>

        {/* ── PODIUM (TOP 3 HALL OF FAME) ───────────────────────────────── */}
        {topThree.length >= 3 && !search.trim() && (
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                Hall of Fame Podium
              </span>
              <span className="text-xs font-medium text-slate-500">
                Top 3 in {category === 'streaks' ? 'Streaks' : category === 'monthly' ? 'This Month' : category === 'weekly' ? 'This Week' : 'All-Time'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Rank 2 (Silver) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 text-center flex flex-col items-center shadow-xs relative order-2 md:order-1 hover:border-slate-300 transition-all pt-6">
                {/* Avatar with Floating Silver #2 Badge */}
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-white z-10 font-mono">
                    2
                  </div>
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-700 font-black text-xl flex items-center justify-center overflow-hidden border-2 border-slate-300 shadow-2xs ring-4 ring-slate-100 shrink-0">
                    {topThree[1].imageUrl ? (
                      <img
                        src={topThree[1].imageUrl}
                        alt={topThree[1].fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      topThree[1].fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                <Link
                  to={`/members/${topThree[1].memberId}`}
                  className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-base truncate max-w-[200px]"
                >
                  {topThree[1].fullName}
                </Link>
                <div className="mt-2">{getScoreDisplay(topThree[1])}</div>
                <span className="text-xs text-slate-400 mt-1">
                  {topThree[1].totalVisits} lifetime sessions
                </span>

                {topThree[1].phone && (
                  <a
                    href={getWhatsAppShoutoutUrl(topThree[1], 2) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Kudos</span>
                  </a>
                )}
              </div>

              {/* Rank 1 (Gold - Center & Elevated) */}
              <div className="bg-gradient-to-b from-amber-500/10 via-white to-white border-2 border-amber-300 rounded-3xl p-6 text-center flex flex-col items-center shadow-md relative order-1 md:order-2 md:-translate-y-2 hover:border-amber-400 transition-all pt-7">
                {/* Avatar with Floating Crown */}
                <div className="relative mb-3 flex items-center justify-center">
                  {/* Floating 👑 Crown Badge */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 flex items-center justify-center shadow-md ring-2 ring-white text-sm z-10">
                    👑
                  </div>

                  {/* Main Avatar Circle */}
                  <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-800 font-black text-2xl flex items-center justify-center overflow-hidden border-4 border-amber-300 shadow-md ring-4 ring-amber-100/60 shrink-0">
                    {topThree[0].imageUrl ? (
                      <img
                        src={topThree[0].imageUrl}
                        alt={topThree[0].fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      topThree[0].fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-1">
                  #1 Grand Champion
                </span>
                <Link
                  to={`/members/${topThree[0].memberId}`}
                  className="font-black text-slate-900 hover:text-blue-600 transition-colors text-lg truncate max-w-[220px]"
                >
                  {topThree[0].fullName}
                </Link>
                <div className="mt-2">{getScoreDisplay(topThree[0])}</div>
                <span className="text-xs text-slate-400 mt-1">
                  {topThree[0].totalVisits} lifetime sessions
                </span>

                {topThree[0].phone && (
                  <a
                    href={getWhatsAppShoutoutUrl(topThree[0], 1) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Champion Kudos</span>
                  </a>
                )}
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 text-center flex flex-col items-center shadow-xs relative order-3 hover:border-slate-300 transition-all pt-6">
                {/* Avatar with Floating Bronze #3 Badge */}
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-white z-10 font-mono">
                    3
                  </div>
                  <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-900 font-black text-xl flex items-center justify-center overflow-hidden border-2 border-amber-300 shadow-2xs ring-4 ring-amber-50 shrink-0">
                    {topThree[2].imageUrl ? (
                      <img
                        src={topThree[2].imageUrl}
                        alt={topThree[2].fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      topThree[2].fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>

                <Link
                  to={`/members/${topThree[2].memberId}`}
                  className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-base truncate max-w-[200px]"
                >
                  {topThree[2].fullName}
                </Link>
                <div className="mt-2">{getScoreDisplay(topThree[2])}</div>
                <span className="text-xs text-slate-400 mt-1">
                  {topThree[2].totalVisits} lifetime sessions
                </span>

                {topThree[2].phone && (
                  <a
                    href={getWhatsAppShoutoutUrl(topThree[2], 3) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Kudos</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CATEGORY SELECTOR & SEARCH ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setCategory('streaks')}
              className={clsx(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
                category === 'streaks'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Streaks</span>
            </button>

            <button
              type="button"
              onClick={() => setCategory('monthly')}
              className={clsx(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
                category === 'monthly'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>This Month</span>
            </button>

            <button
              type="button"
              onClick={() => setCategory('weekly')}
              className={clsx(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
                category === 'weekly'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>This Week</span>
            </button>

            <button
              type="button"
              onClick={() => setCategory('allTime')}
              className={clsx(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
                category === 'allTime'
                  ? 'bg-white text-purple-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>All-Time</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search athlete..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── COMPLETE RANKINGS TABLE (DESKTOP) ─────────────────────────── */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Athlete</th>
                <th className="py-3 px-4 text-center">Active Streak</th>
                <th className="py-3 px-4 text-center">This Month</th>
                <th className="py-3 px-4 text-center">This Week</th>
                <th className="py-3 px-4 text-center">Total Sessions</th>
                <th className="py-3 px-4 text-center">Habit Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMetrics.map((member, index) => {
                const rank = index + 1;
                const shoutoutUrl = getWhatsAppShoutoutUrl(member, rank);

                return (
                  <tr
                    key={member.memberId}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">{getRankBadge(rank)}</div>
                    </td>

                    {/* Member */}
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/members/${member.memberId}`}
                        className="flex items-center gap-3 group/link min-w-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 overflow-hidden border border-blue-200 text-xs shadow-2xs">
                          {member.imageUrl ? (
                            <img
                              src={member.imageUrl}
                              alt={member.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            member.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 group-hover/link:text-blue-600 transition-colors truncate block">
                            {member.fullName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {member.phone || 'No phone'}
                          </span>
                        </div>
                      </Link>
                    </td>

                    {/* Active Streak */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold',
                          member.currentStreak >= 5
                            ? 'bg-orange-50 text-orange-600 border border-orange-200'
                            : member.currentStreak > 0
                            ? 'bg-amber-50 text-amber-700'
                            : 'text-slate-400'
                        )}
                      >
                        <Flame className={clsx('w-3.5 h-3.5', member.currentStreak > 0 ? 'fill-current' : 'opacity-30')} />
                        {member.currentStreak}d
                      </span>
                    </td>

                    {/* This Month */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-slate-800 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                        {member.visitsThisMonth}
                      </span>
                    </td>

                    {/* This Week */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-slate-800 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                        {member.visitsThisWeek}
                      </span>
                    </td>

                    {/* Total Visits */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {member.totalVisits}
                      </span>
                    </td>

                    {/* Habit Time */}
                    <td className="py-3.5 px-4 text-center">
                      {member.preferredTime ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {member.preferredTime === 'Morning' && <Sun className="w-3 h-3 text-amber-500" />}
                          {member.preferredTime === 'Evening' && <Moon className="w-3 h-3 text-indigo-500" />}
                          {member.preferredTime === 'Afternoon' && <Clock className="w-3 h-3 text-sky-500" />}
                          {member.preferredTime}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {shoutoutUrl && (
                          <a
                            href={shoutoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title={`Send Kudos on WhatsApp to ${member.fullName}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          to={`/members/${member.memberId}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg transition-colors cursor-pointer"
                          title="View member profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMetrics.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No athletes found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── MOBILE RANKINGS CARDS (MOBILE & TABLET) ───────────────────── */}
        <div className="lg:hidden space-y-3">
          {filteredMetrics.map((member, index) => {
            const rank = index + 1;
            const shoutoutUrl = getWhatsAppShoutoutUrl(member, rank);

            return (
              <div
                key={member.memberId}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col gap-3"
              >
                {/* Top: Rank badge + Avatar + Name + Current Metric Pill */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {getRankBadge(rank)}
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 overflow-hidden border border-blue-200 text-xs shadow-2xs">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={member.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        member.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/members/${member.memberId}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm truncate block"
                      >
                        {member.fullName}
                      </Link>
                      <p className="text-[11px] font-mono text-slate-400">
                        {member.phone || 'No phone'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">{getScoreDisplay(member)}</div>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 rounded-xl p-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Streak
                    </span>
                    <span className="font-mono font-bold text-orange-600 block mt-0.5">
                      {member.currentStreak}d
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Month
                    </span>
                    <span className="font-mono font-bold text-blue-600 block mt-0.5">
                      {member.visitsThisMonth}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Lifetime
                    </span>
                    <span className="font-mono font-bold text-slate-700 block mt-0.5">
                      {member.totalVisits}
                    </span>
                  </div>
                </div>

                {/* Mobile Bottom Actions: WhatsApp Kudos & Profile Link */}
                <div className="flex items-center gap-2 pt-1">
                  {shoutoutUrl && (
                    <a
                      href={shoutoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Shoutout</span>
                    </a>
                  )}
                  <Link
                    to={`/members/${member.memberId}`}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center justify-center cursor-pointer"
                    title="View member profile"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredMetrics.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200/80">
              No athletes found matching your search.
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default Leaderboard;
