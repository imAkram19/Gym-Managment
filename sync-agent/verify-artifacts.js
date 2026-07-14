const fs = require('fs');
const path = require('path');

const migrationDir = path.join(__dirname, '..', 'migration-data');
const syncAgentDir = __dirname;

const filesToVerify = [
    { type: 'sql', path: path.join(migrationDir, 'schema.sql'), description: 'Database Schema DDL' },
    { type: 'json_base', path: path.join(migrationDir, 'base_data.json'), description: 'Base Tables Data' },
    { type: 'json_chunk', path: path.join(migrationDir, 'logs_chunk_1.json'), description: 'Logs Chunk 1' },
    { type: 'json_chunk', path: path.join(migrationDir, 'logs_chunk_2.json'), description: 'Logs Chunk 2' },
    { type: 'json_chunk', path: path.join(migrationDir, 'logs_chunk_3.json'), description: 'Logs Chunk 3' },
    { type: 'json_chunk', path: path.join(migrationDir, 'logs_chunk_4.json'), description: 'Logs Chunk 4' },
    { type: 'json_chunk', path: path.join(migrationDir, 'logs_chunk_5.json'), description: 'Logs Chunk 5' },
    { type: 'json_chunk', path: path.join(migrationDir, 'logs_chunk_6.json'), description: 'Logs Chunk 6' },
    { type: 'script', path: path.join(syncAgentDir, 'import-data.js'), description: 'Data Import Script' },
    { type: 'script', path: path.join(syncAgentDir, 'export-data.js'), description: 'Data Export Script' }
];

console.log('==================================================');
console.log('       Migration Artifact Integrity Verifier       ');
console.log('==================================================');

let hasError = false;

for (const file of filesToVerify) {
    process.stdout.write(`[*] Checking: ${file.description} (${path.basename(file.path)})... `);
    
    // Check existence
    if (!fs.existsSync(file.path)) {
        console.log('❌ MISSING!');
        hasError = true;
        continue;
    }

    // Check readable & size
    try {
        const stats = fs.statSync(file.path);
        if (stats.size === 0) {
            console.log('❌ EMPTY FILE!');
            hasError = true;
            continue;
        }

        // Validate content
        if (file.type === 'sql') {
            const content = fs.readFileSync(file.path, 'utf8');
            if (!content.includes('CREATE TABLE')) {
                console.log('⚠️ WARNING: Schema does not seem to contain table creation definitions.');
                hasError = true;
            } else {
                console.log(`✅ OK (${(stats.size / 1024).toFixed(1)} KB)`);
            }
        } else if (file.type === 'json_base') {
            const content = fs.readFileSync(file.path, 'utf8');
            const data = JSON.parse(content);
            const tables = Object.keys(data);
            const expectedTables = ['members', 'subscriptions', 'payments', 'attendance', 'biometric_devices', 'biometric_enrollments', 'pending_device_deletions'];
            const missing = expectedTables.filter(t => !tables.includes(t));
            
            if (missing.length > 0) {
                console.log(`❌ INVALID (Missing tables in JSON: ${missing.join(', ')})`);
                hasError = true;
            } else {
                const summary = expectedTables.map(t => `${t}: ${data[t].length} rows`).join(', ');
                console.log(`✅ OK (${(stats.size / 1024).toFixed(1)} KB) - ${summary}`);
            }
        } else if (file.type === 'json_chunk') {
            const content = fs.readFileSync(file.path, 'utf8');
            const data = JSON.parse(content);
            if (!Array.isArray(data)) {
                console.log('❌ INVALID (Log chunk is not a JSON array!)');
                hasError = true;
            } else {
                console.log(`✅ OK (${(stats.size / 1024 / 1024).toFixed(2)} MB) - ${data.length} records`);
            }
        } else if (file.type === 'script') {
            const content = fs.readFileSync(file.path, 'utf8');
            if (content.trim().length > 100) {
                console.log(`✅ OK (${stats.size} bytes)`);
            } else {
                console.log('❌ SUSPICIOUSLY SHORT SCRIPT!');
                hasError = true;
            }
        }
    } catch (e) {
        console.log(`❌ ERROR READING/PARSING: ${e.message}`);
        hasError = true;
    }
}

console.log('==================================================');
if (hasError) {
    console.log('❌ INTEGRITY CHECK FAILED! Do not proceed with migration.');
    process.exit(1);
} else {
    console.log('✅ ALL ARTIFACTS VERIFIED AND READY FOR MIGRATION.');
    process.exit(0);
}
