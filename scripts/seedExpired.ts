import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://djykxnhbvecvorxudxsz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWt4bmhidmVjdm9yeHVkeHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjgxMjksImV4cCI6MjA4NDU0NDEyOX0.J44UOrtZ6ukIOW80qmex1-KjNHjX1J9C1HG2zLXDvrU";

const supabase = createClient(supabaseUrl, supabaseKey);

const seedExpired = async () => {
    console.log('Seeding expired member...');

    // 1. Create Member
    const { data: member, error: memberError } = await supabase
        .from('members')
        .insert([{
            full_name: 'Expired Script User',
            phone: '1112223333',
            gender: 'male',
            date_of_birth: '1990-01-01',
            address: 'Script Address',
            status: 'expired',
            join_date: '2023-01-01'
        }])
        .select()
        .single();

    if (memberError) {
        console.error('Error creating member:', memberError);
        return;
    }

    console.log('Member created:', member.id);

    // 2. Create Expired Subscription
    const { error: subError } = await supabase
        .from('subscriptions')
        .insert([{
            member_id: member.id,
            plan_name: 'Expired Plan',
            price: 100,
            start_date: '2023-01-01',
            end_date: '2023-02-01', // Expired
            is_active: false // Should be inactive
        }]);

    if (subError) {
        console.error('Error creating subscription:', subError);
        return;
    }

    console.log('Expired subscription created.');
};

seedExpired();
