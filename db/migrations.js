// Database Migrations
// Handles database schema migrations

const { getDb, saveDatabase } = require('./database');
const { ensureColumn } = require('./helpers');

// Run database migrations
function runMigrations(db) {
    if (!db) {
        console.warn('Database not initialized, skipping migrations');
        return;
    }
    
    try {
        // Verify database is valid by checking if transactions table exists
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'");
        if (!tables[0] || tables[0].values.length === 0) {
            console.log('Transactions table does not exist yet, migrations will run after table creation');
            return;
        }
        
        console.log('Running database migrations...');
        
        // Migration: Add 'note' column to transactions table
        const noteAdded = ensureColumn('transactions', 'note', 'TEXT');
        if (noteAdded) {
            console.log('✓ Migration completed: note column added');
        } else {
            console.log('✓ Migration check completed: note column already exists');
        }
        
        // Migration: Ensure "Default" category exists
        const { escapeSql } = require('./helpers');
        const defaultCatCheck = db.exec("SELECT id FROM categories WHERE name = 'Default'");
        if (!defaultCatCheck[0] || defaultCatCheck[0].values.length === 0) {
            try {
                db.run("INSERT INTO categories (name) VALUES ('Default')");
                saveDatabase();
                console.log('✓ Migration completed: Default category added');
            } catch (error) {
                console.error('Error adding Default category:', error);
            }
        }
        
        // Migration: Ensure "Default" method exists
        const defaultMethodCheck = db.exec("SELECT id FROM methods WHERE name = 'Default'");
        if (!defaultMethodCheck[0] || defaultMethodCheck[0].values.length === 0) {
            try {
                db.run("INSERT INTO methods (name) VALUES ('Default')");
                saveDatabase();
                console.log('✓ Migration completed: Default payment method added');
            } catch (error) {
                console.error('Error adding Default payment method:', error);
            }
        }
        
        // Migration: Create budget table if it doesn't exist
        const budgetTableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='budgets'");
        if (!budgetTableCheck[0] || budgetTableCheck[0].values.length === 0) {
            try {
                console.log('Creating budgets table...');
                db.run(`
                    CREATE TABLE budgets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        category TEXT NOT NULL,
                        year INTEGER NOT NULL,
                        month INTEGER NOT NULL,
                        planned_amount REAL NOT NULL,
                        UNIQUE(category, year, month)
                    )
                `);
                saveDatabase();
                console.log('✓ Migration completed: budgets table created');
                
                // Verify table was created
                const verifyCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='budgets'");
                if (verifyCheck[0] && verifyCheck[0].values.length > 0) {
                    console.log('✓ Verified: budgets table exists');
                } else {
                    console.error('⚠ Warning: budgets table creation may have failed - verification failed');
                }
            } catch (error) {
                console.error('Error creating budgets table:', error);
                console.error('Error details:', error.message);
            }
        } else {
            console.log('✓ Migration check completed: budgets table already exists');
        }
        
        // Add more migrations here as needed in the future
        // Example: ensureColumn('transactions', 'tags', 'TEXT');
        
        console.log('All migrations completed successfully');
    } catch (error) {
        console.error('Error running migrations:', error);
        console.error('Database will continue to function, but some features may not work');
        // Don't throw - allow server to start even if migration fails
    }
}

module.exports = {
    runMigrations
};
