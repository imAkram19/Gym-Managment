import { supabase } from '../supabase';

export const getPayments = async (startDate?: string, endDate?: string) => {
    let query = supabase
        .from('payments')
        .select(`
            id,
            amount,
            date,
            method,
            admin_note,
            members (id, full_name, image_url)
        `)
        .order('date', { ascending: false });

    if (startDate) {
        query = query.gte('date', startDate);
    }
    if (endDate) {
        query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
};
