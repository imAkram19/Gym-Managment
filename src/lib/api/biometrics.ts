import { supabase } from '../supabase';
import type { BiometricDevice, BiometricEnrollment, BiometricAttendanceLog } from '../../types';

// Map database device to client BiometricDevice
const mapDevice = (data: any): BiometricDevice => ({
    id: data.id,
    name: data.name,
    ipAddress: data.ip_address,
    port: data.port,
    status: data.status,
    lastPing: data.last_ping,
    createdAt: data.created_at
});

// Fetch all registered biometric devices
export const getBiometricDevices = async (): Promise<BiometricDevice[]> => {
    const { data, error } = await supabase
        .from('biometric_devices')
        .select('*')
        .order('name');
    
    if (error) throw error;
    return (data || []).map(mapDevice);
};

// Add a new biometric device
export const createBiometricDevice = async (name: string, ipAddress: string, port: number) => {
    const { data, error } = await supabase
        .from('biometric_devices')
        .insert([{ name, ip_address: ipAddress, port }])
        .select()
        .single();
    
    if (error) throw error;
    return mapDevice(data);
};

// Delete a biometric device
export const deleteBiometricDevice = async (id: string) => {
    const { error } = await supabase
        .from('biometric_devices')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
};

// Fetch biometric enrollments mapping (includes member details)
export interface BiometricEnrollmentWithMember extends BiometricEnrollment {
    memberName: string;
    memberStatus: string;
}

export const getBiometricEnrollments = async (): Promise<BiometricEnrollmentWithMember[]> => {
    const { data, error } = await supabase
        .from('biometric_enrollments')
        .select(`
            *,
            members (
                full_name,
                status
            )
        `)
        .order('device_user_id', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map((enroll: any) => ({
        id: enroll.id,
        memberId: enroll.member_id,
        deviceUserId: enroll.device_user_id,
        enrolledAt: enroll.enrolled_at,
        syncStatus: enroll.sync_status || 'synced',
        memberName: enroll.members?.full_name || 'Unknown',
        memberStatus: enroll.members?.status || 'unknown'
    }));
};

// Fetch enrollment for a specific member
export const getEnrollmentByMemberId = async (memberId: string): Promise<BiometricEnrollment | null> => {
    const { data, error } = await supabase
        .from('biometric_enrollments')
        .select('*')
        .eq('member_id', memberId)
        .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    return {
        id: data.id,
        memberId: data.member_id,
        deviceUserId: data.device_user_id,
        enrolledAt: data.enrolled_at,
        syncStatus: data.sync_status || 'synced'
    };
};

// Enroll/link a member to a keypad ID
export const enrollMemberBiometrics = async (memberId: string, deviceUserId: number) => {
    const { data, error } = await supabase
        .from('biometric_enrollments')
        .insert([{ member_id: memberId, device_user_id: deviceUserId }])
        .select()
        .single();
    
    if (error) {
        if (error.code === '23505') {
            throw new Error(`Device User ID ${deviceUserId} is already enrolled to another member.`);
        }
        throw error;
    }
    return data;
};

// Unenroll/unlink a member's biometrics
export const deleteBiometricEnrollment = async (id: string) => {
    const { error } = await supabase
        .from('biometric_enrollments')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
};

// Fetch biometric scan logs
export interface BiometricAttendanceLogWithDevice extends BiometricAttendanceLog {
    deviceName?: string;
    memberName?: string;
}

export const getBiometricAttendanceLogs = async (limit = 100): Promise<BiometricAttendanceLogWithDevice[]> => {
    const { data, error } = await supabase
        .from('biometric_attendance_logs')
        .select(`
            *,
            biometric_devices (
                name
            )
        `)
        .order('scan_timestamp', { ascending: false })
        .limit(limit);
    
    if (error) throw error;

    // We also need to map the device_user_id to members if possible.
    // To avoid complex client-side joins, we can query enrollments and resolve names.
    const enrollments = await getBiometricEnrollments();
    const enrollmentMap = new Map(enrollments.map(e => [e.deviceUserId, e.memberName]));

    return (data || []).map((log: any) => ({
        id: log.id,
        deviceId: log.device_id,
        deviceUserId: log.device_user_id,
        scanTimestamp: log.scan_timestamp,
        processed: log.processed,
        status: log.status,
        deviceName: log.biometric_devices?.name || 'Local/Unknown',
        memberName: enrollmentMap.get(log.device_user_id) || 'Unknown User'
    }));
};

// Run the database status synchronization
export const syncMemberStatuses = async () => {
    const { error } = await supabase.rpc('sync_member_statuses');
    if (error) throw error;
};
