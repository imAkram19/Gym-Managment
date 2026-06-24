/**
 * Standalone ZKTeco K40 Biometric Sync Agent (Production Ready)
 * 
 * Can run in:
 * 1. Production Mode: persistent socket connection to the physical K40 device.
 * 2. Simulation Mode: opens a local HTTP server on port 4371 to receive mock scans.
 */

const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const express = require('express');
const ZKLib = require('node-zklib');
const net = require('net');
const fs = require('fs');
require('dotenv').config();

const logger = require('./logger');

// 1. Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const DEVICE_IP = process.env.ZK_DEVICE_IP || '192.168.1.5';
const DEVICE_PORT = parseInt(process.env.ZK_DEVICE_PORT || '4370', 10);

const ZK_SIMULATE = process.env.ZK_SIMULATE === 'true';
const SIMULATOR_PORT = parseInt(process.env.SIMULATOR_PORT || '4371', 10);
const LOCK_PORT = parseInt(process.env.SYNC_AGENT_LOCK_PORT || '4379', 10);

if (!SUPABASE_URL || !SUPABASE_KEY) {
    logger.error('[-] Error: SUPABASE_URL and SUPABASE_KEY are required in environment.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let dbDevice = null; // Holds the registered device record from database
let zkInstance = null; // Holds the active ZKLib client instance

// Connection state variables
let isConnecting = false;
let isConnected = false;
let isSyncing = false;
let reconnectTimer = null;
let pollInterval = null;
let healthCheckInterval = null;
let consecutivePollFailures = 0;
let lockServer = null;

// Cache of users enrolled on the device
let deviceUsersCache = [];
let lastCacheRefreshTime = 0;

// Log startup sequence and check crash status
logger.info('==================================================');
logger.info('       ZKTeco K40 Gym Sync Agent Starting         ');
logger.info('==================================================');
logger.info(`Supabase URL: ${SUPABASE_URL}`);
logger.info(`Simulate Mode: ${ZK_SIMULATE ? 'ENABLED (HTTP Simulator)' : 'DISABLED (Hardware Connection)'}`);

const wasClean = logger.checkPreviousShutdown();
if (!wasClean) {
    // Attempt to read the last logged error to report restart reason
    let lastError = 'Unknown crash or force-kill reason';
    const ERR_LOG_PATH = require('path').join(__dirname, 'logs', 'errors.log');
    try {
        if (fs.existsSync(ERR_LOG_PATH)) {
            const data = fs.readFileSync(ERR_LOG_PATH, 'utf8').trim();
            const lines = data.split('\n');
            if (lines.length > 0) {
                lastError = lines[lines.length - 1];
            }
        }
    } catch (e) {
        // ignore
    }
    logger.warn(`[Startup] Sync Agent started after crash/unclean shutdown. Restart reason/Last error: ${lastError}`);
} else {
    logger.info(`[Startup] Sync Agent started normally after clean shutdown.`);
}

// Duplicate Instance Protection Lock
function acquireInstanceLock() {
    return new Promise((resolve) => {
        // We will bind a server socket to LOCK_PORT on localhost to prevent multiple instances
        lockServer = net.createServer();
        lockServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                logger.error(`[Startup] Duplicate Instance Protection: Port ${LOCK_PORT} is already in use. Another instance of sync-agent is running. Exiting...`);
                process.exit(1);
            } else {
                logger.error(`[Startup] Failed to bind instance lock port ${LOCK_PORT}: ${err.message}`);
                resolve(false);
            }
        });
        lockServer.listen(LOCK_PORT, '127.0.0.1', () => {
            logger.info(`[Startup] Duplicate Instance Protection: Instance lock acquired on 127.0.0.1:${LOCK_PORT}`);
            resolve(true);
        });
    });
}

// Safe Supabase call wrapper to prevent app crashes and log network connection failures
async function safeSupabaseCall(fn, context) {
    try {
        const result = await fn();
        if (result && result.error) {
            logger.error(`[Supabase Error] Database issue in "${context}": ${result.error.message}`, result.error);
        }
        return result;
    } catch (err) {
        logger.error(`[Supabase Error] Network/Connection failure in "${context}":`, err);
        return null;
    }
}

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
        const res = await safeSupabaseCall(() => supabase
            .from('biometric_enrollments')
            .select('device_user_id, sync_status, members(status)')
        , 'refresh simulation cache');

        if (res && res.data) {
            deviceUsersCache = res.data
                .filter(e => e.members?.status === 'active' && e.sync_status === 'synced')
                .map(e => ({ userId: String(e.device_user_id), uid: e.device_user_id }));
            lastCacheRefreshTime = now;
        }
        return;
    }

    try {
        if (!zkInstance || !isConnected) return;
        const usersResult = await zkInstance.getUsers();
        if (usersResult && usersResult.data) {
            deviceUsersCache = usersResult.data;
            lastCacheRefreshTime = now;
            logger.info(`[Cache] Refreshed device users cache. Found ${deviceUsersCache.length} users.`);
        }
    } catch (err) {
        logger.error('[-] Failed to retrieve users from device for cache:', err);
    }
}

// Helper to delete user from device memory
async function deleteUserFromDevice(userId) {
    logger.info(`[Device Control] Attempting to delete user ID ${userId} from device...`);
    if (ZK_SIMULATE) {
        logger.info(`[Simulator] Mock deleting user ID ${userId} from device.`);
        // Remove from simulation cache
        deviceUsersCache = deviceUsersCache.filter(u => parseInt(u.userId, 10) !== parseInt(userId, 10));
        logger.info(`[Biometric Deletion] Successfully deleted User ID ${userId} from physical device (simulated).`);
        return true;
    }

    try {
        if (!zkInstance || !isConnected) throw new Error('ZK device not connected.');
        
        // Find user in cache to get their uid (internal record number)
        await refreshDeviceUsersCache(true); // Force refresh to get latest state
        const deviceUser = deviceUsersCache.find(u => parseInt(u.userId, 10) === parseInt(userId, 10));
        if (!deviceUser) {
            logger.info(`[-] User ID ${userId} not found on device memory — already deleted or never enrolled.`);
            return true; // Already deleted/not present
        }

        const uid = deviceUser.uid;
        logger.info(`[Device Control] Found user "${deviceUser.name || userId}" with internal UID=${uid}. Deleting...`);

        // Step 1: Disable device to prevent interference during deletion
        try {
            await zkInstance.disableDevice();
            logger.info(`[Device Control] Device disabled for safe deletion.`);
        } catch (disableErr) {
            logger.warn(`[Device Control] Warning: Could not disable device: ${disableErr.message}`);
        }

        // Step 2: Send CMD_DELETE_USER (command 18) with UID as 2-byte LE integer
        const payload = Buffer.alloc(2);
        payload.writeUInt16LE(uid, 0);
        await zkInstance.executeCmd(18, payload);
        logger.info(`[Device Control] CMD_DELETE_USER sent for UID=${uid}.`);

        // Step 3: Refresh device data to apply changes
        try {
            await zkInstance.executeCmd(1013, ''); // CMD_REFRESHDATA = 1013
            logger.info(`[Device Control] Device data refreshed.`);
        } catch (refreshErr) {
            logger.warn(`[Device Control] Warning: Could not refresh device data: ${refreshErr.message}`);
        }

        // Step 4: Re-enable device
        try {
            await zkInstance.enableDevice();
            logger.info(`[Device Control] Device re-enabled.`);
        } catch (enableErr) {
            logger.warn(`[Device Control] Warning: Could not re-enable device: ${enableErr.message}`);
        }

        // Step 5: Verify deletion by refreshing cache and checking
        await refreshDeviceUsersCache(true);
        const stillExists = deviceUsersCache.some(u => parseInt(u.userId, 10) === parseInt(userId, 10));
        if (stillExists) {
            logger.error(`[!] WARNING: User ID ${userId} still exists on device after CMD_DELETE_USER! Deletion may have failed.`);
            return false;
        }

        logger.info(`[Biometric Deletion] Successfully deleted User ID ${userId} (UID: ${uid}) from physical device memory. Fingerprint removed.`);
        return true;
    } catch (err) {
        logger.error(`[-] Failed to delete user ID ${userId} from device:`, err);
        // Try to re-enable device even on error
        try { if (zkInstance && isConnected) await zkInstance.enableDevice(); } catch (e) {}
        return false;
    }
}

// Biometric enrollment status sync loop
async function syncBiometricEnrollments() {
    const res = await safeSupabaseCall(() => supabase
        .from('biometric_enrollments')
        .select('id, device_user_id, sync_status, member_id')
        .in('sync_status', ['needs_deletion', 'needs_enrollment', 'deleted'])
    , 'fetch enrollment sync jobs');

    if (!res || !res.data || res.data.length === 0) return;

    for (const enrollment of res.data) {
        const userId = enrollment.device_user_id;
        
        if (enrollment.sync_status === 'needs_deletion') {
            const deleted = await deleteUserFromDevice(userId);
            if (deleted) {
                const updateRes = await safeSupabaseCall(() => supabase
                    .from('biometric_enrollments')
                    .update({ sync_status: 'deleted' })
                    .eq('id', enrollment.id)
                , 'update enrollment sync_status to deleted');
                
                if (updateRes && !updateRes.error) {
                    logger.info(`[Biometric Deletion] Deleted member ID ${enrollment.member_id} biometric enrollment record.`);
                }
            }
        } else if (enrollment.sync_status === 'deleted') {
            // Safety check: verify user is actually removed from the physical device
            if (!ZK_SIMULATE && isConnected) {
                await refreshDeviceUsersCache(true);
                const stillOnDevice = deviceUsersCache.some(u => parseInt(u.userId, 10) === parseInt(userId, 10));
                if (stillOnDevice) {
                    logger.warn(`[!] User ID ${userId} marked as 'deleted' in DB but still exists on device! Retrying deletion...`);
                    const deleted = await deleteUserFromDevice(userId);
                    if (!deleted) {
                        // Reset status so it will be retried next cycle
                        await safeSupabaseCall(() => supabase
                            .from('biometric_enrollments')
                            .update({ sync_status: 'needs_deletion' })
                            .eq('id', enrollment.id)
                        , 'reset enrollment sync_status to needs_deletion');
                    }
                }
            }
        } else if (enrollment.sync_status === 'needs_enrollment') {
            // Check if user is now enrolled on device memory
            await refreshDeviceUsersCache(true); // force refresh cache to look for new enrollments
            const isEnrolled = deviceUsersCache.some(u => parseInt(u.userId, 10) === parseInt(userId, 10));
            if (isEnrolled) {
                const updateRes = await safeSupabaseCall(() => supabase
                    .from('biometric_enrollments')
                    .update({ sync_status: 'synced' })
                    .eq('id', enrollment.id)
                , 'update enrollment sync_status to synced');

                if (updateRes && !updateRes.error) {
                    logger.info(`[Biometric Enrollment] Enrolled User ID ${userId} synced in database.`);
                }
            }
        }
    }
}

// Process any pending deletions from the physical device
async function processPendingDeviceDeletions() {
    const res = await safeSupabaseCall(() => supabase
        .from('pending_device_deletions')
        .select('*')
    , 'fetch pending device deletions');

    if (!res || !res.data || res.data.length === 0) return;

    for (const deletion of res.data) {
        const userId = deletion.device_user_id;
        logger.info(`[Sync] Processing pending hardware deletion for Device User ID: ${userId}`);
        
        const deleted = await deleteUserFromDevice(userId);
        if (deleted) {
            // Remove from pending deletions queue in DB
            await safeSupabaseCall(() => supabase
                .from('pending_device_deletions')
                .delete()
                .eq('id', deletion.id)
            , 'remove pending deletion record');
        }
    }
}

// 2. Self-register device and handle pings
async function initDeviceConnection() {
    const res = await safeSupabaseCall(() => supabase
        .from('biometric_devices')
        .select('*')
        .eq('ip_address', DEVICE_IP)
        .maybeSingle()
    , 'fetch device details');

    if (!res) {
        logger.warn('[-] Supabase unavailable during startup device registration. Will retry later.');
        return;
    }

    if (res.data) {
        dbDevice = res.data;
        logger.info(`[+] Registered device found in DB: "${dbDevice.name}" (ID: ${dbDevice.id})`);
    } else {
        // Create a new device entry
        const deviceName = ZK_SIMULATE ? 'Simulated Dev ZKTeco K40' : 'Iron Gym Main K40';
        const createRes = await safeSupabaseCall(() => supabase
            .from('biometric_devices')
            .insert([{
                name: deviceName,
                ip_address: DEVICE_IP,
                port: DEVICE_PORT,
                status: 'offline'
            }])
            .select()
            .single()
        , 'register new device');

        if (createRes && createRes.data) {
            dbDevice = createRes.data;
            logger.info(`[+] Created new device record in DB: "${dbDevice.name}" (ID: ${dbDevice.id})`);
        }
    }

    // Set initial heartbeat status immediately
    await runHealthCheck();
}

// Health check to update status and last_seen
async function runHealthCheck() {
    if (!dbDevice) return;
    
    let currentStatus = 'offline';
    if (ZK_SIMULATE) {
        currentStatus = 'online';
    } else if (isConnected) {
        currentStatus = isSyncing ? 'syncing' : 'online';
    }

    logger.info(`[Health Monitor] Health check-in. Status: ${currentStatus}`);

    await safeSupabaseCall(() => supabase
        .from('biometric_devices')
        .update({
            status: currentStatus,
            last_seen: new Date().toISOString(),
            last_ping: new Date().toISOString()
        })
        .eq('id', dbDevice.id)
    , 'update device health check');
}

// 3. Central check-in handler
async function handleCheckIn(userId, timestamp) {
    const today = getTodayDate();
    const time = getCurrentTime();
    const parsedUserId = parseInt(userId, 10);

    logger.info(`\n[Scan Detected] Device User ID: ${parsedUserId} at ${timestamp}`);

    // 1. Look up Member Mapping
    const enrollRes = await safeSupabaseCall(() => supabase
        .from('biometric_enrollments')
        .select('member_id, members(full_name, status)')
        .eq('device_user_id', parsedUserId)
        .maybeSingle()
    , 'lookup member mapping');

    if (!enrollRes || !enrollRes.data) {
        logger.warn(`[Attendance Sync] Unknown scan: Device User ID ${parsedUserId} is not enrolled in the system.`);
        
        // Log raw event as unknown user
        await safeSupabaseCall(() => supabase.from('biometric_attendance_logs').insert([{
            device_id: dbDevice ? dbDevice.id : null,
            device_user_id: parsedUserId,
            scan_timestamp: timestamp || new Date().toISOString(),
            status: 'unknown_user',
            processed: true
        }]), 'insert unknown user attendance log');
        return { success: false, reason: 'unknown_user', message: `Device User ID ${parsedUserId} is not enrolled.` };
    }

    const enrollment = enrollRes.data;
    const memberId = enrollment.member_id;
    const memberName = enrollment.members?.full_name || 'Unknown';
    logger.info(`[Attendance Sync] Mapped User ID ${parsedUserId} to Member: ${memberName}`);

    // 2. Validate Active Subscription
    const subRes = await safeSupabaseCall(() => supabase
        .from('subscriptions')
        .select('*')
        .eq('member_id', memberId)
        .eq('is_active', true)
        .gte('end_date', today)
        .limit(1)
    , 'validate member subscription');

    const hasActiveSubscription = subRes && subRes.data && subRes.data.length > 0;

    if (!hasActiveSubscription) {
        logger.warn(`[Attendance Sync] Access Denied: Member ${memberName} does not have an active subscription.`);
        
        // Log denied sweep
        await safeSupabaseCall(() => supabase.from('biometric_attendance_logs').insert([{
            device_id: dbDevice ? dbDevice.id : null,
            device_user_id: parsedUserId,
            scan_timestamp: timestamp || new Date().toISOString(),
            status: 'denied_no_plan',
            processed: true
        }]), 'insert denied access log');
        return { success: false, reason: 'denied_no_plan', message: `Member ${memberName} has no active subscription.` };
    }

    // Trigger door relay via remote unlock command if enabled
    if (process.env.ZK_REMOTE_UNLOCK === 'true' && zkInstance && !ZK_SIMULATE && isConnected) {
        try {
            // Command code 102 corresponds to CMD_UNLOCK
            await zkInstance.executeCmd(102, '');
            logger.info(`[+] Sent remote unlock command to K40 relay for ${memberName}.`);
        } catch (unlockErr) {
            logger.error('[-] Failed to trigger remote door unlock relay:', unlockErr);
        }
    }

    // 3. Prevent duplicate check-in for today
    const existingCheckInRes = await safeSupabaseCall(() => supabase
        .from('attendance')
        .select('id')
        .eq('member_id', memberId)
        .eq('date', today)
        .maybeSingle()
    , 'check duplicate attendance');

    if (existingCheckInRes && existingCheckInRes.data) {
        logger.info(`[Attendance Sync] Member ${memberName} is already checked in for today. Logging scan audit record only.`);
        
        // Log successful biometric audit record even if check-in exists
        await safeSupabaseCall(() => supabase.from('biometric_attendance_logs').insert([{
            device_id: dbDevice ? dbDevice.id : null,
            device_user_id: parsedUserId,
            scan_timestamp: timestamp || new Date().toISOString(),
            status: 'success',
            processed: true
        }]), 'insert duplicate scan audit log');
        return { success: true, message: `Member ${memberName} is already checked in. Logged scan.` };
    }

    // 4. Log Attendance
    const insertRes = await safeSupabaseCall(() => supabase
        .from('attendance')
        .insert([{
            member_id: memberId,
            date: today,
            check_in_time: time,
            method: 'fingerprint'
        }])
    , 'insert new attendance');

    if (insertRes && !insertRes.error) {
        // Log successful biometric audit record
        await safeSupabaseCall(() => supabase.from('biometric_attendance_logs').insert([{
            device_id: dbDevice ? dbDevice.id : null,
            device_user_id: parsedUserId,
            scan_timestamp: timestamp || new Date().toISOString(),
            status: 'success',
            processed: true
        }]), 'insert success scan audit log');

        logger.info(`[Attendance Sync] Access Granted: Checked in ${memberName} successfully at ${time}.`);
        return { success: true, message: `Checked in ${memberName} successfully.` };
    }

    return { success: false, reason: 'db_insert_failed', message: 'Failed to write attendance record to Supabase.' };
}

// 4. Clean Socket Disconnect
async function cleanupConnection() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    
    isConnected = false;
    await runHealthCheck(); // updates status to offline in DB

    if (zkInstance) {
        try {
            logger.info('[Device Control] Disconnecting from K40 device...');
            await zkInstance.disconnect();
        } catch (disError) {
            logger.error('[-] Error during socket disconnect cleanup:', disError);
        }
        zkInstance = null;
    }
}

// 5. Connect to K40 device (Hardware Connection Flow)
async function connectToK40() {
    if (isConnecting) return;
    isConnecting = true;

    logger.info(`[Connection] Reconnect attempt: Connecting to ZKTeco K40 device at ${DEVICE_IP}:${DEVICE_PORT}...`);

    try {
        await cleanupConnection();

        zkInstance = new ZKLib(DEVICE_IP, DEVICE_PORT, 10000, 4000);
        await zkInstance.createSocket();
        
        logger.info('[K40 Event] Connected to physical ZKTeco K40 device successfully.');
        isConnected = true;
        consecutivePollFailures = 0;
        await runHealthCheck(); // Updates status to online

        // Initialize cache
        await refreshDeviceUsersCache(true);
        logger.info(`[K40 Event] Loaded device cache: ${deviceUsersCache.length} users enrolled.`);

        // 1. Transaction Memory Polling Fallback
        const pollLogs = async () => {
            if (!isConnected) return;
            isSyncing = true;
            try {
                // Sync expired memberships and subscription statuses in database
                await safeSupabaseCall(() => supabase.rpc('sync_member_statuses'), 'sync_member_statuses');

                // Process biometric synchronization tasks (deletions / status checks)
                await syncBiometricEnrollments();

                // Process physical device user deletions
                await processPendingDeviceDeletions();

                const attendances = await zkInstance.getAttendances();
                consecutivePollFailures = 0; // Reset poll failure count on success

                if (attendances && attendances.data) {
                    let newScansCount = 0;
                    for (const log of attendances.data) {
                        const deviceUserId = parseInt(log.deviceUserId, 10);
                        const recordTime = log.recordTime;
                        
                        // Convert recordTime to ISO String for database checking
                        const isoTime = new Date(recordTime).toISOString();

                        // Check if this scan has already been logged in Supabase
                        const checkRes = await safeSupabaseCall(() => supabase
                            .from('biometric_attendance_logs')
                            .select('id')
                            .eq('device_user_id', deviceUserId)
                            .eq('scan_timestamp', isoTime)
                            .maybeSingle()
                        , 'check existing log');

                        if (checkRes && !checkRes.data) {
                            newScansCount++;
                            logger.info(`[Attendance Sync] Polled new scan: User ID ${deviceUserId} at ${isoTime}`);
                            await handleCheckIn(deviceUserId, isoTime);
                        }
                    }
                    if (newScansCount > 0) {
                        logger.info(`[Attendance Sync] Successfully synced ${newScansCount} new attendance scan(s).`);
                    }
                }
            } catch (pollErr) {
                consecutivePollFailures++;
                logger.error(`[-] Error polling attendance from device memory (Failures: ${consecutivePollFailures}/3):`, pollErr);
                if (consecutivePollFailures >= 3) {
                    logger.error('[K40 Event] Consecutive polling failures exceeded limit. K40 device has become unreachable.');
                    handleDisconnectAndRetry();
                }
            } finally {
                isSyncing = false;
            }
        };

        // Run poll immediately on connection and set interval every 8 seconds
        await pollLogs();
        pollInterval = setInterval(pollLogs, 8000);

        // 2. Real-Time Listener (if supported by firmware)
        logger.info('[K40 Event] Listening for real-time fingerprint scans on the device...');
        await zkInstance.getRealTimeLogs(async (err, log) => {
            if (err) {
                logger.error('[-] Real-time log capture error, triggering reconnect:', err);
                handleDisconnectAndRetry();
                return;
            }
            
            if (log && log.userId) {
                const parsedUserId = parseInt(log.userId, 10);
                const isoTime = new Date(log.attTime || new Date()).toISOString();
                
                const checkRes = await safeSupabaseCall(() => supabase
                    .from('biometric_attendance_logs')
                    .select('id')
                    .eq('device_user_id', parsedUserId)
                    .eq('scan_timestamp', isoTime)
                    .maybeSingle()
                , 'check existing real-time log');

                if (checkRes && !checkRes.data) {
                    logger.info(`[Attendance Sync] Real-time scan detected: User ID ${parsedUserId} at ${isoTime}`);
                    await handleCheckIn(log.userId, log.attTime);
                }
            }
        });

    } catch (error) {
        logger.error('[K40 Event] Connection to K40 device failed:', error);
        handleDisconnectAndRetry();
    } finally {
        isConnecting = false;
    }
}

// Triggers disconnection, marks offline, and sets a retry timer (30s)
function handleDisconnectAndRetry() {
    cleanupConnection();
    if (!reconnectTimer) {
        logger.warn('[K40 Event] K40 device is offline. Retrying connection in 30 seconds...');
        reconnectTimer = setTimeout(async () => {
            reconnectTimer = null;
            await connectToK40();
        }, 30000);
    }
}

// 6. Running the Agent
async function run() {
    // 1. Acquire Duplicate Instance Lock
    await acquireInstanceLock();

    // 2. Query and Register Device in Supabase
    await initDeviceConnection();

    // 3. Setup periodic health check-in every 5 minutes
    healthCheckInterval = setInterval(async () => {
        await runHealthCheck();
    }, 5 * 60 * 1000);

    if (ZK_SIMULATE) {
        // --- SIMULATION MODE ---
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
                logger.warn(`[Simulator] Scan rejected: User ID ${deviceUserId} is not enrolled on device memory.`);
                return res.json({ success: false, reason: 'not_enrolled', message: `Device User ID ${deviceUserId} is not enrolled on device memory.` });
            }

            const timestamp = new Date().toISOString();
            const result = await handleCheckIn(deviceUserId, timestamp);
            res.json(result);
        });

        // Simulate physical enrollment on the keypad
        app.post('/simulate-enroll', async (req, res) => {
            const deviceUserId = req.body.deviceUserId || req.body.device_user_id;
            if (deviceUserId === undefined) {
                return res.status(400).json({ error: 'deviceUserId is required' });
            }
            
            logger.info(`[Simulator] Mocking physical keypad enrollment for User ID ${deviceUserId}`);
            
            const updateRes = await safeSupabaseCall(() => supabase
                .from('biometric_enrollments')
                .update({ sync_status: 'synced' })
                .eq('device_user_id', parseInt(deviceUserId, 10))
                .select()
            , 'simulate physical enrollment');

            if (updateRes && !updateRes.error) {
                await refreshDeviceUsersCache(true);
                logger.info(`[Biometric Enrollment] Physical keypad enrollment detected for User ID ${deviceUserId}.`);
                res.json({ success: true, message: `Simulated physical enrollment for User ID ${deviceUserId}.`, data: updateRes.data });
            } else {
                res.status(500).json({ error: 'Failed to simulate enrollment in database.' });
            }
        });

        // Provide list of enrolled members to developer UI for easy testing
        app.get('/enrolled-members', async (req, res) => {
            const enrollRes = await safeSupabaseCall(() => supabase
                .from('biometric_enrollments')
                .select('device_user_id, member_id, sync_status, members(full_name, status)')
            , 'fetch enrolled members');

            if (enrollRes && enrollRes.data) {
                res.json(enrollRes.data);
            } else {
                res.status(500).json({ error: 'Failed to fetch enrolled members from Supabase.' });
            }
        });

        // Start simulation sync interval (runs database updates & deletions)
        setInterval(async () => {
            isSyncing = true;
            try {
                await safeSupabaseCall(() => supabase.rpc('sync_member_statuses'), 'simulation sync_member_statuses');
                await syncBiometricEnrollments();
                await processPendingDeviceDeletions();
            } catch (err) {
                logger.error('[-] Error in simulation sync loop:', err);
            } finally {
                isSyncing = false;
            }
        }, 8000);

        app.listen(SIMULATOR_PORT, () => {
            logger.info(`[+] Simulation Server listening on http://localhost:${SIMULATOR_PORT}`);
            logger.info(`[+] Send POST requests to http://localhost:${SIMULATOR_PORT}/simulate-scan`);
        });

    } else {
        // --- PRODUCTION HARDWARE CONNECTION MODE ---
        await connectToK40();
    }
}

// 7. Process Crash & Termination Management
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception crash event:', err);
    // Exit immediately so PM2 can restart the service
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection crash event at promise:', new Error(String(reason)));
    // Exit immediately so PM2 can restart the service
    process.exit(1);
});

// Handle termination gracefully
const shutdown = async (signal) => {
    logger.info(`\n[-] Shutdown event: Sync Agent terminating via ${signal}. Updating device status...`);
    
    if (healthCheckInterval) clearInterval(healthCheckInterval);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    
    await cleanupConnection();
    
    // Mark clean shutdown
    logger.markCleanShutdown();
    
    if (lockServer) {
        try {
            lockServer.close();
        } catch (e) {}
    }
    
    logger.info('[Shutdown] Sync Agent clean shutdown complete.');
    process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('message', (msg) => {
    if (msg === 'shutdown') {
        shutdown('PM2_SHUTDOWN');
    }
});

// Start execution
run();
