/**
 * Gym Management System - Supabase Data Exporter
 * Connects to the live Supabase instance using the environment credentials
 * and exports all rows from all tables in paginated batches.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[-] Error: SUPABASE_URL and SUPABASE_KEY must be defined in the environment.');
    process.exit(1);
}

const ws = require('ws');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    realtime: { transport: ws }
});

const TABLES = [
    'members',
    'subscriptions',
    'payments',
    'attendance',
    'biometric_devices',
    'biometric_enrollments',
    'biometric_attendance_logs',
    'pending_device_deletions'
];

const OUTPUT_DIR = path.join(__dirname, '..', 'migration-data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'data.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function exportTable(tableName) {
    console.log(`[*] Exporting table: ${tableName}...`);
    let allRows = [];
    let page = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const from = page * batchSize;
        const to = from + batchSize - 1;

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .range(from, to)
            .order('id', { ascending: true });

        if (error) {
            console.error(`[-] Error fetching ${tableName} (range ${from}-${to}):`, error.message);
            throw error;
        }

        if (data && data.length > 0) {
            allRows = allRows.concat(data);
            console.log(`    Fetched ${allRows.length} rows so far...`);
            if (data.length < batchSize) {
                hasMore = false;
            } else {
                page++;
            }
        } else {
            hasMore = false;
        }
    }

    console.log(`[+] Completed export of ${tableName}: ${allRows.length} rows total.`);
    return allRows;
}

async function run() {
    console.log('==================================================');
    console.log('       Supabase Production Data Exporter          ');
    console.log('==================================================');
    console.log(`Source URL: ${SUPABASE_URL}`);
    console.log(`Target Output: ${OUTPUT_FILE}`);

    const exportPayload = {
        exportedAt: new Date().toISOString(),
        sourceUrl: SUPABASE_URL,
        tables: {}
    };

    try {
        // Query the current sequence value first
        console.log('[*] Querying current value of device_user_id_seq...');
        // We do this via RPC if possible or we fall back to finding MAX(device_user_id) + 1
        const { data: seqData, error: seqError } = await supabase
            .from('biometric_enrollments')
            .select('device_user_id')
            .order('device_user_id', { ascending: false })
            .limit(1);

        let sequenceValue = 1000; // default fallback
        if (!seqError && seqData && seqData.length > 0) {
            sequenceValue = seqData[0].device_user_id;
        }
        exportPayload.device_user_id_seq_val = sequenceValue;
        console.log(`[+] Set sequence fallback target value to: ${sequenceValue}`);

        // Export each table
        for (const tableName of TABLES) {
            exportPayload.tables[tableName] = await exportTable(tableName);
        }

        // Save payload
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(exportPayload, null, 2), 'utf8');
        console.log(`\n[SUCCESS] Export completed successfully!`);
        console.log(`Saved ${fs.statSync(OUTPUT_FILE).size} bytes to ${OUTPUT_FILE}`);
    } catch (err) {
        console.error('\n[FATAL] Export failed:', err);
        process.exit(1);
    }
}

run();
