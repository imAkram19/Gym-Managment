import { supabase } from '../supabase';

export const getDashboardStats = async () => {
    // 1. Total Active Members
    const { count: activeMembers, error: membersError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

    if (membersError) console.error('Error fetching active members:', membersError);

    // 2. Members expiring soon (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { count: expiringSoon, error: expiringError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lte('end_date', sevenDaysFromNow.toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0]);

    if (expiringError) console.error('Error fetching expiring subscriptions:', expiringError);

    // 3. Total Revenue (This Month)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: payments, error: revenueError } = await supabase
        .from('payments')
        .select('amount')
        .gte('date', startOfMonth);

    if (revenueError) console.error('Error fetching revenue:', revenueError);

    const monthlyRevenue = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    return {
        activeMembers: activeMembers || 0,
        expiringSoon: expiringSoon || 0,
        monthlyRevenue: monthlyRevenue
    };
};

export const getRecentActivity = async () => {
    const { data, error } = await supabase
        .from('attendance')
        .select(`
            id,
            date,
            check_in_time,
            members (full_name, image_url)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching recent activity:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        member: item.members.full_name,
        avatar: item.members.image_url,
        action: 'checked in',
        time: `${item.date} ${item.check_in_time}`, // Simple formatting, can be improved
    }));
};

// Mock data generator for the chart until we have enough real data
// Fetch revenue for the last 7 days
export const getRevenueData = async () => {
    const today = new Date();
    const last7Days: string[] = [];
    const chartData: { name: string; revenue: number; dateStr: string }[] = [];

    // 1. Generate last 7 days array
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        last7Days.push(dateStr);
        chartData.push({ name: dayName, revenue: 0, dateStr });
    }

    // 2. Fetch payments from DB
    const startDate = last7Days[0];
    const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, date')
        .gte('date', startDate);

    if (error) {
        console.error('Error fetching revenue chart data:', error);
        return chartData.map(({ name, revenue }) => ({ name, revenue }));
    }

    // 3. Aggregate data
    payments?.forEach((payment: any) => {
        const paymentDate = payment.date; // YYYY-MM-DD
        const dayEntry = chartData.find(d => d.dateStr === paymentDate);
        if (dayEntry) {
            dayEntry.revenue += Number(payment.amount);
        }
    });

    // 4. Return formatted data
    return chartData.map(({ name, revenue }) => ({ name, revenue }));
};
