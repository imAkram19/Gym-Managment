import { supabase } from '../supabase';

export const getDashboardStats = async () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Total Active Members
    const { count: activeMembers, error: membersError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null);

    if (membersError) console.error('Error fetching active members:', membersError);

    // 2. Members expiring soon (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    const { data: expiringSoonList, error: expiringError } = await supabase
        .from('subscriptions')
        .select(`
            id,
            end_date,
            members (
                full_name,
                phone,
                deleted_at
            )
        `)
        .eq('is_active', true)
        .lte('end_date', sevenDaysStr)
        .gte('end_date', todayStr)
        .order('end_date', { ascending: true });

    if (expiringError) console.error('Error fetching expiring subscriptions:', expiringError);

    const expiringSoonMembers = (expiringSoonList || [])
        .filter((sub: any) => sub.members && !sub.members.deleted_at)
        .map((sub: any) => {
            const endDate = new Date(sub.end_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endD = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            const startD = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const diffTime = endD.getTime() - startD.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            return {
                name: sub.members?.full_name || 'Unknown Member',
                phone: sub.members?.phone || '',
                daysRemaining: diffDays
            };
        });

    // 3. Attendance Rate Today
    const { count: todaysAttendanceCount, error: attError } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', todayStr);

    if (attError) console.error('Error fetching today\'s attendance:', attError);

    const activeCount = activeMembers || 0;
    const attendanceRate = activeCount > 0 ? Math.round(((todaysAttendanceCount || 0) / activeCount) * 100) : 0;

    // 4. Financial Calculations
    // A. Total Collections (All-time)
    const { data: allPayments, error: allPaymentsError } = await supabase
        .from('payments')
        .select('amount');

    if (allPaymentsError) console.error('Error fetching all-time payments:', allPaymentsError);
    const totalCollections = allPayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    // B. Monthly Financial Breakdown
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const { data: monthlyPayments, error: monthlyPaymentsError } = await supabase
        .from('payments')
        .select('amount, method')
        .gte('date', startOfMonth);

    if (monthlyPaymentsError) console.error('Error fetching monthly payments:', monthlyPaymentsError);

    const monthlyPaymentsData = monthlyPayments || [];
    const monthlyRevenue = monthlyPaymentsData.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const cashPayments = monthlyPaymentsData.filter(p => p.method === 'cash').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const upiPayments = monthlyPaymentsData.filter(p => p.method === 'upi').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const otherPayments = monthlyPaymentsData.filter(p => p.method !== 'cash' && p.method !== 'upi').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // C. Monthly Revenue Trend (vs last month)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    const { data: lastMonthPayments, error: lastMonthError } = await supabase
        .from('payments')
        .select('amount')
        .gte('date', startOfLastMonth)
        .lte('date', endOfLastMonth);

    if (lastMonthError) console.error('Error fetching last month payments:', lastMonthError);
    const lastMonthRevenue = lastMonthPayments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
    
    let revenueTrend = 0;
    if (lastMonthRevenue > 0) {
        revenueTrend = Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    }

    // D. Collection Metrics
    const totalTransactions = monthlyPaymentsData.length;
    const avgPaymentAmount = totalTransactions > 0 ? Math.round(monthlyRevenue / totalTransactions) : 0;

    return {
        activeMembers: activeCount,
        expiringSoon: expiringSoonMembers.length,
        expiringSoonMembers,
        attendanceRate,
        monthlyRevenue,
        totalCollections,
        cashPayments,
        upiPayments,
        otherPayments,
        revenueTrend,
        avgPaymentAmount,
        totalTransactions
    };
};

export const getRecentPayments = async (limit = 10) => {
    const { data, error } = await supabase
        .from('payments')
        .select(`
            id,
            amount,
            date,
            method,
            admin_note,
            members (id, full_name, image_url)
        `)
        .order('date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent payments:', error);
        return [];
    }

    return data;
};

export const getCombinedRecentActivity = async () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Fetch attendance check-ins
    const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
            id,
            date,
            check_in_time,
            created_at,
            members (full_name, image_url, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (attendanceError) console.error('Error fetching recent attendance:', attendanceError);

    // 2. Fetch renewals (recent subscriptions starting)
    const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
            id,
            plan_name,
            start_date,
            created_at,
            members (full_name, image_url, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (subError) console.error('Error fetching recent subscriptions:', subError);

    // 3. Fetch recent expiries (subscriptions ending)
    const { data: expiryData, error: expiryError } = await supabase
        .from('subscriptions')
        .select(`
            id,
            plan_name,
            end_date,
            members (full_name, image_url, phone)
        `)
        .lte('end_date', todayStr)
        .order('end_date', { ascending: false })
        .limit(10);

    if (expiryError) console.error('Error fetching recent expiries:', expiryError);

    const activities: any[] = [];

    // Map check-ins
    if (attendanceData) {
        attendanceData.forEach((item: any) => {
            if (!item.members) return;
            activities.push({
                id: `checkin-${item.id}`,
                member: item.members.full_name,
                avatar: item.members.image_url,
                phone: item.members.phone || '',
                action: 'checked in',
                time: `${item.date} ${item.check_in_time.slice(0, 5)}`,
                timestamp: new Date(item.created_at || `${item.date}T${item.check_in_time}`).getTime()
            });
        });
    }

    // Map renewals
    if (subscriptionData) {
        subscriptionData.forEach((item: any) => {
            if (!item.members) return;
            activities.push({
                id: `renewal-${item.id}`,
                member: item.members.full_name,
                avatar: item.members.image_url,
                phone: item.members.phone || '',
                action: `renewed membership (${item.plan_name})`,
                time: `${item.start_date}`,
                timestamp: new Date(item.created_at || `${item.start_date}T00:00:00`).getTime()
            });
        });
    }

    // Map expiries
    if (expiryData) {
        expiryData.forEach((item: any) => {
            if (!item.members) return;
            activities.push({
                id: `expiry-${item.id}`,
                member: item.members.full_name,
                avatar: item.members.image_url,
                phone: item.members.phone || '',
                action: `membership expired (${item.plan_name})`,
                time: `${item.end_date}`,
                timestamp: new Date(`${item.end_date}T23:59:59`).getTime()
            });
        });
    }

    // Sort combined activities by timestamp desc
    activities.sort((a, b) => b.timestamp - a.timestamp);

    // Limit to 10 items
    return activities.slice(0, 10);
};

// Fetch revenue for the last 7 days for the chart
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

export const getHourlyTrafficData = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: attendance, error } = await supabase
        .from('attendance')
        .select('check_in_time')
        .gte('date', startDate);

    if (error) {
        console.error('Error fetching hourly traffic data:', error);
        return [];
    }

    const hourlyCounts: { [key: number]: number } = {};
    for (let h = 5; h <= 22; h++) {
        hourlyCounts[h] = 0;
    }

    attendance?.forEach((item: any) => {
        if (!item.check_in_time) return;
        const hour = parseInt(item.check_in_time.split(':')[0], 10);
        if (hour >= 5 && hour <= 22) {
            hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
        }
    });

    return Object.keys(hourlyCounts).map(h => {
        const hourNum = parseInt(h, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum % 12 || 12;
        return {
            hour: `${displayHour} ${ampm}`,
            count: hourlyCounts[hourNum]
        };
    });
};

export const getInactiveMembers = async () => {
    const { data: inactiveCandidates, error } = await supabase
        .from('members')
        .select(`
            id,
            full_name,
            phone,
            join_date,
            status,
            deleted_at,
            attendance (
                date
            )
        `)
        .eq('status', 'active')
        .is('deleted_at', null);

    if (error) {
        console.error('Error fetching inactive members:', error);
        return [];
    }

    const tenDaysAgoTime = new Date().getTime() - (10 * 24 * 60 * 60 * 1000);

    const inactiveMembers = (inactiveCandidates || [])
        .map((m: any) => {
            const lastCheckIn = m.attendance && m.attendance.length > 0
                ? m.attendance.reduce((latest: string, current: any) => 
                    new Date(current.date) > new Date(latest) ? current.date : latest, '1970-01-01')
                : null;
            return {
                id: m.id,
                name: m.full_name,
                phone: m.phone || '',
                joinDate: m.join_date,
                lastCheckIn: lastCheckIn === '1970-01-01' ? null : lastCheckIn
            };
        })
        .filter((m: any) => {
            if (!m.lastCheckIn) {
                const joinDateTime = new Date(m.joinDate).getTime();
                return joinDateTime < tenDaysAgoTime;
            } else {
                const lastCheckInTime = new Date(m.lastCheckIn).getTime();
                return lastCheckInTime < tenDaysAgoTime;
            }
        });

    return inactiveMembers;
};


