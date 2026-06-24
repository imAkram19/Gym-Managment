const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, 'logs');
const APP_LOG_PATH = path.join(LOGS_DIR, 'application.log');
const ERR_LOG_PATH = path.join(LOGS_DIR, 'errors.log');
const CLEAN_SHUTDOWN_PATH = path.join(LOGS_DIR, 'shutdown.clean');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function formatMessage(level, message) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return `[${timestamp}] [${level}] ${message}\n`;
}

function writeToLog(filePath, data) {
    try {
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

module.exports = logger;
