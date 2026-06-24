import React, { useEffect, useState } from 'react';
import {
    Users,
    AlertCircle,
    Lock,
    Eye,
    EyeOff,
    Banknote,
    Coins,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    UserCheck,
    MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActivityChart } from '../components/dashboard/ActivityChart';
import { HourlyTrafficChart } from '../components/dashboard/HourlyTrafficChart';
import {
    getDashboardStats,
    getRecentPayments,
    getCombinedRecentActivity,
    getRevenueData,
    getHourlyTrafficData,
    getInactiveMembers
} from '../lib/api/dashboard';


interface DashboardStats {
    activeMembers: number;
    expiringSoon: number;
    expiringSoonMembers?: any[];
    attendanceRate: number;
    monthlyRevenue: number;
    totalCollections: number;
    cashPayments: number;
    upiPayments: number;
    otherPayments: number;
    revenueTrend: number;
    avgPaymentAmount: number;
    totalTransactions: number;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(false);
    const [ownerPasswordInput, setOwnerPasswordInput] = useState('');
    const [showOwnerPassword, setShowOwnerPassword] = useState(false);
    const [ownerError, setOwnerError] = useState('');
    const [isExpiringHovered, setIsExpiringHovered] = useState(false);

    const [stats, setStats] = useState<DashboardStats>({
        activeMembers: 0,
        expiringSoon: 0,
        expiringSoonMembers: [],
        attendanceRate: 0,
        monthlyRevenue: 0,
        totalCollections: 0,
        cashPayments: 0,
        upiPayments: 0,
        otherPayments: 0,
        revenueTrend: 0,
        avgPaymentAmount: 0,
        totalTransactions: 0
    });
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [inactiveMembers, setInactiveMembers] = useState<any[]>([]);
    const [hourlyTraffic, setHourlyTraffic] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const getWhatsAppLink = (phone: string, text: string) => {
        let cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone) return '';
        if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone;
        }
        return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
    };



    useEffect(() => {
        if (!isOwnerUnlocked) {
            setLoading(false);
            return;
        }

        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const statsData = await getDashboardStats();
                const paymentsData = await getRecentPayments(10);
                const activityData = await getCombinedRecentActivity();
                const chartData = await getRevenueData();
                const inactiveData = await getInactiveMembers();
                const trafficData = await getHourlyTrafficData();

                setStats(statsData);
                setRecentPayments(paymentsData);
                setRecentActivities(activityData);
                setRevenueData(chartData);
                setInactiveMembers(inactiveData);
                setHourlyTraffic(trafficData);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [isOwnerUnlocked]);

    const handleOwnerUnlockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const expectedOwnerPassword = import.meta.env.VITE_OWNER_PASSWORD || 'iron';
        if (ownerPasswordInput === expectedOwnerPassword) {
            setIsOwnerUnlocked(true);
        } else {
            setOwnerError('Incorrect password. Access denied.');
        }
    };

    if (!isOwnerUnlocked) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center space-y-6">
                    <div className="inline-flex p-3 bg-indigo-50 rounded-xl border border-indigo-100 mb-2">
                        <Lock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Owner Access Required</h2>
                    <p className="text-sm text-slate-500">The dashboard contains financial reports and metrics. Please enter the owner password to proceed.</p>

                    {ownerError && (
                        <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">{ownerError}</p>
                    )}

                    <form onSubmit={handleOwnerUnlockSubmit} className="space-y-4">
                        <div className="relative">
                            <input
                                required
                                type={showOwnerPassword ? "text" : "password"}
                                value={ownerPasswordInput}
                                onChange={(e) => setOwnerPasswordInput(e.target.value)}
                                placeholder="Enter Owner Password"
                                className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-center font-medium text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 bg-transparent border-none outline-none cursor-pointer"
                                aria-label={showOwnerPassword ? "Hide password" : "Show password"}
                            >
                                {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
                        >
                            <span>Authenticate</span>
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Real-time business performance and operational summary.</p>
                </div>
            </div>



            {/* A. Overview Section */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Active Members */}
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Members</p>
                            <h3 className="text-2xl font-bold mt-2 text-gray-950">{stats.activeMembers}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Expiring Soon */}
                    <div
                        onMouseEnter={() => setIsExpiringHovered(true)}
                        onMouseLeave={() => setIsExpiringHovered(false)}
                        onClick={() => navigate('/members?filter=expiring')}
                        className="relative p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer"
                    >
                        <div>
                            <p className="text-sm font-medium text-gray-500">Expiring Soon (7d)</p>
                            <h3 className="text-2xl font-bold mt-2 text-gray-950">{stats.expiringSoon}</h3>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <AlertCircle className="w-6 h-6" />
                        </div>

                        {/* Hover Popover */}
                        {isExpiringHovered && stats.expiringSoonMembers && stats.expiringSoonMembers.length > 0 && (
                            <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 text-white text-xs rounded-lg shadow-xl p-4 z-50 border border-slate-800 space-y-2 pointer-events-auto">
                                <p className="font-bold border-b border-slate-800 pb-1.5 text-amber-400">Expiring Members</p>
                                <div className="space-y-1.5">
                                    {stats.expiringSoonMembers.slice(0, 5).map((m: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center gap-2">
                                            <span className="font-medium truncate max-w-[120px]">{m.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400">{m.daysRemaining} {m.daysRemaining === 1 ? 'day' : 'days'}</span>
                                                {m.phone && (
                                                    <a
                                                        href={(() => {
                                                            const msg = `⚡ *Hi ${m.name},*

🚨 *Your Iron Gym membership will expire soon.*

🏋️‍♂️ *Renew now to avoid any interruption in your workouts and gym access.*

💪 *Consistency is the key to results—keep the momentum going!*

🔥 *Iron Gym Team*`;
                                                            return getWhatsAppLink(m.phone, msg);
                                                        })()}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-emerald-400 hover:text-emerald-300 p-1 hover:bg-slate-800 rounded transition-colors flex items-center justify-center"
                                                        title="Send WhatsApp Alert"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {stats.expiringSoonMembers.length > 5 && (
                                    <div className="pt-1.5 border-t border-slate-800 text-[10px] text-indigo-400 font-bold text-right flex justify-between items-center">
                                        <span>+{stats.expiringSoonMembers.length - 5} more</span>
                                        <span>View All →</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Attendance Rate */}
                    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Attendance Rate Today</p>
                            <h3 className="text-2xl font-bold mt-2 text-gray-950">{stats.attendanceRate}%</h3>
                        </div>
                        <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                            <UserCheck className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* B. Financial Section */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-indigo-500" />
                    Financial Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Monthly Revenue (Gradient Accent) */}
                    <div className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-sm text-white flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                            <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Monthly Revenue</p>
                            <Banknote className="w-4 h-4 text-indigo-200" />
                        </div>
                        <h3 className="text-xl font-extrabold mt-3">₹{stats.monthlyRevenue.toLocaleString('en-IN')}</h3>
                    </div>

                    {/* Total Collections */}
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Collections</p>
                            <Coins className="w-4 h-4 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold mt-3 text-gray-900">₹{stats.totalCollections.toLocaleString('en-IN')}</h3>
                    </div>

                    {/* Cash Payments */}
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Cash Payments</p>
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        </div>
                        <h3 className="text-xl font-bold mt-3 text-gray-900">₹{stats.cashPayments.toLocaleString('en-IN')}</h3>
                    </div>

                    {/* UPI Payments */}
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">UPI Payments</p>
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        </div>
                        <h3 className="text-xl font-bold mt-3 text-gray-900">₹{stats.upiPayments.toLocaleString('en-IN')}</h3>
                    </div>

                    {/* Other Payment Methods */}
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Other Methods</p>
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        </div>
                        <h3 className="text-xl font-bold mt-3 text-gray-900">₹{stats.otherPayments.toLocaleString('en-IN')}</h3>
                    </div>
                </div>
            </div>

            {/* C. Revenue Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2">
                    <ActivityChart data={revenueData} />
                </div>

                {/* Trend & Metrics Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Analytics</h3>

                        {/* Revenue Trend */}
                        <div className="p-4 bg-slate-50 rounded-lg space-y-2 mb-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue Trend</p>
                            <div className="flex items-center gap-2">
                                {stats.revenueTrend >= 0 ? (
                                    <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded font-bold text-sm">
                                        <ArrowUpRight className="w-4 h-4" />
                                        <span>+{stats.revenueTrend}%</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded font-bold text-sm">
                                        <ArrowDownRight className="w-4 h-4" />
                                        <span>{stats.revenueTrend}%</span>
                                    </div>
                                )}
                                <span className="text-xs text-gray-500">vs last month's collections</span>
                            </div>
                        </div>

                        {/* Payment Method Breakdown progress bar */}
                        {(() => {
                            const total = stats.cashPayments + stats.upiPayments + stats.otherPayments || 1;
                            const upiPct = Math.round((stats.upiPayments / total) * 100);
                            const cashPct = Math.round((stats.cashPayments / total) * 100);
                            const otherPct = Math.max(0, 100 - upiPct - cashPct);
                            return (
                                <div className="space-y-3 mb-6 p-4 border border-slate-100 rounded-lg">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Collections Share</p>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                        <div style={{ width: `${upiPct}%` }} className="bg-indigo-500" title={`UPI: ${upiPct}%`} />
                                        <div style={{ width: `${cashPct}%` }} className="bg-amber-500" title={`Cash: ${cashPct}%`} />
                                        <div style={{ width: `${otherPct}%` }} className="bg-slate-400" title={`Other: ${otherPct}%`} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> UPI ({upiPct}%)</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Cash ({cashPct}%)</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span> Other ({otherPct}%)</span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Collection Metrics */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-500 font-medium">Average payment value</span>
                                <span className="font-bold text-gray-900">₹{stats.avgPaymentAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-500 font-medium">Transactions processed</span>
                                <span className="font-bold text-gray-900">{stats.totalTransactions} this month</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* C.2 Traffic and Retention Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <HourlyTrafficChart data={hourlyTraffic} />
                </div>

                {/* Inactive members / We Miss You */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Inactive Members</h3>
                        <p className="text-xs text-gray-500">Active plans with no check-ins in the last 10 days.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3 pr-1 custom-scrollbar">
                        {inactiveMembers.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 text-xs py-8">
                                All members are active and visiting!
                            </div>
                        ) : (
                            inactiveMembers.map((m: any) => (
                                <div key={m.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100/70 transition-colors">
                                    <div>
                                        <p className="font-semibold text-slate-800 text-xs">{m.name}</p>
                                        <p className="text-[10px] text-gray-500">
                                            {m.lastCheckIn ? `Last seen: ${m.lastCheckIn}` : 'Never checked in'}
                                        </p>
                                    </div>
                                    {m.phone && (
                                        <a
                                            href={getWhatsAppLink(m.phone, `Hello ${m.name}, we missed you at the gym! Hope to see you soon.`)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
                                        >
                                            <MessageSquare className="w-3 h-3" />
                                            <span>Nudge</span>
                                        </a>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* D. Recent Payments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Recent Payments</h2>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold">Latest 10 Transactions</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Member Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Payment Method</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {recentPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No recent payments.</td>
                                </tr>
                            ) : (
                                recentPayments.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm uppercase">
                                                    {p.members?.full_name?.charAt(0) || 'M'}
                                                </div>
                                                <span className="font-semibold text-gray-900">{p.members?.full_name || 'Deleted Member'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-950">
                                            ₹{Number(p.amount).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-600">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${p.method === 'cash' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                p.method === 'upi' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                    'bg-slate-50 text-slate-700 border border-slate-200'
                                                }`}>
                                                {p.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {p.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm max-w-[200px] truncate">
                                            {p.admin_note || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* E. Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">Chronological Timeline</span>
                </div>
                <div className="space-y-4">
                    {recentActivities.length === 0 ? (
                        <p className="text-gray-400 text-sm">No recent activity.</p>
                    ) : (
                        recentActivities.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0 hover:bg-slate-50/50 rounded-lg px-2 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100 shadow-inner">
                                    {item.avatar ? (
                                        <img src={item.avatar} alt={item.member} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm uppercase">
                                            {item.member.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-gray-900">{item.member}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.id.startsWith('checkin') ? 'bg-green-50 text-green-700 border border-green-200' :
                                            item.id.startsWith('renewal') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                            {item.id.startsWith('checkin') ? 'Check-In' :
                                                item.id.startsWith('renewal') ? 'Renewal' : 'Expiry'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-0.5">
                                        {item.action}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {item.id.startsWith('checkin') && item.phone && (
                                        <a
                                            href={getWhatsAppLink(item.phone, `Hello ${item.member}, you checked in successfully. Have a great workout!`)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-500 hover:text-emerald-600 p-1 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors flex items-center justify-center cursor-pointer"
                                            title="Send WhatsApp Confirmation"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </a>
                                    )}
                                    <div className="text-right text-xs text-gray-400 font-medium whitespace-nowrap">
                                        {item.time}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

