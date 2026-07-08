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
    const { data, error } = await supabase.rpc('get_member_attendance_metrics_rpc');

    if (error) {
        console.error('Error fetching attendance metrics via RPC:', error);
        return [];
    }

    return (data || []).map((m: any) => ({
        memberId: m.memberId,
        fullName: m.fullName,
        imageUrl: m.imageUrl,
        phone: m.phone,
        status: m.status,
        totalVisits: m.totalVisits,
        visitsThisMonth: m.visitsThisMonth,
        visitsThisWeek: m.visitsThisWeek,
        lastCheckIn: m.lastCheckIn,
        daysSinceLastVisit: m.daysSinceLastVisit,
        currentStreak: m.currentStreak,
        avgVisitsPerWeek: Number(m.avgVisitsPerWeek),
        preferredTime: m.preferredTime,
        recentDates: m.recentDates || []
    })).sort((a: any, b: any) => b.totalVisits - a.totalVisits);
};
