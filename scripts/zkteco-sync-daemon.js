/**
 * ZKTeco K40 Biometric Sync Daemon
 * 
 * This background script runs locally on the reception PC inside the gym network.
 * It establishes a persistent socket connection to the ZKTeco K40 device,
 * listens for real-time scans, verifies member subscriptions in Supabase,
 * and records check-ins in the database.
 * 
 * Dependencies:
 *   npm install @supabase/supabase-js node-zklib dotenv
 */

const { createClient } = require('@supabase/supabase-js');
const ZKLib = require('node-zklib');
require('dotenv').config();

// 1. Configure Credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://djykxnhbvecvorxudxsz.supabase.co'; // Fallback to current config
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWt4bmhidmVjdm9yeHVkeHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjgxMjksImV4cCI6MjA4NDU0NDEyOX0.J44UOrtZ6ukIOW80qmex1-KjNHjX1J9C1HG2zLXDvrU';

const DEVICE_IP = process.env.ZK_DEVICE_IP || '192.168.1.201';
const DEVICE_PORT = parseInt(process.env.ZK_DEVICE_PORT || '4370', 10);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('==================================================');
console.log('       ZKTeco K40 Gym Sync Daemon Starting       ');
console.log('==================================================');
console.log(`Connecting to Supabase: ${SUPABASE_URL}`);
console.log(`Connecting to ZKTeco K40: ${DEVICE_IP}:${DEVICE_PORT}`);

// Helper to get today's date in YYYY-MM-DD
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Helper to get time in HH:MM:SS
function getCurrentTime() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

async function handleCheckIn(userId, timestamp) {
    const today = getTodayDate();
    const time = getCurrentTime();

    console.log(`\n[Scan Detected] Device User ID: ${userId} at ${timestamp}`);

    try {
        // 1. Look up Member Mapping
        const { data: enrollment, error: enrollError } = await supabase
            .from('biometric_enrollments')
            .select('member_id, members(full_name, status)')
            .eq('device_user_id', parseInt(userId, 10))
            .single();

        if (enrollError || !enroll) {
            console.warn(`[-] Unknown scan: Device User ID ${userId} is not enrolled in the system.`);
            
            // Log raw event as unknown user
            await supabase.from('biometric_attendance_logs').insert([{
                device_user_id: parseInt(userId, 10),
                scan_timestamp: timestamp || new Date().toISOString(),
                status: 'unknown_user',
                processed: true
            }]);
            return;
        }

        const memberId = enrollment.member_id;
        const memberName = enrollment.members?.full_name || 'Unknown';
        console.log(`[+] Mapped User ID ${userId} to Member: ${memberName}`);

        // 2. Validate Active Subscription
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('member_id', memberId)
            .eq('is_active', true)
            .gte('end_date', today)
            .limit(1);

        if (subError) throw subError;

        const hasActiveSubscription = subscription && subscription.length > 0;

        if (!hasActiveSubscription) {
            console.warn(`[X] Access Denied: Member ${memberName} does not have an active subscription.`);
            
            // Log denied sweep
            await supabase.from('biometric_attendance_logs').insert([{
                device_user_id: parseInt(userId, 10),
                scan_timestamp: timestamp || new Date().toISOString(),
                status: 'denied_no_plan',
                processed: true
            }]);
            return;
        }

        // 3. Prevent duplicate check-in for today
        const { data: existingCheckIn } = await supabase
            .from('attendance')
            .select('id')
            .eq('member_id', memberId)
            .eq('date', today)
            .maybeSingle();

        if (existingCheckIn) {
            console.log(`[!] Member ${memberName} is already checked in for today. Skipping double log.`);
            return;
        }

        // 4. Log Attendance
        const { error: insertError } = await supabase
            .from('attendance')
            .insert([{
                member_id: memberId,
                date: today,
                check_in_time: time,
                method: 'fingerprint'
            }]);

        if (insertError) throw insertError;

        // Log successful biometric audit record
        await supabase.from('biometric_attendance_logs').insert([{
            device_user_id: parseInt(userId, 10),
            scan_timestamp: timestamp || new Date().toISOString(),
            status: 'success',
            processed: true
        }]);

        console.log(`[✔] Access Granted: Checked in ${memberName} successfully at ${time}.`);

    } catch (err) {
        console.error('[-] Error handling check-in:', err.message);
    }
}

async function run() {
    let zkInstance = new ZKLib(DEVICE_IP, DEVICE_PORT, 10000, 4000);

    try {
        // Create Socket Connection to Hardware
        await zkInstance.createSocket();
        console.log('[+] Connected to ZKTeco K40 device successfully.');

        // Get Info
        const users = await zkInstance.getUsers();
        console.log(`[+] Retrieved ${users.data.length} users enrolled on device memory.`);

        // Listen for Real-Time scans
        console.log('[+] Listening for fingerprint scans on the device...');
        await zkInstance.getRealTimeLogs(async (err, log) => {
            if (err) {
                console.error('[-] Real-time log capture error:', err);
                return;
            }
            
            // Log structure: { userId: '105', attTime: '2026-06-23 19:10:00', ... }
            if (log && log.userId) {
                await handleCheckIn(log.userId, log.attTime);
            }
        });

    } catch (error) {
        console.error('[-] Connection to K40 device failed:', error.message);
        console.log('[*] Retrying in 10 seconds...');
        setTimeout(run, 10000);
    }
}

run();
