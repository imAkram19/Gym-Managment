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

// Offline staleness threshold (10 minutes)
export const OFFLINE_STALE_THRESHOLD_MS = 10 * 60 * 1000;

export function isBiometricDeviceOnline(device?: BiometricDevice | null): boolean {
    if (!device) return false;
    if (device.status === 'offline') return false;
    if (!device.lastPing) return false;
    const elapsed = Date.now() - new Date(device.lastPing).getTime();
    return elapsed >= 0 && elapsed <= OFFLINE_STALE_THRESHOLD_MS;
}

export function formatLastPing(lastPing: string | undefined): string {
    if (!lastPing) return 'Never';
    const diffMs = Date.now() - new Date(lastPing).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
}

export function getDeduplicatedDevices(devices: BiometricDevice[]): {
    uniqueDevices: BiometricDevice[];
    primaryDevice: BiometricDevice | null;
    isPrimaryOnline: boolean;
    offlineCount: number;
} {
    const uniqueDevicesMap = new Map<string, BiometricDevice>();
    for (const d of devices) {
        const key = `${d.name}-${d.ipAddress}-${d.port}`;
        const existing = uniqueDevicesMap.get(key);
        if (!existing) {
            uniqueDevicesMap.set(key, d);
        } else {
            const newTime = d.lastPing ? new Date(d.lastPing).getTime() : 0;
            const existTime = existing.lastPing ? new Date(existing.lastPing).getTime() : 0;
            if (d.status === 'online' && existing.status !== 'online') {
                uniqueDevicesMap.set(key, d);
            } else if (newTime > existTime) {
                uniqueDevicesMap.set(key, d);
            }
        }
    }
    const uniqueDevices = Array.from(uniqueDevicesMap.values());
    const offlineDevices = uniqueDevices.filter(d => !isBiometricDeviceOnline(d));
    const primaryDevice = uniqueDevices.find(d => isBiometricDeviceOnline(d)) ?? uniqueDevices[0] ?? null;
    const isPrimaryOnline = isBiometricDeviceOnline(primaryDevice);

    return {
        uniqueDevices,
        primaryDevice,
        isPrimaryOnline,
        offlineCount: offlineDevices.length,
    };
}

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
    memberImage?: string | null;
}

export const getBiometricEnrollments = async (): Promise<BiometricEnrollmentWithMember[]> => {
    const { data, error } = await supabase
        .from('biometric_enrollments')
        .select(`
            *,
            members (
                full_name,
                status,
                image_url,
                deleted_at
            )
        `)
        .order('device_user_id', { ascending: true });
    
    if (error) throw error;
    
    return (data || [])
        .filter((enroll: any) => enroll.members && !enroll.members.deleted_at)
        .map((enroll: any) => ({
            id: enroll.id,
            memberId: enroll.member_id,
            deviceUserId: enroll.device_user_id,
            enrolledAt: enroll.enrolled_at,
            syncStatus: enroll.sync_status || 'synced',
            memberName: enroll.members?.full_name || 'Unknown',
            memberStatus: enroll.members?.status || 'unknown',
            memberImage: enroll.members?.image_url || null,
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

// Enroll/link a member to a keypad ID (upsert)
export const enrollMemberBiometrics = async (memberId: string, deviceUserId: number) => {
    const existing = await getEnrollmentByMemberId(memberId);
    
    if (existing) {
        // Update existing enrollment
        const { data, error } = await supabase
            .from('biometric_enrollments')
            .update({ 
                device_user_id: deviceUserId,
                sync_status: 'synced' // Reset to synced upon manual mapping
            })
            .eq('id', existing.id)
            .select()
            .single();
            
        if (error) {
            if (error.code === '23505') {
                throw new Error(`Device User ID ${deviceUserId} is already enrolled to another member.`);
            }
            throw error;
        }
        return data;
    } else {
        // Insert new enrollment
        const { data, error } = await supabase
            .from('biometric_enrollments')
            .insert([{ 
                member_id: memberId, 
                device_user_id: deviceUserId,
                sync_status: 'synced'
            }])
            .select()
            .single();
            
        if (error) {
            if (error.code === '23505') {
                throw new Error(`Device User ID ${deviceUserId} is already enrolled to another member.`);
            }
            throw error;
        }
        return data;
    }
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
    // Query only the mapping of device_user_id to member name to avoid downloading all enrollment columns.
    const { data: enrollData } = await supabase
        .from('biometric_enrollments')
        .select(`
            device_user_id,
            members!inner (
                full_name
            )
        `)
        .is('members.deleted_at', null);

    const enrollmentMap = new Map(
        (enrollData || []).map((e: any) => [e.device_user_id, e.members?.full_name || 'Unknown'])
    );

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

// Check if a Device User ID is already mapped to any member
export const checkDeviceUserIdMapping = async (deviceUserId: number): Promise<{ mapped: boolean; memberName?: string; memberStatus?: string } | null> => {
    const { data, error } = await supabase
        .from('biometric_enrollments')
        .select(`
            *,
            members (
                full_name,
                status
            )
        `)
        .eq('device_user_id', deviceUserId)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
        mapped: true,
        memberName: data.members?.full_name || 'Unknown',
        memberStatus: data.members?.status || 'unknown'
    };
};

export const resetBiometricTestData = async (keepMembers: boolean = true) => {
    const { error } = await supabase.rpc('reset_biometric_test_data', { keep_members: keepMembers });
    if (error) throw error;
};
