/**
 * Standalone ZKTeco K40 Biometric Sync Agent (Production Ready & Audited)
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
const path = require('path');
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

// Configurable Sync Intervals via Environment (in seconds)
const SYNC_STATUS_INTERVAL = parseInt(process.env.SYNC_STATUS_INTERVAL || '3600', 10) * 1000;
const SCAN_POLL_INTERVAL = parseInt(process.env.SCAN_POLL_INTERVAL || '10', 10) * 1000;
const DEVICE_SYNC_INTERVAL = parseInt(process.env.DEVICE_SYNC_INTERVAL || '30', 10) * 1000;

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
let scansPollInterval = null;
let syncTasksInterval = null;
let memberStatusInterval = null;
let healthCheckInterval = null;
let consecutivePollFailures = 0;
let lockServer = null;

// Persistent state variables
const STATE_FILE_PATH = path.join(__dirname, 'logs', 'state.json');
let lastProcessedTimestamp = null;
let processedScansAtLastTimestamp = new Set();

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
    let lastError = 'Unknown crash or force-kill reason';
    const ERR_LOG_PATH = path.join(__dirname, 'logs', 'errors.log');
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

// 1. Local State Persistence (Priority order initialization)
function saveState() {
    try {
        const state = {
            lastProcessedTimestamp,
            processedScansAtLastTimestamp: Array.from(processedScansAtLastTimestamp)
        };
        fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
    } catch (err) {
        logger.error('[State Error] Failed to write state file:', err);
    }
}

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE_PATH)) {
            const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
            lastProcessedTimestamp = data.lastProcessedTimestamp;
            processedScansAtLastTimestamp = new Set(data.processedScansAtLastTimestamp || []);
            logger.info(`[State] Loaded state from local file. Last processed timestamp: ${lastProcessedTimestamp}`);
            return true;
        }
    } catch (err) {
        logger.error('[State Error] Failed to read state file, will initialize from DB:', err);
    }
    return false;
}

async function initializeState() {
    // Priority 1: Load state from local logs/state.json
    if (loadState()) return;

    logger.info('[State] State file missing. Priority 2: Querying latest attendance record from Supabase...');
    // Priority 2: Query latest record from Supabase
    const res = await safeSupabaseCall(() => supabase
        .from('biometric_attendance_logs')
        .select('scan_timestamp, device_user_id')
        .order('scan_timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
    , 'fetch latest scan log for state initialization');

    if (res && res.data) {
        lastProcessedTimestamp = res.data.scan_timestamp;
        processedScansAtLastTimestamp.clear();
        processedScansAtLastTimestamp.add(`${res.data.device_user_id}-${res.data.scan_timestamp}`);
        saveState();
        logger.info(`[State] State successfully initialized from Supabase latest log: ${lastProcessedTimestamp}`);
        return;
    }

    // Priority 3: Query latest K40 attendance log
    if (!ZK_SIMULATE) {
        logger.info('[State] No attendance records found in Supabase. Priority 3: Querying latest log from physical K40 device...');
        try {
            const tempZk = new ZKLib(DEVICE_IP, DEVICE_PORT, 10000, 4000);
            await tempZk.createSocket();
            const attendances = await tempZk.getAttendances();
            await tempZk.disconnect();
            
            if (attendances && attendances.data && attendances.data.length > 0) {
                const sorted = attendances.data.sort((a, b) => 
                    new Date(b.recordTime).getTime() - new Date(a.recordTime).getTime()
                );
                const latest = sorted[0];
                lastProcessedTimestamp = new Date(latest.recordTime).toISOString();
                processedScansAtLastTimestamp.clear();
                processedScansAtLastTimestamp.add(`${latest.deviceUserId}-${lastProcessedTimestamp}`);
                saveState();
                logger.info(`[State] State successfully initialized from K40 device logs: ${lastProcessedTimestamp}`);
                return;
            }
        } catch (e) {
            logger.warn(`[State Warning] Could not connect to K40 device during state initialization: ${e.message}`);
        }
    }

    // Priority 4: Fallback to current time
    lastProcessedTimestamp = new Date().toISOString();
    processedScansAtLastTimestamp.clear();
    saveState();
    logger.info(`[State] No state found anywhere. Priority 4: Initialized state with current time: ${lastProcessedTimestamp}`);
}

function markScanAsProcessed(deviceUserId, isoTime) {
    const logTime = new Date(isoTime).getTime();
    const lastTime = lastProcessedTimestamp ? new Date(lastProcessedTimestamp).getTime() : 0;
    
    if (logTime > lastTime) {
        lastProcessedTimestamp = isoTime;
        processedScansAtLastTimestamp.clear();
        processedScansAtLastTimestamp.add(`${deviceUserId}-${isoTime}`);
    } else if (logTime === lastTime) {
        processedScansAtLastTimestamp.add(`${deviceUserId}-${isoTime}`);
    }
    saveState();
}

// 2. Duplicate Instance Protection Lock
function acquireInstanceLock() {
    return new Promise((resolve) => {
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

// 3. Safe Supabase call wrapper
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

// 4. Defensive Device ID Mapping Verification
async function getVerifiedDeviceId() {
    if (!dbDevice) {
        await initDeviceConnection();
    }
    
    if (dbDevice) {
        const checkRes = await safeSupabaseCall(() => supabase
            .from('biometric_devices')
            .select('id')
            .eq('id', dbDevice.id)
            .maybeSingle()
        , 'verify device exists');
        
        if (checkRes && checkRes.data) {
            return dbDevice.id;
        } else {
            logger.warn(`[Defensive Alert] Device ID ${dbDevice.id} not found in biometric_devices table. Refreshing connection...`);
            dbDevice = null;
            await initDeviceConnection();
            if (dbDevice) return dbDevice.id;
        }
    }
    return null;
}

// Helper to write biometric logs with extensive trace logging and diagnostics
async function insertBiometricAttendanceLog(status, parsedUserId, timestamp, memberId = null) {
    const verifiedDeviceId = await getVerifiedDeviceId();
    
    let deviceName = 'Unknown Device';
    let dbRowFound = null;
    if (verifiedDeviceId) {
        const fetchRes = await safeSupabaseCall(() => supabase
            .from('biometric_devices')
            .select('*')
            .eq('id', verifiedDeviceId)
            .maybeSingle()
        , 'fetch device row for log');
        if (fetchRes && fetchRes.data) {
            dbRowFound = fetchRes.data;
            deviceName = dbRowFound.name;
        }
    }

    const payload = {
        device_id: verifiedDeviceId,
        device_user_id: parsedUserId,
        scan_timestamp: timestamp || new Date().toISOString(),
        status: status,
        processed: true
    };

    logger.info(`[Biometric Log Trace] Preparing to insert log:
  - device_id: ${payload.device_id}
  - device_name: ${deviceName}
  - member_id: ${memberId || 'None (Unenrolled / Unknown User)'}
  - device_user_id: ${payload.device_user_id}
  - payload: ${JSON.stringify(payload)}`);

    const res = await supabase
        .from('biometric_attendance_logs')
        .insert([payload]);

    if (res && res.error) {
        logger.error(`[Defensive Error] Foreign key or constraint failure in biometric_attendance_logs:
  - Error Message: ${res.error.message}
  - Error Code: ${res.error.code}
  - Diagnostic device_id: ${payload.device_id}
  - Diagnostic device_name: ${deviceName}
  - Diagnostic member_id: ${memberId}
  - Diagnostic device_user_id: ${payload.device_user_id}
  - Diagnostic payload: ${JSON.stringify(payload)}
  - Details: ${JSON.stringify(res.error)}`);
    } else {
        logger.info(`[Biometric Log Success] Log inserted. status: ${status}`);
    }

    return res;
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
    if (!force && deviceUsersCache.length > 0 && (now - lastCacheRefreshTime < 30000)) {
        return;
    }

    if (ZK_SIMULATE) {
        const res = await safeSupabaseCall(() => supabase
            .from('biometric_enrollments')
            .select('device_user_id, sync_status, members(status)')
        , 'refresh simulation cache');

        if (res && res.data) {
            deviceUsersCache = res.data
                .filter(e => (e.members?.status === 'active' || e.members?.status === 'expired') && e.sync_status !== 'deleted')
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
        deviceUsersCache = deviceUsersCache.filter(u => parseInt(u.userId, 10) !== parseInt(userId, 10));
        logger.info(`[Biometric Deletion] Successfully deleted User ID ${userId} from physical device (simulated).`);
        return true;
    }

    try {
        if (!zkInstance || !isConnected) throw new Error('ZK device not connected.');
        
        await refreshDeviceUsersCache(true); 
        const deviceUser = deviceUsersCache.find(u => parseInt(u.userId, 10) === parseInt(userId, 10));
        if (!deviceUser) {
            logger.info(`[-] User ID ${userId} not found on device memory — already deleted or never enrolled.`);
            return true;
        }

        const uid = deviceUser.uid;
        logger.info(`[Device Control] Found user "${deviceUser.name || userId}" with internal UID=${uid}. Deleting...`);

        try {
            await zkInstance.disableDevice();
            logger.info(`[Device Control] Device disabled for safe deletion.`);
        } catch (disableErr) {
            logger.warn(`[Device Control] Warning: Could not disable device: ${disableErr.message}`);
        }

        const payload = Buffer.alloc(2);
        payload.writeUInt16LE(uid, 0);
        await zkInstance.executeCmd(18, payload);
        logger.info(`[Device Control] CMD_DELETE_USER sent for UID=${uid}.`);

        try {
            await zkInstance.executeCmd(1013, ''); // CMD_REFRESHDATA = 1013
            logger.info(`[Device Control] Device data refreshed.`);
        } catch (refreshErr) {
            logger.warn(`[Device Control] Warning: Could not refresh device data: ${refreshErr.message}`);
        }

        try {
            await zkInstance.enableDevice();
            logger.info(`[Device Control] Device re-enabled.`);
        } catch (enableErr) {
            logger.warn(`[Device Control] Warning: Could not re-enable device: ${enableErr.message}`);
        }

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
            if (!ZK_SIMULATE && isConnected) {
                await refreshDeviceUsersCache(true);
                const stillOnDevice = deviceUsersCache.some(u => parseInt(u.userId, 10) === parseInt(userId, 10));
                if (stillOnDevice) {
                    logger.warn(`[!] User ID ${userId} marked as 'deleted' in DB but still exists on device! Retrying deletion...`);
                    const deleted = await deleteUserFromDevice(userId);
                    if (!deleted) {
                        await safeSupabaseCall(() => supabase
                            .from('biometric_enrollments')
                            .update({ sync_status: 'needs_deletion' })
                            .eq('id', enrollment.id)
                        , 'reset enrollment sync_status to needs_deletion');
                    }
                }
            }
        } else if (enrollment.sync_status === 'needs_enrollment') {
            await refreshDeviceUsersCache(true);
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
            await safeSupabaseCall(() => supabase
                .from('pending_device_deletions')
                .delete()
                .eq('id', deletion.id)
            , 'remove pending deletion record');
        }
    }
}

// Self-register device and handle pings
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
        const deviceName = ZK_SIMULATE ? 'Simulated Dev ZKTeco K40' : 'Iron Gym K40';
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

    await runHealthCheck();
}

// Health check to update status and last_seen
async function runHealthCheck() {
    const verifiedDeviceId = await getVerifiedDeviceId();
    if (!verifiedDeviceId) return;
    
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
        .eq('id', verifiedDeviceId)
    , 'update device health check');
}

// Central check-in handler
async function handleCheckIn(userId, timestamp) {
    const today = getTodayDate();
    const time = getCurrentTime();
    const parsedUserId = parseInt(userId, 10);

    logger.info(`\n[Scan Detected] Device User ID: ${parsedUserId} at ${timestamp}`);

    try {
        // 1. Look up Member Mapping
        const enrollRes = await safeSupabaseCall(() => supabase
            .from('biometric_enrollments')
            .select('member_id, members(full_name, status)')
            .eq('device_user_id', parsedUserId)
            .maybeSingle()
        , 'lookup member mapping');

        if (!enrollRes || !enrollRes.data) {
            logger.warn(`[Attendance Sync] Unknown scan: Device User ID ${parsedUserId} is not enrolled in the system.`);
            const logRes = await insertBiometricAttendanceLog('unknown_user', parsedUserId, timestamp, null);
            return { 
                success: false, 
                reason: 'unknown_user', 
                processed: logRes && !logRes.error, 
                message: `Device User ID ${parsedUserId} is not enrolled.` 
            };
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
            const logRes = await insertBiometricAttendanceLog('denied_no_plan', parsedUserId, timestamp, memberId);
            return { 
                success: false, 
                reason: 'denied_no_plan', 
                processed: logRes && !logRes.error, 
                message: `Member ${memberName} has no active subscription.` 
            };
        }

        // Trigger door relay via remote unlock command if enabled
        if (process.env.ZK_REMOTE_UNLOCK === 'true' && zkInstance && !ZK_SIMULATE && isConnected) {
            try {
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
            const logRes = await insertBiometricAttendanceLog('success', parsedUserId, timestamp, memberId);
            return { 
                success: true, 
                processed: logRes && !logRes.error, 
                message: `Member ${memberName} is already checked in. Logged scan.` 
            };
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
            const logRes = await insertBiometricAttendanceLog('success', parsedUserId, timestamp, memberId);
            logger.info(`[Attendance Sync] Access Granted: Checked in ${memberName} successfully at ${time}.`);
            return { 
                success: true, 
                processed: logRes && !logRes.error, 
                message: `Checked in ${memberName} successfully.` 
            };
        }

        return { success: false, reason: 'db_insert_failed', processed: false, message: 'Failed to write attendance record to Supabase.' };
    } catch (err) {
        logger.error('[-] Error handling check-in:', err);
        return { success: false, reason: 'failed', processed: false, message: err.message };
    }
}

// Clean Socket Disconnect
async function cleanupConnection() {
    if (scansPollInterval) {
        clearInterval(scansPollInterval);
        scansPollInterval = null;
    }
    if (syncTasksInterval) {
        clearInterval(syncTasksInterval);
        syncTasksInterval = null;
    }
    
    isConnected = false;
    await runHealthCheck();

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

// Connect to K40 device (Hardware Connection Flow)
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
        await runHealthCheck();

        // Initialize cache
        await refreshDeviceUsersCache(true);
        logger.info(`[K40 Event] Loaded device cache: ${deviceUsersCache.length} users enrolled.`);

        // 1. Transaction Memory Polling Fallback (Filtered locally using persistent state)
        const pollScans = async () => {
            if (!isConnected) return;
            isSyncing = true;
            try {
                const attendances = await zkInstance.getAttendances();
                consecutivePollFailures = 0;

                if (attendances && attendances.data) {
                    // Sort logs by recordTime ascending (oldest first)
                    const sortedLogs = attendances.data.sort((a, b) => 
                        new Date(a.recordTime).getTime() - new Date(b.recordTime).getTime()
                    );

                    // Filter logs using local state
                    const lastTime = lastProcessedTimestamp ? new Date(lastProcessedTimestamp).getTime() : 0;
                    const newLogs = sortedLogs.filter(log => {
                        const logTime = new Date(log.recordTime).getTime();
                        if (logTime > lastTime) return true;
                        if (logTime === lastTime) {
                            const id = `${log.deviceUserId}-${new Date(log.recordTime).toISOString()}`;
                            return !processedScansAtLastTimestamp.has(id);
                        }
                        return false;
                    });

                    if (newLogs.length > 0) {
                        logger.info(`[Attendance Sync] Found ${newLogs.length} new scan(s) to process.`);
                        let processedCount = 0;
                        for (const log of newLogs) {
                            const deviceUserId = parseInt(log.deviceUserId, 10);
                            const recordTime = log.recordTime;
                            const isoTime = new Date(recordTime).toISOString();

                            const result = await handleCheckIn(deviceUserId, isoTime);
                            if (result && result.processed === true) {
                                markScanAsProcessed(deviceUserId, isoTime);
                                processedCount++;
                            }
                        }
                        if (processedCount > 0) {
                            logger.info(`[Attendance Sync] Successfully processed ${processedCount} new scan(s).`);
                        }
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

        const syncDatabaseTasks = async () => {
            if (!isConnected) return;
            try {
                await syncBiometricEnrollments();
                await processPendingDeviceDeletions();
            } catch (err) {
                logger.error('[-] Error executing database sync tasks:', err);
            }
        };

        // Run immediately
        await pollScans();
        await syncDatabaseTasks();

        scansPollInterval = setInterval(pollScans, SCAN_POLL_INTERVAL); // Configurable poll scans
        syncTasksInterval = setInterval(syncDatabaseTasks, DEVICE_SYNC_INTERVAL); // Configurable sync tasks

        // 2. Real-Time Listener (Filtered using local state)
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
                
                const logTime = new Date(isoTime).getTime();
                const lastTime = lastProcessedTimestamp ? new Date(lastProcessedTimestamp).getTime() : 0;
                
                let isDuplicate = false;
                if (logTime < lastTime) {
                    isDuplicate = true;
                } else if (logTime === lastTime) {
                    const id = `${parsedUserId}-${isoTime}`;
                    if (processedScansAtLastTimestamp.has(id)) {
                        isDuplicate = true;
                    }
                }

                if (!isDuplicate) {
                    logger.info(`[Attendance Sync] Real-time scan detected: User ID ${parsedUserId} at ${isoTime}`);
                    const result = await handleCheckIn(log.userId, log.attTime);
                    if (result && result.processed === true) {
                        markScanAsProcessed(parsedUserId, isoTime);
                    }
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

// Running the Agent
async function run() {
    await acquireInstanceLock();

    await initializeState();

    await initDeviceConnection();

    // Health check every 5 minutes
    healthCheckInterval = setInterval(async () => {
        await runHealthCheck();
    }, 5 * 60 * 1000);

    // Sync member statuses once at startup
    logger.info('[Sync] Running startup member status synchronization...');
    await safeSupabaseCall(() => supabase.rpc('sync_member_statuses'), 'startup sync_member_statuses');

    // Run status sync at configurable interval (default: 1 hour)
    memberStatusInterval = setInterval(async () => {
        logger.info('[Sync] Running periodic member status check...');
        await safeSupabaseCall(() => supabase.rpc('sync_member_statuses'), 'periodic sync_member_statuses');
    }, SYNC_STATUS_INTERVAL);

    // Auto-clean device memory daily (every 24 hours)
    const DAILY_CLEAN_INTERVAL = 24 * 60 * 60 * 1000;
    setInterval(async () => {
        logger.info('[Maintenance] Running daily maintenance (Auto-clean K40 transaction memory)...');
        if (!ZK_SIMULATE && zkInstance && isConnected) {
            try {
                const attendances = await zkInstance.getAttendances();
                if (attendances && attendances.data && attendances.data.length > 500) {
                    logger.info(`[Maintenance] Device has ${attendances.data.length} logs stored. Clearing device logs to free up memory...`);
                    await zkInstance.clearAttendanceLog();
                    logger.info('[Maintenance] Successfully cleared biometric logs from K40 device hardware memory.');
                } else {
                    logger.info(`[Maintenance] Device has ${attendances?.data?.length || 0} logs. No clearing needed (threshold: 500).`);
                }
            } catch (err) {
                logger.error('[Maintenance Error] Failed to clear K40 logs:', err);
            }
        } else {
            logger.info('[Maintenance] Simulated check for clearing device logs.');
        }
    }, DAILY_CLEAN_INTERVAL);

    if (ZK_SIMULATE) {
        // --- SIMULATION MODE ---
        const app = express();
        app.use(cors());
        app.use(express.json());

        await refreshDeviceUsersCache(true);

        app.post('/simulate-scan', async (req, res) => {
            const deviceUserId = req.body.deviceUserId || req.body.device_user_id;
            if (deviceUserId === undefined) {
                return res.status(400).json({ error: 'deviceUserId is required' });
            }
            
            await refreshDeviceUsersCache();
            const exists = deviceUsersCache.some(u => parseInt(u.userId, 10) === parseInt(deviceUserId, 10)) || parseInt(deviceUserId, 10) === 999;
            if (!exists) {
                logger.warn(`[Simulator] Scan rejected: User ID ${deviceUserId} is not enrolled on device memory.`);
                return res.json({ success: false, reason: 'not_enrolled', message: `Device User ID ${deviceUserId} is not enrolled on device memory.` });
            }

            const timestamp = new Date().toISOString();
            
            // Filter duplicate locally
            const logTime = new Date(timestamp).getTime();
            const lastTime = lastProcessedTimestamp ? new Date(lastProcessedTimestamp).getTime() : 0;
            let isDuplicate = false;
            if (logTime < lastTime) {
                isDuplicate = true;
            } else if (logTime === lastTime) {
                const id = `${deviceUserId}-${timestamp}`;
                if (processedScansAtLastTimestamp.has(id)) {
                    isDuplicate = true;
                }
            }

            if (isDuplicate) {
                logger.warn(`[Simulator] Rejected duplicate scan for User ID ${deviceUserId} at ${timestamp}`);
                return res.json({ success: false, reason: 'duplicate', message: 'Scan already processed.' });
            }

            const result = await handleCheckIn(deviceUserId, timestamp);
            if (result && result.processed === true) {
                markScanAsProcessed(deviceUserId, timestamp);
            }
            res.json(result);
        });

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

        // Run db sync tasks (deletions, enrollments) in simulation mode at configurable interval
        setInterval(async () => {
            isSyncing = true;
            try {
                await syncBiometricEnrollments();
                await processPendingDeviceDeletions();
            } catch (err) {
                logger.error('[-] Error in simulation sync loop:', err);
            } finally {
                isSyncing = false;
            }
        }, DEVICE_SYNC_INTERVAL);

        app.listen(SIMULATOR_PORT, () => {
            logger.info(`[+] Simulation Server listening on http://localhost:${SIMULATOR_PORT}`);
            logger.info(`[+] Send POST requests to http://localhost:${SIMULATOR_PORT}/simulate-scan`);
        });

    } else {
        await connectToK40();
    }
}

// Process Crash & Termination Management
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception crash event:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection crash event at promise:', new Error(String(reason)));
    process.exit(1);
});

const shutdown = async (signal) => {
    logger.info(`\n[-] Shutdown event: Sync Agent terminating via ${signal}. Updating device status...`);
    
    if (healthCheckInterval) clearInterval(healthCheckInterval);
    if (memberStatusInterval) clearInterval(memberStatusInterval);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    
    await cleanupConnection();
    
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

run();
