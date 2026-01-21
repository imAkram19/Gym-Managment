import { supabase } from '../supabase';

export interface SubscriptionWithMember {
    id: string;
    memberId: string;
    memberName: string;
    memberImage?: string;
    planName: string;
    price: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    remainingDays: number;
    status: 'active' | 'expired' | 'expiring';
}

export const getSubscriptions = async () => {
    const { data, error } = await supabase
        .from('subscriptions')
        .select(`
            *,
            members (
                full_name,
                image_url
            )
        `)
        .order('end_date', { ascending: false });

    if (error) throw error;

    return data.map((sub: any) => {
        const endDate = new Date(sub.end_date);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status: 'active' | 'expired' | 'expiring' = 'active';
        if (diffDays < 0) status = 'expired';
        else if (diffDays <= 7) status = 'expiring';

        if (!sub.is_active) status = 'expired';

        return {
            id: sub.id,
            memberId: sub.member_id,
            memberName: sub.members?.full_name || 'Unknown Member',
            memberImage: sub.members?.image_url,
            planName: sub.plan_name,
            price: sub.price,
            startDate: sub.start_date,
            endDate: sub.end_date,
            isActive: sub.is_active,
            remainingDays: diffDays,
            status
        };
    });
};
