// Database Helper Functions

// Helper function to check if a column exists in a table
function columnExists(tableName, columnName, db = null) {
    // If db not provided, try to get it (for backward compatibility)
    if (!db) {
        try {
            const { getDb } = require('./database');
            db = getDb();
        } catch (error) {
            console.error('Error getting database in columnExists:', error);
            return false;
        }
    }
    
    if (!db) return false;
    
    try {
        const result = db.exec(`PRAGMA table_info(${tableName})`);
        if (!result[0] || result[0].values.length === 0) {
            return false;
        }
        const columns = result[0].values.map(row => row[1]);
        return columns.includes(columnName);
    } catch (error) {
        console.error(`Error checking column ${columnName} in ${tableName}:`, error);
        return false;
    }
}

// Helper function to add a column to a table if it doesn't exist
function ensureColumn(tableName, columnName, columnDefinition, db = null) {
    // If db not provided, try to get it (for backward compatibility)
    if (!db) {
        try {
            const { getDb, saveDatabase } = require('./database');
            db = getDb();
            if (!db) return false;
            
            if (!columnExists(tableName, columnName, db)) {
                try {
                    console.log(`Adding column ${columnName} to ${tableName} table...`);
                    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
                    saveDatabase();
                    console.log(`Column ${columnName} added successfully to ${tableName}`);
                    return true;
                } catch (error) {
                    console.error(`Error adding column ${columnName} to ${tableName}:`, error);
                    return false;
                }
            }
            return false; // Column already exists
        } catch (error) {
            console.error('Error getting database in ensureColumn:', error);
            return false;
        }
    }
    
    if (!columnExists(tableName, columnName, db)) {
        try {
            const { saveDatabase } = require('./database');
            console.log(`Adding column ${columnName} to ${tableName} table...`);
            db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
            saveDatabase();
            console.log(`Column ${columnName} added successfully to ${tableName}`);
            return true;
        } catch (error) {
            console.error(`Error adding column ${columnName} to ${tableName}:`, error);
            return false;
        }
    }
    return false; // Column already exists
}

// Helper function to escape SQL strings (preserves multibyte/UTF-8 characters)
function escapeSql(str) {
    if (typeof str !== 'string') return str;
    // Only escape single quotes for SQL injection prevention
    // This preserves all multibyte characters (UTF-8)
    return str.replace(/'/g, "''");
}

module.exports = {
    columnExists,
    ensureColumn,
    escapeSql
};
