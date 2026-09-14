/**
 * Gym Management System - Supabase Data Importer
 * Connects to the new Supabase instance and restores all exported data
 * in dependency order to prevent Foreign Key constraint violations.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[-] Error: SUPABASE_URL and SUPABASE_KEY must be defined in the environment.');
    process.exit(1);
}

// Check that the new project is connected (not the oldPausedOne)
console.log('==================================================');
console.log('       Supabase Production Data Importer          ');
console.log('==================================================');
console.log(`Target URL: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    realtime: { transport: ws }
});

const DATA_DIR = path.join(__dirname, '..', 'migration-data');
const BASE_DATA_FILE = path.join(DATA_DIR, 'base_data.json');

// Helper to batch insert records
async function insertInBatches(tableName, records, batchSize = 500) {
    if (!records || records.length === 0) {
        console.log(`[*] No records to import for table: ${tableName}`);
        return;
    }

    console.log(`[*] Importing ${records.length} records into ${tableName}...`);
    
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const { error } = await supabase
            .from(tableName)
            .insert(batch);
            
        if (error) {
            console.error(`[-] Error inserting batch into ${tableName} at index ${i}:`, error.message);
            throw error;
        }
        
        console.log(`    Imported ${Math.min(i + batchSize, records.length)}/${records.length} records.`);
    }
    
    console.log(`[+] Completed import for table: ${tableName}`);
}

async function run() {
    try {
        if (!fs.existsSync(BASE_DATA_FILE)) {
            throw new Error(`Base data file missing at: ${BASE_DATA_FILE}`);
        }

        const baseData = JSON.parse(fs.readFileSync(BASE_DATA_FILE, 'utf8'));

        console.log('\n--- Step 1: Importing Base Tables (Dependency Order) ---');
        
        // 1. Members (parent of subscriptions, payments, attendance, biometric_enrollments)
        await insertInBatches('members', baseData.members);
        
        // 2. Biometric Devices (parent of biometric_attendance_logs)
        await insertInBatches('biometric_devices', baseData.biometric_devices);
        
        // 3. Subscriptions
        await insertInBatches('subscriptions', baseData.subscriptions);
        
        // 4. Payments
        await insertInBatches('payments', baseData.payments);
        
        // 5. Attendance
        await insertInBatches('attendance', baseData.attendance);
        
        // 6. Biometric Enrollments
        await insertInBatches('biometric_enrollments', baseData.biometric_enrollments);
        
        // 7. Pending Device Deletions
        await insertInBatches('pending_device_deletions', baseData.pending_device_deletions);

        console.log('\n--- Step 2: Importing Biometric Attendance Logs (Chunked) ---');
        
        let chunkIndex = 1;
        const importedLogIds = new Set();
        
        while (true) {
            const chunkFile = path.join(DATA_DIR, `logs_chunk_${chunkIndex}.json`);
            if (!fs.existsSync(chunkFile)) {
                console.log(`[*] No more log chunks found (finished at chunk ${chunkIndex - 1}).`);
                break;
            }
            
            console.log(`\n[*] Reading log chunk ${chunkIndex} from ${chunkFile}...`);
            const chunkData = JSON.parse(fs.readFileSync(chunkFile, 'utf8'));
            
            // Deduplicate logs in memory based on UUID primary key
            const uniqueChunkData = [];
            for (const r of chunkData) {
                if (!importedLogIds.has(r.id)) {
                    importedLogIds.add(r.id);
                    uniqueChunkData.push(r);
                }
            }
            
            console.log(`[*] Chunk ${chunkIndex} has ${uniqueChunkData.length} unique records (filtered out ${chunkData.length - uniqueChunkData.length} duplicate overlaps).`);
            
            await insertInBatches('biometric_attendance_logs', uniqueChunkData, 1000);
            chunkIndex++;
        }

        console.log('\n==================================================');
        console.log('   [SUCCESS] All data has been successfully imported! ');
        console.log('==================================================');
        console.log('\n👉 CRITICAL POST-IMPORT SQL STEP:');
        console.log('Please execute the following SQL in the Supabase Dashboard SQL Editor of the NEW project to realign the keypad user ID sequence:');
        console.log(`\n   SELECT setval('device_user_id_seq', (SELECT COALESCE(MAX(device_user_id), 1000) FROM biometric_enrollments) + 1);\n`);

    } catch (err) {
        console.error('\n[FATAL] Import failed:', err);
        process.exit(1);
    }
}

run();
