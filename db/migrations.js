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
        const noteAdded = ensureColumn('transactions', 'note', 'TEXT', db);
        if (noteAdded) {
            console.log('✓ Migration completed: note column added');
        } else {
            console.log('✓ Migration check completed: note column already exists');
        }
        
        // Migration: Add 'type' column to categories table
        const typeColumnAdded = ensureColumn('categories', 'type', 'TEXT', db);
        if (typeColumnAdded) {
            console.log('✓ Migration completed: type column added to categories');
            
            // Set default types for existing categories
            // Try to infer from existing transactions, or default to Expense
            try {
                const allCategories = db.exec("SELECT id, name FROM categories");
                if (allCategories[0] && allCategories[0].values.length > 0) {
                    const { escapeSql } = require('./helpers');
                    allCategories[0].values.forEach(row => {
                        const catId = row[0];
                        const catName = row[1];
                        
                        // Check if category is used in transactions as Income
                        const incomeCheck = db.exec(`SELECT COUNT(*) FROM transactions WHERE category = '${escapeSql(catName)}' AND type = 'Income'`);
                        const expenseCheck = db.exec(`SELECT COUNT(*) FROM transactions WHERE category = '${escapeSql(catName)}' AND type = 'Expense'`);
                        
                        const incomeCount = incomeCheck[0] && incomeCheck[0].values.length > 0 ? incomeCheck[0].values[0][0] : 0;
                        const expenseCount = expenseCheck[0] && expenseCheck[0].values.length > 0 ? expenseCheck[0].values[0][0] : 0;
                        
                        // Infer type from usage, default to Expense
                        let categoryType = 'Expense';
                        if (incomeCount > expenseCount) {
                            categoryType = 'Income';
                        } else if (catName.toLowerCase().includes('income') || catName.toLowerCase().includes('salary') || catName.toLowerCase().includes('pay')) {
                            categoryType = 'Income';
                        }
                        
                        db.run(`UPDATE categories SET type = '${categoryType}' WHERE id = ${catId}`);
                    });
                    saveDatabase();
                    console.log('✓ Migration completed: Set types for existing categories');
                }
            } catch (error) {
                console.error('Error setting category types:', error);
            }
        } else {
            console.log('✓ Migration check completed: type column already exists');
        }
        
        // Migration: Ensure "Default" categories exist (one for Income, one for Expense)
        // Only do this if type column exists (check after ensureColumn)
        if (columnExists('categories', 'type', db)) {
            const { escapeSql } = require('./helpers');
            try {
                const defaultIncomeCheck = db.exec("SELECT id FROM categories WHERE name = 'Default' AND type = 'Income'");
                if (!defaultIncomeCheck[0] || defaultIncomeCheck[0].values.length === 0) {
                    db.run("INSERT INTO categories (name, type) VALUES ('Default', 'Income')");
                    saveDatabase();
                    console.log('✓ Migration completed: Default Income category added');
                }
            } catch (error) {
                console.error('Error adding Default Income category:', error);
            }
            
            try {
                const defaultExpenseCheck = db.exec("SELECT id FROM categories WHERE name = 'Default' AND type = 'Expense'");
                if (!defaultExpenseCheck[0] || defaultExpenseCheck[0].values.length === 0) {
                    db.run("INSERT INTO categories (name, type) VALUES ('Default', 'Expense')");
                    saveDatabase();
                    console.log('✓ Migration completed: Default Expense category added');
                }
            } catch (error) {
                console.error('Error adding Default Expense category:', error);
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
        
        // Migration: Add 'icon' column to categories table
        const iconColumnAdded = ensureColumn('categories', 'icon', 'TEXT', db);
        if (iconColumnAdded) {
            console.log('✓ Migration completed: icon column added to categories');
        } else {
            console.log('✓ Migration check completed: icon column already exists');
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
