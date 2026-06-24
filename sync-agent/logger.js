const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');
const APP_LOG_PATH = path.join(LOGS_DIR, 'application.log');
const ERR_LOG_PATH = path.join(LOGS_DIR, 'errors.log');
const CLEAN_SHUTDOWN_PATH = path.join(LOGS_DIR, 'shutdown.clean');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function rotateLogFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) return;
        const stats = fs.statSync(filePath);
        if (stats.size < MAX_LOG_SIZE) return;

        // Delete .10 if it exists
        const file10 = `${filePath}.10`;
        if (fs.existsSync(file10)) {
            fs.unlinkSync(file10);
        }

        // Shift existing archive files: .9 -> .10, .8 -> .9, ..., .1 -> .2
        for (let i = 9; i >= 1; i--) {
            const currentArchive = `${filePath}.${i}`;
            const nextArchive = `${filePath}.${i + 1}`;
            if (fs.existsSync(currentArchive)) {
                fs.renameSync(currentArchive, nextArchive);
            }
        }

        // Rename original file to .1
        fs.renameSync(filePath, `${filePath}.1`);
    } catch (err) {
        console.error(`[-] Failed to rotate log file ${filePath}:`, err.message);
    }
}

function writeToLog(filePath, data) {
    try {
        rotateLogFile(filePath);
        fs.appendFileSync(filePath, data, 'utf8');
    } catch (err) {
        console.error(`[-] Failed to write to log file ${filePath}:`, err.message);
    }
}

const logger = {
    info(message) {
        const formatted = formatMessage('INFO', message);
        console.log(message);
        writeToLog(APP_LOG_PATH, formatted);
    },
    warn(message) {
        const formatted = formatMessage('WARN', message);
        console.warn(message);
        writeToLog(APP_LOG_PATH, formatted);
    },
    error(message, errorObject = null) {
        let msg = message;
        if (errorObject) {
            msg += ` - Error: ${errorObject.stack || errorObject.message || errorObject}`;
        }
        const formatted = formatMessage('ERROR', msg);
        console.error(msg);
        writeToLog(APP_LOG_PATH, formatted);
        writeToLog(ERR_LOG_PATH, formatted);
    },
    markCleanShutdown() {
        try {
            fs.writeFileSync(CLEAN_SHUTDOWN_PATH, 'clean', 'utf8');
        } catch (err) {
            console.error('[-] Failed to write clean shutdown file:', err.message);
        }
    },
    checkPreviousShutdown() {
        try {
            if (fs.existsSync(CLEAN_SHUTDOWN_PATH)) {
                const content = fs.readFileSync(CLEAN_SHUTDOWN_PATH, 'utf8').trim();
                fs.unlinkSync(CLEAN_SHUTDOWN_PATH); // remove the file so it's considered dirty for next startup
                return content === 'clean';
            }
        } catch (err) {
            // ignore
        }
        return false; // defaulted to unclean/crashed
    }
};

function formatMessage(level, message) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return `[${timestamp}] [${level}] ${message}\n`;
}

module.exports = logger;
