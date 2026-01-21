import { supabase } from '../supabase';

export const getTodaysAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];

    // We want the attendance records AND the member details
    const { data, error } = await supabase
        .from('attendance')
        .select(`
            id,
            date,
            check_in_time,
            method,
            members (id, full_name, image_url, status)
        `)
        .eq('date', today)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching today's attendance:", error);
        return [];
    }

    // Transform to a cleaner structure if needed, or return as is
    return data;
};

export const checkInMember = async (identifier: string, method: 'manual' | 'fingerprint' = 'manual') => {
    // 1. Find the member by ID or Phone
    // Check if identifier looks like UUID or Phone
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier);

    let query = supabase.from('members').select('id, full_name, status');
    if (isUuid) {
        query = query.eq('id', identifier);
    } else {
        query = query.eq('phone', identifier);
    }

    const { data: member, error: memberError } = await query.single();

    if (memberError || !member) {
        throw new Error("Member not found.");
    }

    // 2. Validate Active Subscription
    const today = new Date().toISOString().split('T')[0];
    const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('member_id', member.id)
        .eq('is_active', true)
        .gte('end_date', today) // Must expire today or later
        .limit(1);

    if (subError) throw subError;

    const hasActiveSubscription = subscription && subscription.length > 0;

    if (!hasActiveSubscription) {
        throw new Error(`Access Denied: ${member.full_name} has no active subscription.`);
    }

    // 3. Log Attendance
    // Check if identifying duplicate check-in
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
            check_in_time: new Date().toLocaleTimeString('en-GB', { hour12: false }), // HH:mm:ss
            method: method
        }]);

    if (insertError) throw insertError;

    return { success: true, memberName: member.full_name, message: "Check-in Successful" };
};
