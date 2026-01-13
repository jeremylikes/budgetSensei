// Database Configuration
// Determines database file path based on environment

const path = require('path');
const fs = require('fs');

// Determine database file path - use persistent storage if available
// Local development always uses a separate local database file to avoid affecting production
// Priority: 1) DB_PATH env var, 2) /data directory (production - most reliable), 3) Local dev detection, 4) /tmp, 5) project directory
let DB_DIR;
let DB_FILENAME = 'budget.db';

// Check if we're in local development mode
// Local dev: NODE_ENV not set to 'production' AND /data doesn't exist (and no explicit DB_PATH)
// The /data check is most reliable - it only exists on Render with mounted persistent disk
const isLocalDev = process.env.NODE_ENV !== 'production' && !fs.existsSync('/data') && !process.env.DB_PATH;

if (process.env.DB_PATH) {
    // Explicit path set via environment variable (production/cloud)
    DB_DIR = process.env.DB_PATH;
} else if (fs.existsSync('/data')) {
    // Production: /data directory exists (Render with persistent disk) - most reliable indicator
    DB_DIR = '/data';
} else if (isLocalDev) {
    // Local development - use project directory with separate local filename
    DB_DIR = path.join(__dirname, '..'); // Go up one level from config/ to project root
    DB_FILENAME = 'budget-local.db'; // Separate file for local dev - won't affect production
} else if (fs.existsSync('/tmp')) {
    // Fallback: /tmp directory
    DB_DIR = '/tmp';
} else {
    // Final fallback: project directory
    DB_DIR = path.join(__dirname, '..'); // Go up one level from config/ to project root
}

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
    try {
        fs.mkdirSync(DB_DIR, { recursive: true });
    } catch (error) {
        console.warn(`Could not create DB directory ${DB_DIR}, using project directory`);
        DB_DIR = __dirname + '/..';
    }
}

const DB_FILE = path.join(DB_DIR, DB_FILENAME);

module.exports = {
    DB_DIR,
    DB_FILENAME,
    DB_FILE,
    isLocalDev
};
