export interface Member {
    id: string;
    full_name: string;
    phone: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    address?: string;
    weight?: number;
    height?: number;
    medical_notes?: string;
    member_id: string;
    joined_at: string;
    status: 'active' | 'expired' | 'expiring';
}

export interface Subscription {
    id: string;
    member_id: string;
    plan_type: string;
    price: number;
    start_date: string;
    end_date: string;
    created_at: string;
}

export interface Attendance {
    id: string;
    member_id: string;
    date: string;
    check_in_time: string;
    method: 'fingerprint' | 'manual';
}
