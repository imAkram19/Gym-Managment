import { supabase } from '../supabase';
import type { Member, Subscription, Payment, Attendance } from '../../types';

export const getMembers = async (searchQuery: string = '', statusFilter: 'all' | 'active' | 'expired' | 'inactive' = 'all') => {
    let query = supabase.from('members').select('*').order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
    }

    if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Member[];
};

export const getMemberById = async (id: string) => {
    const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Member;
};

export const getMemberHistory = async (id: string) => {
    const [subscriptions, payments, attendance] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('member_id', id).order('start_date', { ascending: false }),
        supabase.from('payments').select('*').eq('member_id', id).order('date', { ascending: false }),
        supabase.from('attendance').select('*').eq('member_id', id).order('date', { ascending: false }),
    ]);

    return {
        subscriptions: subscriptions.data as Subscription[] || [],
        payments: payments.data as Payment[] || [],
        attendance: attendance.data as Attendance[] || [],
    };
};

export const createMemberWithSubscription = async (
    memberData: Omit<Member, 'id' | 'joinDate' | 'status' | 'created_at'>,
    subscriptionData: { planName: string; price: number; durationMonths: number; startDate: string },
    paymentData: { amount: number; method: string; adminNote?: string }
) => {
    // 1. Create Member
    const { data: member, error: memberError } = await supabase
        .from('members')
        .insert([{
            full_name: memberData.fullName,
            phone: memberData.phone,
            gender: memberData.gender,
            date_of_birth: memberData.dateOfBirth,
            address: memberData.address,
            info: memberData.info,
            status: 'active',
            join_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

    if (memberError) throw memberError;

    const memberId = member.id;

    // 2. Calculate End Date
    const startDate = new Date(subscriptionData.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + subscriptionData.durationMonths);

    // 3. Create Subscription
    const { error: subError } = await supabase
        .from('subscriptions')
        .insert([{
            member_id: memberId,
            plan_name: subscriptionData.planName,
            price: subscriptionData.price,
            start_date: subscriptionData.startDate,
            end_date: endDate.toISOString().split('T')[0],
            is_active: true
        }]);

    if (subError) {
        // ideally rollback member creation here, simplified for now
        console.error("Subscription creation failed", subError);
        throw subError;
    }

    // 4. Create Payment
    const { error: payError } = await supabase
        .from('payments')
        .insert([{
            member_id: memberId,
            amount: paymentData.amount,
            date: new Date().toISOString().split('T')[0],
            method: paymentData.method,
            admin_note: paymentData.adminNote,
        }]);

    if (payError) {
        console.error("Payment creation failed", payError);
        throw payError;
    }

    return member;
};

export const updateMember = async (id: string, updates: Partial<Member>) => {
    const { error } = await supabase.from('members').update({
        full_name: updates.fullName,
        phone: updates.phone,
        gender: updates.gender,
        date_of_birth: updates.dateOfBirth,
        address: updates.address,
        info: updates.info,
        status: updates.status,
    }).eq('id', id);

    if (error) throw error;
};
