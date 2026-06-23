export type MemberStatus = 'active' | 'inactive' | 'expired';

export interface Member {
    id: string;
    fullName: string;
    email?: string;
    phone: string;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    address?: string;
    info?: string; // Medical or fitness info
    joinDate: string;
    status: MemberStatus;
    imageUrl?: string;
}

export interface Subscription {
    id: string;
    memberId: string;
    planName: string; // e.g., "Monthly", "Annual"
    price: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface Payment {
    id: string;
    memberId: string;
    amount: number;
    date: string;
    method: 'cash' | 'upi' | 'card' | 'other';
    adminNote?: string;
}

export interface Attendance {
    id: string;
    memberId: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    method: 'manual' | 'qr' | 'fingerprint';
}

export interface BiometricDevice {
    id: string;
    name: string;
    ipAddress: string;
    port: number;
    status: 'online' | 'offline';
    lastPing?: string;
    createdAt?: string;
}

export interface BiometricEnrollment {
    id: string;
    memberId: string;
    deviceUserId: number;
    enrolledAt?: string;
}

export interface BiometricAttendanceLog {
    id: string;
    deviceId?: string;
    deviceUserId: number;
    scanTimestamp: string;
    processed: boolean;
    status: 'pending' | 'success' | 'denied_no_plan' | 'unknown_user' | 'failed';
}

