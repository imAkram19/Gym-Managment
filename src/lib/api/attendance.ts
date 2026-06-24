import { supabase } from '../supabase';

export const getTodaysAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('attendance')
        .select(`
            id,
            date,
            check_in_time,
            method,
            members (id, full_name, image_url, status, phone)
        `)
        .eq('date', today)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching today's attendance:", error);
        return [];
    }

    return data;
};

export const getMemberAttendanceHistory = async (memberId: string) => {
    const { data, error } = await supabase
        .from('attendance')
        .select('id, date, check_in_time, method')
        .eq('member_id', memberId)
        .order('date', { ascending: false })
        .order('check_in_time', { ascending: false });

    if (error) {
        console.error("Error fetching member attendance history:", error);
        return [];
    }
    return data;
};

export const checkInMember = async (identifier: string, method: 'manual' | 'fingerprint' = 'manual') => {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier);

    let query = supabase.from('members').select('id, full_name, status, deleted_at').is('deleted_at', null);
    if (isUuid) {
        query = query.eq('id', identifier);
    } else {
        query = query.eq('phone', identifier);
    }

    const { data: member, error: memberError } = await query.single();

    if (memberError || !member) {
        throw new Error("Member not found.");
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('member_id', member.id)
        .eq('is_active', true)
        .gte('end_date', today)
        .limit(1);

    if (subError) throw subError;

    const hasActiveSubscription = subscription && subscription.length > 0;

    if (!hasActiveSubscription) {
        throw new Error(`Access Denied: ${member.full_name} has no active subscription.`);
    }

    const { data: existingCheckIn } = await supabase
        .from('attendance')
        .select('id')
        .eq('member_id', member.id)
        .eq('date', today)
        .maybeSingle();

    if (existingCheckIn) {
        throw new Error(`Member ${member.full_name} is already checked in for today.`);
    }

    const { error: insertError } = await supabase
        .from('attendance')
        .insert([{
            member_id: member.id,
            date: today,
            check_in_time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            method: method
        }]);

    if (insertError) throw insertError;

    return { success: true, memberName: member.full_name, message: "Check-in Successful" };
};

// ─── Per-Member Attendance Metrics ────────────────────────────────────────────

export interface MemberAttendanceStat {
    memberId: string;
    fullName: string;
    imageUrl: string | null;
    phone: string | null;
    status: string;
    totalVisits: number;
    visitsThisMonth: number;
    visitsThisWeek: number;           // visits in the last 7 days (rolling)
    lastCheckIn: string | null;       // ISO date string YYYY-MM-DD
    daysSinceLastVisit: number | null;
    currentStreak: number;            // consecutive days ending today or yesterday
    avgVisitsPerWeek: number;
    preferredTime: string | null;     // e.g. "Morning", "Afternoon", "Evening"
    recentDates: string[];            // last 30 days visited
}

export const getMemberAttendanceMetrics = async (): Promise<MemberAttendanceStat[]> => {
    // Fetch all attendance records joined with active members (not deleted)
    const { data: records, error } = await supabase
        .from('attendance')
        .select(`
            member_id,
            date,
            check_in_time,
            members!inner (id, full_name, image_url, phone, status, deleted_at)
        `)
        .is('members.deleted_at', null)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching attendance metrics:', error);
        return [];
    }

    if (!records || records.length === 0) return [];

    // Group records by member
    const byMember = new Map<string, { member: any; dates: string[]; times: string[] }>();

    for (const r of records as any[]) {
        const m = r.members;
        if (!m) continue;
        if (!byMember.has(r.member_id)) {
            byMember.set(r.member_id, { member: m, dates: [], times: [] });
        }
        const entry = byMember.get(r.member_id)!;
        entry.dates.push(r.date);
        if (r.check_in_time) entry.times.push(r.check_in_time);
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // First day of current month
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    // 7 days ago
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // 30 days ago
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const stats: MemberAttendanceStat[] = [];

    for (const [memberId, { member, dates, times }] of byMember) {
        // Sort dates ascending for streak calc
        const sortedDates = [...new Set(dates)].sort();
        const lastCheckIn = sortedDates[sortedDates.length - 1] ?? null;

        // Days since last visit
        let daysSinceLastVisit: number | null = null;
        if (lastCheckIn) {
            const last = new Date(lastCheckIn);
            daysSinceLastVisit = Math.floor((today.getTime() - last.getTime()) / 86400000);
        }

        // Visits this month
        const visitsThisMonth = dates.filter(d => d >= monthStart).length;

        // Visits this week (rolling 7 days)
        const visitsThisWeek = dates.filter(d => d >= sevenDaysAgoStr).length;

        // Recent 30-day dates
        const recentDates = dates.filter(d => d >= thirtyDaysAgoStr);

        // Current streak (consecutive days from today backwards)
        let streak = 0;
        const dateSet = new Set(sortedDates);
        const cursor = new Date(today);
        // Start from today or yesterday
        if (!dateSet.has(todayStr)) cursor.setDate(cursor.getDate() - 1);
        while (true) {
            const s = cursor.toISOString().split('T')[0];
            if (!dateSet.has(s)) break;
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }

        // Avg visits per week (over last 4 weeks)
        const fourWeeksAgo = new Date(today);
        fourWeeksAgo.setDate(today.getDate() - 28);
        const fourWeeksAgoStr = fourWeeksAgo.toISOString().split('T')[0];
        const visitsIn4Weeks = dates.filter(d => d >= fourWeeksAgoStr).length;
        const avgVisitsPerWeek = parseFloat((visitsIn4Weeks / 4).toFixed(1));

        // Preferred time (from check_in_time HH:mm:ss)
        let preferredTime: string | null = null;
        if (times.length > 0) {
            const timeBuckets = { Morning: 0, Afternoon: 0, Evening: 0 };
            for (const t of times) {
                const hour = parseInt(t.split(':')[0], 10);
                if (hour >= 5 && hour < 12) timeBuckets.Morning++;
                else if (hour >= 12 && hour < 17) timeBuckets.Afternoon++;
                else timeBuckets.Evening++;
            }
            preferredTime = (Object.entries(timeBuckets).sort((a, b) => b[1] - a[1])[0][0]) as string;
        }

        stats.push({
            memberId,
            fullName: member.full_name,
            imageUrl: member.image_url,
            phone: member.phone,
            status: member.status,
            totalVisits: dates.length,
            visitsThisMonth,
            visitsThisWeek,
            lastCheckIn,
            daysSinceLastVisit,
            currentStreak: streak,
            avgVisitsPerWeek,
            preferredTime,
            recentDates,
        });
    }

    // Sort by total visits descending
    return stats.sort((a, b) => b.totalVisits - a.totalVisits);
};
