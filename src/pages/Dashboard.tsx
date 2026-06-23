import React, { useEffect, useState } from 'react';
import { Users, CreditCard, TrendingUp, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ActivityChart } from '../components/dashboard/ActivityChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { getDashboardStats, getRecentActivity, getRevenueData } from '../lib/api/dashboard';

const Dashboard: React.FC = () => {
    const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(false);
    const [ownerPasswordInput, setOwnerPasswordInput] = useState('');
    const [showOwnerPassword, setShowOwnerPassword] = useState(false);
    const [ownerError, setOwnerError] = useState('');

    const [stats, setStats] = useState({ activeMembers: 0, expiringSoon: 0, monthlyRevenue: 0 });
    const [recentActivies, setRecentActivities] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOwnerUnlocked) {
            setLoading(false);
            return;
        }

        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const statsData = await getDashboardStats();
                const activityData = await getRecentActivity();
                const chartData = await getRevenueData();

                setStats(statsData);
                setRecentActivities(activityData);
                setRevenueData(chartData);
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
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Welcome back, here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Active Members"
                    value={stats.activeMembers}
                    icon={Users}
                    trend="+12%"
                    trendUp={true}
                />
                <StatsCard
                    title="Monthly Revenue"
                    value={`₹${stats.monthlyRevenue.toLocaleString('en-IN')}`}
                    icon={CreditCard}
                    trend="+5%"
                    trendUp={true}
                />
                <StatsCard
                    title="Expiring Soon"
                    value={stats.expiringSoon}
                    icon={AlertCircle}
                    color="bg-orange-50 border-orange-100"
                />
                <StatsCard
                    title="Attendance Rate"
                    value="85%"
                    icon={TrendingUp}
                />
            </div>

            {/* Charts & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ActivityChart data={revenueData} />
                </div>
                <div>
                    <RecentActivity activities={recentActivies} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
