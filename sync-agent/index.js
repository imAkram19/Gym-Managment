/**
 * Standalone ZKTeco K40 Biometric Sync Agent
 * 
 * Can run in:
 * 1. Production Mode: persistent socket connection to the physical K40 device.
 * 2. Simulation Mode: opens a local HTTP server on port 4371 to receive mock scans.
 */

const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const express = require('express');
const ZKLib = require('node-zklib');
require('dotenv').config();

// 1. Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const DEVICE_IP = process.env.ZK_DEVICE_IP || '192.168.1.201';
const DEVICE_PORT = parseInt(process.env.ZK_DEVICE_PORT || '4370', 10);

const ZK_SIMULATE = process.env.ZK_SIMULATE === 'true';
const SIMULATOR_PORT = parseInt(process.env.SIMULATOR_PORT || '4371', 10);

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[-] Error: SUPABASE_URL and SUPABASE_KEY are required in environment.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let dbDevice = null; // Holds the registered device record from database
let zkInstance = null; // Holds the active ZKLib client instance

// Cache of users enrolled on the device
let deviceUsersCache = [];
let lastCacheRefreshTime = 0;

console.log('==================================================');
console.log('       ZKTeco K40 Gym Sync Agent Starting         ');
console.log('==================================================');
console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Simulate Mode: ${ZK_SIMULATE ? 'ENABLED (HTTP Simulator)' : 'DISABLED (Hardware Connection)'}`);

// Helper to get today's date in YYYY-MM-DD
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Helper to get time in HH:MM:SS
function getCurrentTime() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

// Helper to refresh device user list cache
async function refreshDeviceUsersCache(force = false) {
    const now = Date.now();
    // Cache for 30 seconds unless forced
    if (!force && deviceUsersCache.length > 0 && (now - lastCacheRefreshTime < 30000)) {
        return;
    }

    if (ZK_SIMULATE) {
        // In simulation mode, mock cache from database active enrollments
        try {
            const { data: enrollments } = await supabase
                .from('biometric_enrollments')
                .select('device_user_id, sync_status, members(status)');
            deviceUsersCache = (enrollments || [])
                .filter(e => e.members?.status === 'active' && e.sync_status === 'synced')
                .map(e => ({ userId: String(e.device_user_id), uid: e.device_user_id }));
            lastCacheRefreshTime = now;
        } catch (err) {
            console.error('[-] Failed to refresh simulation user cache:', err.message);
        }
        return;
    }

    try {
        if (!zkInstance) return;
        const usersResult = await zkInstance.getUsers();
        if (usersResult && usersResult.data) {
            deviceUsersCache = usersResult.data;
            lastCacheRefreshTime = now;
            console.log(`[Cache] Refreshed device users cache. Found ${deviceUsersCache.length} users.`);
        }
    } catch (err) {
        console.error('[-] Failed to retrieve users from device for cache:', err.message || err);
    }
}

// Helper to delete user from device memory
async function deleteUserFromDevice(userId) {
    console.log(`[Device Control] Attempting to delete user ID ${userId} from device...`);
    if (ZK_SIMULATE) {
        console.log(`[Simulator] Mock deleting user ID ${userId} from device.`);
        // Remove from simulation cache
        deviceUsersCache = deviceUsersCache.filter(u => parseInt(u.userId, 10) !== parseInt(userId, 10));
        return true;
    }

    try {
        if (!zkInstance) throw new Error('ZK device not connected.');
        
        // Find user in cache to get their uid
        await refreshDeviceUsersCache();
        const deviceUser = deviceUsersCache.find(u => parseInt(u.userId, 10) === parseInt(userId, 10));
        if (!deviceUser) {
            console.log(`[-] User ID ${userId} not found on device memory cache.`);
            return true; // Already deleted/not present
        }

        const uid = deviceUser.uid;
        const payload = Buffer.alloc(2);
        payload.writeUInt16LE(uid, 0);

        // Command code 18 is CMD_DELETE_USER
        await zkInstance.executeCmd(18, payload);
        console.log(`[✔] Successfully deleted User ID ${userId} (UID: ${uid}) from device memory.`);
        
        // Remove from cache
        deviceUsersCache = deviceUsersCache.filter(u => parseInt(u.userId, 10) !== parseInt(userId, 10));
        return true;
    } catch (err) {
        console.error(`[-] Failed to delete user ID ${userId} from device:`, err.message || err);
        return false;
    }
}

// Biometric enrollment status sync loop
async function syncBiometricEnrollments() {
    try {
        // Query enrollments that need actions
        const { data: enrollments, error } = await supabase
            .from('biometric_enrollments')
            .select('id, device_user_id, sync_status, member_id')
            .in('sync_status', ['needs_deletion', 'needs_enrollment']);

        if (error) throw error;
        if (!enrollments || enrollments.length === 0) return;

        for (const enrollment of enrollments) {
            const userId = enrollment.device_user_id;
            
            if (enrollment.sync_status === 'needs_deletion') {
                const deleted = await deleteUserFromDevice(userId);
                if (deleted) {
                    const { error: updateErr } = await supabase
                        .from('biometric_enrollments')
                        .update({ sync_status: 'deleted' })
                        .eq('id', enrollment.id);
                    if (updateErr) console.error('[-] Failed to update sync_status to deleted:', updateErr.message);
                }
            } else if (enrollment.sync_status === 'needs_enrollment') {
                // Check if user is now enrolled on device memory
                await refreshDeviceUsersCache(true); // force refresh cache to look for new enrollments
                const isEnrolled = deviceUsersCache.some(u => parseInt(u.userId, 10) === parseInt(userId, 10));
                if (isEnrolled) {
                    console.log(`[Sync] Detected re-enrollment for User ID ${userId} on device.`);
                    const { error: updateErr } = await supabase
                        .from('biometric_enrollments')
                        .update({ sync_status: 'synced' })
                        .eq('id', enrollment.id);
                    if (updateErr) console.error('[-] Failed to update sync_status to synced:', updateErr.message);
                }
            }
        }
    } catch (err) {
        console.error('[-] Error syncing biometric enrollments:', err.message);
    }
}

// 2. Self-register device and handle pings
async function initDeviceConnection() {
    try {
        // Query if device exists with this IP address
        const { data: existingDevice, error } = await supabase
            .from('biometric_devices')
            .select('*')
            .eq('ip_address', DEVICE_IP)
            .maybeSingle();

        if (error) throw error;

        if (existingDevice) {
            dbDevice = existingDevice;
            console.log(`[+] Registered device found in DB: "${dbDevice.name}" (ID: ${dbDevice.id})`);
        } else {
            // Create a new device entry
            const deviceName = ZK_SIMULATE ? 'Simulated Dev K40' : 'Hyderabad Gym Main K40';
            const { data: newDevice, error: createError } = await supabase
                .from('biometric_devices')
                .insert([{
                    name: deviceName,
                    ip_address: DEVICE_IP,
                    port: DEVICE_PORT,
                    status: 'offline'
                }])
                .select()
                .single();

            if (createError) throw createError;
            dbDevice = newDevice;
            console.log(`[+] Created new device record in DB: "${dbDevice.name}" (ID: ${dbDevice.id})`);
        }

        // Set initial heartbeat status
        await updateHeartbeat('online');

        // Setup periodic heartbeat every 30 seconds
        setInterval(async () => {
            await updateHeartbeat('online');
        }, 30000);

    } catch (err) {
        console.error('[-] Error initializing device in database:', err.message);
    }
}

async function updateHeartbeat(status) {
    if (!dbDevice) return;
    try {
        const { error } = await supabase
            .from('biometric_devices')
            .update({
                status: status,
                last_ping: new Date().toISOString()
            })
            .eq('id', dbDevice.id);

        if (error) throw error;
    } catch (err) {
        console.error('[-] Failed to update device heartbeat in database:', err.message);
    }
}

// 3. Central check-in handler
async function handleCheckIn(userId, timestamp) {
    const today = getTodayDate();
    const time = getCurrentTime();
    const parsedUserId = parseInt(userId, 10);

    console.log(`\n[Scan Detected] Device User ID: ${parsedUserId} at ${timestamp}`);

    try {
        // 1. Look up Member Mapping
        const { data: enrollment, error: enrollError } = await supabase
            .from('biometric_enrollments')
            .select('member_id, members(full_name, status)')
            .eq('device_user_id', parsedUserId)
            .maybeSingle();

        if (enrollError || !enrollment) {
            console.warn(`[-] Unknown scan: Device User ID ${parsedUserId} is not enrolled in the system.`);
            
            // Log raw event as unknown user
            await supabase.from('biometric_attendance_logs').insert([{
                device_id: dbDevice ? dbDevice.id : null,
                device_user_id: parsedUserId,
                scan_timestamp: timestamp || new Date().toISOString(),
                status: 'unknown_user',
                processed: true
            }]);
            return { success: false, reason: 'unknown_user', message: `Device User ID ${parsedUserId} is not enrolled.` };
        }

        const memberId = enrollment.member_id;
        const memberName = enrollment.members?.full_name || 'Unknown';
        console.log(`[+] Mapped User ID ${parsedUserId} to Member: ${memberName}`);

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
                device_id: dbDevice ? dbDevice.id : null,
                device_user_id: parsedUserId,
                scan_timestamp: timestamp || new Date().toISOString(),
                status: 'denied_no_plan',
                processed: true
            }]);
            return { success: false, reason: 'denied_no_plan', message: `Member ${memberName} has no active subscription.` };
        }

        // Trigger door relay via remote unlock command if enabled
        if (process.env.ZK_REMOTE_UNLOCK === 'true' && zkInstance && !ZK_SIMULATE) {
            try {
                // Command code 102 corresponds to CMD_UNLOCK
                await zkInstance.executeCmd(102, '');
                console.log(`[+] Sent remote unlock command to K40 relay for ${memberName}.`);
            } catch (unlockErr) {
                console.error('[-] Failed to trigger remote door unlock relay:', unlockErr.message || unlockErr);
            }
        }

        // 3. Prevent duplicate check-in for today
        const { data: existingCheckIn } = await supabase
            .from('attendance')
            .select('id')
            .eq('member_id', memberId)
            .eq('date', today)
            .maybeSingle();

        if (existingCheckIn) {
            console.log(`[!] Member ${memberName} is already checked in for today. Skipping duplicate log.`);
            
            // Log successful biometric audit record even if check-in exists
            await supabase.from('biometric_attendance_logs').insert([{
                device_id: dbDevice ? dbDevice.id : null,
                device_user_id: parsedUserId,
                scan_timestamp: timestamp || new Date().toISOString(),
                status: 'success',
                processed: true
            }]);
            return { success: true, message: `Member ${memberName} is already checked in. Logged scan.` };
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
            device_id: dbDevice ? dbDevice.id : null,
            device_user_id: parsedUserId,
            scan_timestamp: timestamp || new Date().toISOString(),
            status: 'success',
            processed: true
        }]);

        console.log(`[✔] Access Granted: Checked in ${memberName} successfully at ${time}.`);
        return { success: true, message: `Checked in ${memberName} successfully.` };

    } catch (err) {
        console.error('[-] Error handling check-in:', err.message);
        return { success: false, reason: 'failed', message: err.message };
    }
}

// 4. Running the Agent
async function run() {
    await initDeviceConnection();

    if (ZK_SIMULATE) {
        // --- 4a. SIMULATION MODE ---
        const app = express();
        app.use(cors());
        app.use(express.json());

        // Initialize cache
        await refreshDeviceUsersCache(true);

        // Receive simulated scan events
        app.post('/simulate-scan', async (req, res) => {
            const deviceUserId = req.body.deviceUserId || req.body.device_user_id;
            if (deviceUserId === undefined) {
                return res.status(400).json({ error: 'deviceUserId is required' });
            }
            
            // Verify if user is present in device cache/memory
            await refreshDeviceUsersCache();
            const exists = deviceUsersCache.some(u => parseInt(u.userId, 10) === parseInt(deviceUserId, 10));
            if (!exists) {
                console.warn(`[Simulator] Scan rejected: User ID ${deviceUserId} is not enrolled on device memory.`);
                return res.json({ success: false, reason: 'not_enrolled', message: `Device User ID ${deviceUserId} is not enrolled on device memory.` });
            }

            const timestamp = new Date().toISOString();
            const result = await handleCheckIn(deviceUserId, timestamp);
            res.json(result);
        });

        // Simulate physical enrollment on the keypad (for testing/development)
        app.post('/simulate-enroll', async (req, res) => {
            const deviceUserId = req.body.deviceUserId || req.body.device_user_id;
            if (deviceUserId === undefined) {
                return res.status(400).json({ error: 'deviceUserId is required' });
            }
            
            console.log(`[Simulator] Mocking physical keypad enrollment for User ID ${deviceUserId}`);
            try {
                const { data, error } = await supabase
                    .from('biometric_enrollments')
                    .update({ sync_status: 'synced' })
                    .eq('device_user_id', parseInt(deviceUserId, 10))
                    .select();
                
                if (error) throw error;
                
                await refreshDeviceUsersCache(true);
                res.json({ success: true, message: `Simulated physical enrollment for User ID ${deviceUserId}.`, data });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // Provide list of enrolled members to developer UI for easy testing
        app.get('/enrolled-members', async (req, res) => {
            try {
                const { data, error } = await supabase
                    .from('biometric_enrollments')
                    .select('device_user_id, member_id, sync_status, members(full_name, status)');
                
                if (error) throw error;
                res.json(data);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        // Start simulation sync interval (runs database updates & deletions)
        setInterval(async () => {
            try {
                await supabase.rpc('sync_member_statuses');
                await syncBiometricEnrollments();
            } catch (err) {
                console.error('[-] Error in simulation sync loop:', err.message);
            }
        }, 8000);

        app.listen(SIMULATOR_PORT, () => {
            console.log(`[+] Simulation Server listening on http://localhost:${SIMULATOR_PORT}`);
            console.log(`[+] Send POST requests to http://localhost:${SIMULATOR_PORT}/simulate-scan`);
        });

    } else {
        // --- 4b. PRODUCTION HARDWARE CONNECTION MODE ---
        zkInstance = new ZKLib(DEVICE_IP, DEVICE_PORT, 10000, 4000);
        let pollInterval = null;

        const cleanup = async () => {
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
            await updateHeartbeat('offline');
            try {
                await zkInstance.disconnect();
            } catch (disError) {
                console.error('[-] Error during socket disconnect cleanup:', disError.message || disError);
            }
        };

        try {
            await zkInstance.createSocket();
            console.log('[+] Connected to physical ZKTeco K40 device successfully.');
            await updateHeartbeat('online');

            // Initialize cache
            await refreshDeviceUsersCache(true);
            console.log(`[+] Retrieved ${deviceUsersCache.length} users enrolled on device memory.`);

            // 1. Transaction Memory Polling Fallback
            // Poll device log history every 8 seconds to capture scans.
            // This is 100% reliable across all firmware versions and syncs offline records.
            const pollLogs = async () => {
                try {
                    // Sync expired memberships and subscription statuses in database
                    await supabase.rpc('sync_member_statuses');

                    // Process biometric synchronization tasks (deletions / status checks)
                    await syncBiometricEnrollments();

                    const attendances = await zkInstance.getAttendances();
                    if (attendances && attendances.data) {
                        for (const log of attendances.data) {
                            const deviceUserId = parseInt(log.deviceUserId, 10);
                            const recordTime = log.recordTime;
                            
                            // Convert recordTime to ISO String for database checking
                            const isoTime = new Date(recordTime).toISOString();

                            // Check if this scan has already been logged in Supabase
                            const { data: existingLog } = await supabase
                                .from('biometric_attendance_logs')
                                .select('id')
                                .eq('device_user_id', deviceUserId)
                                .eq('scan_timestamp', isoTime)
                                .maybeSingle();

                            if (!existingLog) {
                                console.log(`[Polling] Syncing new scan: User ID ${deviceUserId} at ${isoTime}`);
                                await handleCheckIn(deviceUserId, isoTime);
                            }
                        }
                    }
                } catch (pollErr) {
                    console.error('[-] Error polling attendance from device memory:', pollErr.message || pollErr);
                }
            };

            // Run poll immediately on connection and set interval
            await pollLogs();
            pollInterval = setInterval(pollLogs, 8000);

            // 2. Real-Time Listener (if supported by firmware)
            console.log('[+] Listening for real-time fingerprint scans on the device...');
            await zkInstance.getRealTimeLogs(async (err, log) => {
                if (err) {
                    console.error('[-] Real-time log capture error:', err);
                    await cleanup();
                    console.log('[*] Connection lost. Attempting reconnection in 10 seconds...');
                    setTimeout(run, 10000);
                    return;
                }
                
                if (log && log.userId) {
                    // Check if already processed by polling to avoid redundant calls
                    const parsedUserId = parseInt(log.userId, 10);
                    const isoTime = new Date(log.attTime || new Date()).toISOString();
                    const { data: existingLog } = await supabase
                        .from('biometric_attendance_logs')
                        .select('id')
                        .eq('device_user_id', parsedUserId)
                        .eq('scan_timestamp', isoTime)
                        .maybeSingle();

                    if (!existingLog) {
                        await handleCheckIn(log.userId, log.attTime);
                    }
                }
            });

        } catch (error) {
            console.error('[-] Connection to K40 device failed:', error.message || error);
            if (pollInterval) clearInterval(pollInterval);
            await updateHeartbeat('offline');
            console.log('[*] Retrying in 10 seconds...');
            setTimeout(run, 10000);
        }
    }
}

// Handle termination gracefully
process.on('SIGINT', async () => {
    console.log('\n[-] Sync Agent terminating. Updating device status...');
    await updateHeartbeat('offline');
    process.exit(0);
});

run();
