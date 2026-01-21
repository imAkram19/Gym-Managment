import React, { useEffect, useState } from 'react';
import { Users, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ActivityChart } from '../components/dashboard/ActivityChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { getDashboardStats, getRecentActivity, getRevenueData } from '../lib/api/dashboard';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({ activeMembers: 0, expiringSoon: 0, monthlyRevenue: 0 });
    const [recentActivies, setRecentActivities] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
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
    }, []);

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
                    value={`$${stats.monthlyRevenue}`}
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
