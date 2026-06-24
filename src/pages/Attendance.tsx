import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Flame, TrendingUp, Calendar, Clock, Search, BarChart2,
    AlertTriangle, User, Trophy, MessageSquare, RefreshCw,
    ArrowLeft, Eye, X, Activity, UserCheck
} from 'lucide-react';
import { getMemberAttendanceMetrics, getMemberAttendanceHistory } from '../lib/api/attendance';
import type { MemberAttendanceStat } from '../lib/api/attendance';
import { getHourlyTrafficData, getCombinedRecentActivity } from '../lib/api/dashboard';
import { HourlyTrafficChart } from '../components/dashboard/HourlyTrafficChart';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStreakColor(streak: number): string {
    if (streak === 0) return 'text-gray-400';
    if (streak <= 3) return 'text-amber-500';
    if (streak <= 7) return 'text-orange-500';
    return 'text-red-500';
}

function getAttendanceHealthColor(avg: number): { bg: string; text: string; label: string } {
    if (avg >= 4) return { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Excellent' };
    if (avg >= 2.5) return { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700', label: 'Good' };
    if (avg >= 1) return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Fair' };
    return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Low' };
}

const getWhatsAppLink = (phone: string, text: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return '';
    if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

function formatTime12h(timeStr: string | null): string {
    if (!timeStr) return '—';
    try {
        const parts = timeStr.split(':');
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${hours}:${minutes} ${ampm}`;
    } catch {
        return timeStr;
    }
}

function MiniHeatmap({ recentDates }: { recentDates: string[] }) {
    const dateSet = new Set(recentDates);
    const days: { iso: string; active: boolean }[] = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        days.push({ iso, active: dateSet.has(iso) });
    }

    return (
        <div className="grid grid-cols-7 gap-0.5" title="Last 28 days attendance visual map">
            {days.map((day) => (
                <div
                    key={day.iso}
                    title={day.iso + (day.active ? ' (Attended)' : ' (Missed)')}
                    className={`w-3.5 h-3.5 rounded-[3px] border-[0.5px] border-white/50 transition-colors ${day.active ? 'bg-indigo-500' : 'bg-slate-100'}`}
                />
            ))}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

const Attendance: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<MemberAttendanceStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'leaderboard' | 'traffic' | 'activity'>('all');

    // Single member selection states for detailed history view in right panel
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [memberHistory, setMemberHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Hourly traffic & Recent activity states
    const [hourlyTraffic, setHourlyTraffic] = useState<any[]>([]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [trafficLoaded, setTrafficLoaded] = useState(false);
    const [activityLoaded, setActivityLoaded] = useState(false);
    const [loadingExtra, setLoadingExtra] = useState(false);

    const loadData = async () => {
        try {
            const statData = await getMemberAttendanceMetrics();
            setStats(statData);
        } catch (error) {
            console.error("Failed to load attendance page data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Load member detailed check-in history when selected
    useEffect(() => {
        if (!selectedMemberId) {
            setMemberHistory([]);
            return;
        }
        setLoadingHistory(true);
        getMemberAttendanceHistory(selectedMemberId)
            .then(data => {
                setMemberHistory(data);
                setLoadingHistory(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingHistory(false);
            });
    }, [selectedMemberId]);

    // Load traffic / activity data dynamically based on active tab
    useEffect(() => {
        if (activeTab === 'traffic' && !trafficLoaded) {
            setLoadingExtra(true);
            getHourlyTrafficData()
                .then(data => {
                    setHourlyTraffic(data);
                    setTrafficLoaded(true);
                })
                .finally(() => setLoadingExtra(false));
        } else if (activeTab === 'activity' && !activityLoaded) {
            setLoadingExtra(true);
            getCombinedRecentActivity()
                .then(data => {
                    setRecentActivities(data);
                    setActivityLoaded(true);
                })
                .finally(() => setLoadingExtra(false));
        }
    }, [activeTab, trafficLoaded, activityLoaded]);

    const handleRefreshExtra = async () => {
        setLoadingExtra(true);
        try {
            if (activeTab === 'traffic') {
                const data = await getHourlyTrafficData();
                setHourlyTraffic(data);
            } else if (activeTab === 'activity') {
                const data = await getCombinedRecentActivity();
                setRecentActivities(data);
            }
        } catch (error) {
            console.error("Failed to refresh logs", error);
        } finally {
            setLoadingExtra(false);
        }
    };

    // Find details of the selected member from the loaded stats
    const selectedMemberStat = useMemo(() => {
        return stats.find(s => s.memberId === selectedMemberId) || null;
    }, [stats, selectedMemberId]);

    // ── Summary KPIs ──────────────────────────────────────────────────────────
    const summary = useMemo(() => {
        if (stats.length === 0) return null;
        const total = stats.length;
        const checkedInToday = stats.filter(s => s.daysSinceLastVisit === 0).length;
        const inactive = stats.filter(s => (s.daysSinceLastVisit ?? 999) > 10).length;
        const onStreak = stats.filter(s => s.currentStreak >= 3).length;
        const avgPerWeek = stats.reduce((acc, s) => acc + s.avgVisitsPerWeek, 0) / total;
        return { total, checkedInToday, inactive, onStreak, avgPerWeek: avgPerWeek.toFixed(1) };
    }, [stats]);

    // ── Filtered list ──────────────────────────────────────────────────────────
    const displayed = useMemo(() => {
        let list = [...stats];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s => s.fullName.toLowerCase().includes(q));
        }

        // Default sorting: total visits descending
        list.sort((a, b) => b.totalVisits - a.totalVisits);

        return list;
    }, [stats, search]);

    // Leaderboards
    const leaderboardData = useMemo(() => {
        const sortedByMonth = [...stats].sort((a, b) => b.visitsThisMonth - a.visitsThisMonth);
        const sortedByStreak = [...stats].sort((a, b) => b.currentStreak - a.currentStreak);
        const sortedByInactive = [...stats]
            .filter(s => s.lastCheckIn !== null)
            .sort((a, b) => (b.daysSinceLastVisit ?? 0) - (a.daysSinceLastVisit ?? 0));

        return {
            topMonthly: sortedByMonth.slice(0, 5),
            topStreak: sortedByStreak.filter(s => s.currentStreak > 0).slice(0, 5),
            mostInactive: sortedByInactive.slice(0, 5)
        };
    }, [stats]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-500 text-sm font-medium">Loading attendance metrics…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Metrics</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Track individual visit frequencies, streaks, hourly traffic patterns, and live activity streams.</p>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tracked Members</p>
                        <p className="text-3xl font-extrabold text-gray-900">{summary.total}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" /> Checked In Today
                        </p>
                        <p className="text-3xl font-extrabold text-emerald-600">{summary.checkedInToday}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-orange-500" /> On Streak (3d+)
                        </p>
                        <p className="text-3xl font-extrabold text-orange-500">{summary.onStreak}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('leaderboard')}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Inactive (10d+)
                        </p>
                        <p className="text-3xl font-extrabold text-red-500">{summary.inactive}</p>
                    </div>
                </div>
            )}

            {/* ── Sub Navigation Tabs ── */}
            <div className="flex border-b border-gray-200 gap-6">
                <button
                    onClick={() => { setActiveTab('all'); setSelectedMemberId(null); }}
                    className={`pb-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${activeTab === 'all' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    All Member Stats
                </button>
                <button
                    onClick={() => { setActiveTab('leaderboard'); setSelectedMemberId(null); }}
                    className={`pb-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${activeTab === 'leaderboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <span className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4" /> Leaderboards
                    </span>
                </button>
                <button
                    onClick={() => { setActiveTab('traffic'); setSelectedMemberId(null); }}
                    className={`pb-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${activeTab === 'traffic' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <span className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4" /> Hourly Gym Traffic
                    </span>
                </button>
                <button
                    onClick={() => { setActiveTab('activity'); setSelectedMemberId(null); }}
                    className={`pb-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${activeTab === 'activity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <span className="flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4" /> Recent Activity Logs
                    </span>
                </button>
            </div>

            {/* ─── TAB CONTENT RENDERING ─── */}

            {activeTab === 'leaderboard' && (
                /* ─── LEADERBOARD VIEW ─── */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top Monthly Attendees */}
                    <div className="bg-white rounded-xl border border-gray-150 shadow-sm p-6 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            <h3 className="font-bold text-gray-800">Most Visits (This Month)</h3>
                        </div>
                        <div className="space-y-3">
                            {leaderboardData.topMonthly.map((member, idx) => (
                                <div
                                    key={member.memberId}
                                    onClick={() => navigate(`/members/${member.memberId}`)}
                                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`w-5 font-bold text-xs ${idx === 0 ? 'text-amber-500 text-sm' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-gray-400'}`}>
                                            #{idx + 1}
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {member.imageUrl ? (
                                                <img src={member.imageUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-4 h-4 text-indigo-400" />
                                            )}
                                        </div>
                                        <p className="font-semibold text-xs text-gray-850 truncate">{member.fullName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-xs text-gray-900">{member.visitsThisMonth} visits</p>
                                        <p className="text-[9px] text-gray-400">Total: {member.totalVisits}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Streak Leaderboard */}
                    <div className="bg-white rounded-xl border border-gray-150 shadow-sm p-6 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                            <h3 className="font-bold text-gray-800">Consistency Streak</h3>
                        </div>
                        <div className="space-y-3">
                            {leaderboardData.topStreak.length === 0 ? (
                                <p className="text-gray-450 text-xs py-8 text-center">No active streaks today.</p>
                            ) : (
                                leaderboardData.topStreak.map((member, idx) => (
                                    <div
                                        key={member.memberId}
                                        onClick={() => navigate(`/members/${member.memberId}`)}
                                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="w-5 font-bold text-xs text-orange-500">
                                                #{idx + 1}
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {member.imageUrl ? (
                                                    <img src={member.imageUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 text-indigo-400" />
                                                )}
                                            </div>
                                            <p className="font-semibold text-xs text-gray-850 truncate">{member.fullName}</p>
                                        </div>
                                        <div className="text-right flex items-center gap-1.5">
                                            <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                                🔥 {member.currentStreak} days
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Most Inactive */}
                    <div className="bg-white rounded-xl border border-gray-150 shadow-sm p-6 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <h3 className="font-bold text-gray-800">Longest Inactive</h3>
                        </div>
                        <div className="space-y-3">
                            {leaderboardData.mostInactive.map((member) => (
                                <div
                                    key={member.memberId}
                                    onClick={() => navigate(`/members/${member.memberId}`)}
                                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-red-100">
                                            {member.imageUrl ? (
                                                <img src={member.imageUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-4 h-4 text-red-400" />
                                            )}
                                        </div>
                                        <p className="font-semibold text-xs text-gray-850 truncate">{member.fullName}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className="font-bold text-xs text-red-700">{member.daysSinceLastVisit}d ago</p>
                                            <p className="text-[9px] text-gray-400">{formatDate(member.lastCheckIn)}</p>
                                        </div>
                                        {member.phone && (
                                            <a
                                                href={getWhatsAppLink(member.phone, `Hi ${member.fullName}, we noticed you haven't visited the gym in a while. Hope everything is fine! We'd love to see you back on track.`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-600 rounded transition-colors flex items-center justify-center cursor-pointer"
                                                title="WhatsApp Nudge"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'traffic' && (
                /* ─── HOURLY GYM TRAFFIC VIEW ─── */
                <div className="bg-white rounded-xl border border-gray-150 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
                            <h3 className="font-bold text-gray-800">Hourly Gym Traffic (Last 30 Days)</h3>
                        </div>
                        <button
                            onClick={handleRefreshExtra}
                            disabled={loadingExtra}
                            className="p-1.5 hover:bg-slate-100 rounded text-gray-450 hover:text-indigo-650 cursor-pointer disabled:opacity-50 flex items-center gap-1 text-xs font-semibold"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingExtra ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>

                    {loadingExtra && hourlyTraffic.length === 0 ? (
                        <div className="py-20 text-center space-y-2">
                            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-gray-400">Loading traffic patterns...</p>
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                            <HourlyTrafficChart data={hourlyTraffic} />
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'activity' && (
                /* ─── RECENT ACTIVITY LOGS VIEW ─── */
                <div className="bg-white rounded-xl border border-gray-150 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-gray-800">Recent Activity Logs</h3>
                        </div>
                        <button
                            onClick={handleRefreshExtra}
                            disabled={loadingExtra}
                            className="p-1.5 hover:bg-slate-100 rounded text-gray-450 hover:text-indigo-650 cursor-pointer disabled:opacity-50 flex items-center gap-1 text-xs font-semibold"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingExtra ? 'animate-spin' : ''}`} />
                            <span>Refresh Logs</span>
                        </button>
                    </div>

                    {loadingExtra && recentActivities.length === 0 ? (
                        <div className="py-20 text-center space-y-2">
                            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-gray-400">Loading recent activities...</p>
                        </div>
                    ) : recentActivities.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 text-sm">
                            No recent check-ins or activity events recorded.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentActivities.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 hover:bg-slate-50/50 rounded-lg px-2 transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                                        {item.avatar ? (
                                            <img src={item.avatar} alt={item.member} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold text-xs uppercase">
                                                {item.member.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center flex-wrap gap-2">
                                            <span className="text-sm font-semibold text-gray-900 truncate">{item.member}</span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${item.id.startsWith('checkin') ? 'bg-green-50 text-green-700 border border-green-250' :
                                                item.id.startsWith('renewal') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                    'bg-red-50 text-red-700 border border-red-200'
                                                }`}>
                                                {item.id.startsWith('checkin') ? 'Check-In' :
                                                    item.id.startsWith('renewal') ? 'Renewal' : 'Expiry'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {item.action}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {item.id.startsWith('checkin') && item.phone && (
                                            <a
                                                href={getWhatsAppLink(item.phone, `Hello ${item.member}, you checked in successfully. Have a great workout!`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-emerald-600 hover:text-emerald-700 p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors flex items-center justify-center cursor-pointer"
                                                title="Send WhatsApp Confirmation"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        <div className="text-right text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                            {item.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'all' && (
                /* ─── ALL MEMBER VIEW ─── */
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    {/* LEFT / MAIN COLUMN: Stats & Member Cards Grid */}
                    <div className={selectedMemberId ? 'lg:col-span-3 space-y-4' : 'lg:col-span-4 space-y-4'}>
                        {/* Search and simple metadata bar */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search member stats…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-850 outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap hidden sm:block">
                                Showing {displayed.length} members
                            </div>
                        </div>

                        {/* Cards list */}
                        {displayed.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
                                <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-400 font-medium">No members found.</p>
                            </div>
                        ) : (
                            <div className={`grid gap-4 ${
                                selectedMemberId 
                                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                                  : 'grid-cols-1 md:grid-cols-3 xl:grid-cols-4'
                            }`}>
                                {displayed.map((s) => {
                                    const health = getAttendanceHealthColor(s.avgVisitsPerWeek);
                                    const streakColor = getStreakColor(s.currentStreak);
                                    const isInactive = (s.daysSinceLastVisit ?? 999) > 10;
                                    const isSelected = selectedMemberId === s.memberId;

                                    return (
                                        <div
                                            key={s.memberId}
                                            onClick={() => setSelectedMemberId(s.memberId)}
                                            className={`bg-white rounded-xl border p-5 hover:shadow-md hover:border-indigo-350 transition-all cursor-pointer space-y-4 relative flex flex-col justify-between ${
                                                isSelected ? 'ring-2 ring-indigo-500 border-transparent shadow-sm' : 'border-gray-100 shadow-sm'
                                            }`}
                                        >
                                            <div className="space-y-4">
                                                {/* Header */}
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {s.imageUrl ? (
                                                                <img src={s.imageUrl} alt={s.fullName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-4.5 h-4.5 text-indigo-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-xs text-gray-900 truncate">{s.fullName}</p>
                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${health.bg} ${health.text}`}>
                                                                {health.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1">
                                                        {isInactive && (
                                                            <span className="px-1.5 py-0.5 bg-red-50 border border-red-200 text-red-650 text-[9px] font-bold rounded-full">
                                                                Inactive
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/members/${s.memberId}`);
                                                            }}
                                                            className="p-1 hover:bg-slate-100 rounded text-slate-405 hover:text-indigo-650"
                                                            title="View Profile"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Frequency Counts */}
                                                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                                    <div className="bg-slate-50 rounded-lg py-1.5">
                                                        <p className="text-sm font-extrabold text-gray-900">{s.totalVisits}</p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase">Total</p>
                                                    </div>
                                                    <div className="bg-indigo-50/50 border border-indigo-100/30 rounded-lg py-1.5">
                                                        <p className="text-sm font-extrabold text-indigo-700">{s.visitsThisMonth}</p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase">Month</p>
                                                    </div>
                                                    <div className="bg-emerald-50/55 border border-emerald-100/30 rounded-lg py-1.5">
                                                        <p className="text-sm font-extrabold text-emerald-700">{s.visitsThisWeek}</p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase">Week</p>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-lg py-1.5">
                                                        <p className={`text-sm font-extrabold ${streakColor}`}>
                                                            {s.currentStreak > 0 ? `🔥 ${s.currentStreak}` : '—'}
                                                        </p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase">Streak</p>
                                                    </div>
                                                </div>

                                                {/* Details */}
                                                <div className="space-y-1 text-xs border-t border-gray-50 pt-2.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Avg visits / week</span>
                                                        <span className="font-bold text-gray-700">{s.avgVisitsPerWeek}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Last check-in</span>
                                                        <span className="font-semibold text-gray-700">
                                                            {formatDate(s.lastCheckIn)}
                                                            {s.daysSinceLastVisit !== null && s.daysSinceLastVisit > 0 && ` (${s.daysSinceLastVisit}d ago)`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mini Heatmap */}
                                            <div className="border-t border-gray-50 pt-2.5 mt-2.5 flex justify-center">
                                                <MiniHeatmap recentDates={s.recentDates} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE COLUMN: Only displayed once a member is selected */}
                    {selectedMemberId && selectedMemberStat && (
                        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-150 shadow-sm p-4 space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <ArrowLeft
                                        onClick={() => setSelectedMemberId(null)}
                                        className="w-4 h-4 text-gray-500 hover:text-indigo-655 cursor-pointer"
                                    />
                                    <h3 className="font-bold text-gray-800 text-sm">Attendance History</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedMemberId(null)}
                                    className="p-1 hover:bg-slate-100 rounded text-gray-400 hover:text-red-500 cursor-pointer"
                                    title="Close History"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Member Header Info */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-150/60 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {selectedMemberStat.imageUrl ? (
                                        <img src={selectedMemberStat.imageUrl} alt={selectedMemberStat.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-4 h-4 text-indigo-400" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-xs text-gray-850 truncate">{selectedMemberStat.fullName}</p>
                                    <p className="text-[10px] text-gray-505">
                                        Status: <span className={`font-semibold capitalize ${selectedMemberStat.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedMemberStat.status}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                <div className="bg-indigo-50 border border-indigo-100/50 rounded-lg p-2">
                                    <p className="text-base font-extrabold text-indigo-700">{selectedMemberStat.totalVisits}</p>
                                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wide">Days Attended</p>
                                </div>
                                <div className="bg-orange-50 border border-orange-100/50 rounded-lg p-2">
                                    <p className="text-base font-extrabold text-orange-700">
                                        {selectedMemberStat.currentStreak > 0 ? `🔥 ${selectedMemberStat.currentStreak}` : '0'}
                                    </p>
                                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wide">Current Streak</p>
                                </div>
                            </div>

                            {/* Detailed logs list */}
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Detailed Attendance Logs</p>
                                
                                {loadingHistory ? (
                                    <div className="py-10 text-center space-y-2">
                                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                        <p className="text-[10px] text-gray-400">Loading history logs...</p>
                                    </div>
                                ) : memberHistory.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-6 text-center">No history logs recorded.</p>
                                ) : (
                                    <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                                        {memberHistory.map((h) => (
                                            <div key={h.id} className="flex justify-between items-center p-2 bg-slate-50/50 border border-slate-100 rounded-lg">
                                                <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                                                    📅 {formatDate(h.date)}
                                                </span>
                                                <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded">
                                                    {formatTime12h(h.check_in_time)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    onClick={() => navigate(`/members/${selectedMemberId}`)}
                                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Member Profile</span>
                                </button>
                                <button
                                    onClick={() => setSelectedMemberId(null)}
                                    className="px-3 py-1.5 border border-gray-250 hover:bg-slate-50 text-gray-600 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Attendance;
