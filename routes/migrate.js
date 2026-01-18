// Data Migration Utility Route
// Manually trigger data migration to admin user (for troubleshooting)

const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../db/database');
const { columnExists } = require('../db/helpers');
const { requireAuth, getCurrentUserId } = require('../middleware/auth');

// Diagnostic endpoint - list all categories for debugging
router.get('/api/debug/categories', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const currentUserId = getCurrentUserId(req);
        const allCategories = db.exec(`SELECT id, name, type, user_id FROM categories ORDER BY name`);
        const userCategories = db.exec(`SELECT id, name, type, user_id FROM categories WHERE user_id = ${currentUserId} ORDER BY name`);
        
        res.json({
            currentUserId: currentUserId,
            allCategories: allCategories[0] ? allCategories[0].values.map(row => ({
                id: row[0],
                name: row[1],
                type: row[2],
                user_id: row[3]
            })) : [],
            userCategories: userCategories[0] ? userCategories[0].values.map(row => ({
                id: row[0],
                name: row[1],
                type: row[2],
                user_id: row[3]
            })) : []
        });
    } catch (error) {
        console.error('Error getting categories debug info:', error);
        res.status(500).json({ error: 'Failed to get categories debug info', details: error.message });
    }
});

// Purge endpoint - delete all categories for the current user
router.delete('/api/debug/categories', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const currentUserId = getCurrentUserId(req);
        
        // Get count before deletion
        const countCheck = db.exec(`SELECT COUNT(*) FROM categories WHERE user_id = ${currentUserId}`);
        const count = countCheck[0] && countCheck[0].values.length > 0 ? countCheck[0].values[0][0] : 0;
        
        // Delete all categories for this user
        db.run(`DELETE FROM categories WHERE user_id = ${currentUserId}`);
        saveDatabase();
        
        console.log(`Purged ${count} categories for user ${currentUserId}`);
        
        res.json({
            success: true,
            message: `Deleted ${count} categories for user ${currentUserId}`,
            deletedCount: count
        });
    } catch (error) {
        console.error('Error purging categories:', error);
        res.status(500).json({ error: 'Failed to purge categories', details: error.message });
    }
});

// Diagnostic endpoint - check migration status
router.get('/api/migrate-status', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const currentUserId = getCurrentUserId(req);
        const status = {
            currentUser: {
                id: currentUserId,
                username: req.user ? req.user.username : 'unknown'
            },
            adminUser: null,
            dataCounts: {
                transactions: { total: 0, withUserId: 0, withoutUserId: 0, forCurrentUser: 0 },
                categories: { total: 0, withUserId: 0, withoutUserId: 0, forCurrentUser: 0 },
                methods: { total: 0, withUserId: 0, withoutUserId: 0, forCurrentUser: 0 },
                budgets: { total: 0, withUserId: 0, withoutUserId: 0, forCurrentUser: 0 }
            }
        };
        
        // Check admin user
        const adminCheck = db.exec("SELECT id, username FROM users WHERE username = 'admin'");
        if (adminCheck[0] && adminCheck[0].values.length > 0) {
            status.adminUser = {
                id: adminCheck[0].values[0][0],
                username: adminCheck[0].values[0][1]
            };
        }
        
        // Check transactions
        if (columnExists('transactions', 'user_id', db)) {
            const total = db.exec("SELECT COUNT(*) FROM transactions");
            status.dataCounts.transactions.total = total[0] && total[0].values.length > 0 ? total[0].values[0][0] : 0;
            
            const withUserId = db.exec("SELECT COUNT(*) FROM transactions WHERE user_id IS NOT NULL");
            status.dataCounts.transactions.withUserId = withUserId[0] && withUserId[0].values.length > 0 ? withUserId[0].values[0][0] : 0;
            
            const withoutUserId = db.exec("SELECT COUNT(*) FROM transactions WHERE user_id IS NULL");
            status.dataCounts.transactions.withoutUserId = withoutUserId[0] && withoutUserId[0].values.length > 0 ? withoutUserId[0].values[0][0] : 0;
            
            if (currentUserId) {
                const forUser = db.exec(`SELECT COUNT(*) FROM transactions WHERE user_id = ${currentUserId}`);
                status.dataCounts.transactions.forCurrentUser = forUser[0] && forUser[0].values.length > 0 ? forUser[0].values[0][0] : 0;
            }
        } else {
            // Column doesn't exist - get total count
            const total = db.exec("SELECT COUNT(*) FROM transactions");
            status.dataCounts.transactions.total = total[0] && total[0].values.length > 0 ? total[0].values[0][0] : 0;
        }
        
        // Check categories
        if (columnExists('categories', 'user_id', db)) {
            const total = db.exec("SELECT COUNT(*) FROM categories");
            status.dataCounts.categories.total = total[0] && total[0].values.length > 0 ? total[0].values[0][0] : 0;
            
            const withUserId = db.exec("SELECT COUNT(*) FROM categories WHERE user_id IS NOT NULL");
            status.dataCounts.categories.withUserId = withUserId[0] && withUserId[0].values.length > 0 ? withUserId[0].values[0][0] : 0;
            
            const withoutUserId = db.exec("SELECT COUNT(*) FROM categories WHERE user_id IS NULL");
            status.dataCounts.categories.withoutUserId = withoutUserId[0] && withoutUserId[0].values.length > 0 ? withoutUserId[0].values[0][0] : 0;
            
            if (currentUserId) {
                const forUser = db.exec(`SELECT COUNT(*) FROM categories WHERE user_id = ${currentUserId}`);
                status.dataCounts.categories.forCurrentUser = forUser[0] && forUser[0].values.length > 0 ? forUser[0].values[0][0] : 0;
            }
        } else {
            const total = db.exec("SELECT COUNT(*) FROM categories");
            status.dataCounts.categories.total = total[0] && total[0].values.length > 0 ? total[0].values[0][0] : 0;
        }
        
        // Check methods
        if (columnExists('methods', 'user_id', db)) {
            const total = db.exec("SELECT COUNT(*) FROM methods");
            status.dataCounts.methods.total = total[0] && total[0].values.length > 0 ? total[0].values[0][0] : 0;
            
            const withUserId = db.exec("SELECT COUNT(*) FROM methods WHERE user_id IS NOT NULL");
            status.dataCounts.methods.withUserId = withUserId[0] && withUserId[0].values.length > 0 ? withUserId[0].values[0][0] : 0;
            
            const withoutUserId = db.exec("SELECT COUNT(*) FROM methods WHERE user_id IS NULL");
            status.dataCounts.methods.withoutUserId = withoutUserId[0] && withoutUserId[0].values.length > 0 ? withoutUserId[0].values[0][0] : 0;
            
            if (currentUserId) {
                const forUser = db.exec(`SELECT COUNT(*) FROM methods WHERE user_id = ${currentUserId}`);
                status.dataCounts.methods.forCurrentUser = forUser[0] && forUser[0].values.length > 0 ? forUser[0].values[0][0] : 0;
            }
        } else {
            const total = db.exec("SELECT COUNT(*) FROM methods");
            status.dataCounts.methods.total = total[0] && total[0].values.length > 0 ? total[0].values[0][0] : 0;
        }
        
        // Check budgets
        if (columnExists('budgets', 'user_id', db)) {
            const total = db.exec("SELECT COUNT(*) FROM budgets");
            status.dataCounts.budgets.total = total[0] && total[0].values.length > 0 ? total[0].values[0][0] : 0;
            
            const withUserId = db.exec("SELECT COUNT(*) FROM budgets WHERE user_id IS NOT NULL");
            status.dataCounts.budgets.withUserId = withUserId[0] && withUserId[0].values.length > 0 ? withUserId[0].values[0][0] : 0;
            
            const withoutUserId = db.exec("SELECT COUNT(*) FROM budgets WHERE user_id IS NULL");
            status.dataCounts.budgets.withoutUserId = withoutUserId[0] && withoutUserId[0].values.length > 0 ? withoutUserId[0].values[0][0] : 0;
            
            if (currentUserId) {
                const forUser = db.exec(`SELECT COUNT(*) FROM budgets WHERE user_id = ${currentUserId}`);
                status.dataCounts.budgets.forCurrentUser = forUser[0] && forUser[0].values.length > 0 ? forUser[0].values[0][0] : 0;
            }
        } else {
            const total = db.exec("SELECT COUNT(*) FROM budgets");
            status.dataCounts.budgets.total = total[0] && total[0].values.length > 0 ? total[0].values[0][0] : 0;
        }
        
        // Check UNIQUE constraint status
        try {
            const categoriesTableInfo = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='categories'");
            const categoriesCreateStatement = categoriesTableInfo[0] && categoriesTableInfo[0].values.length > 0 ? categoriesTableInfo[0].values[0][0] : '';
            const hasOldConstraint = categoriesCreateStatement.includes('UNIQUE(name, type)') || 
                                    categoriesCreateStatement.includes('UNIQUE (name, type)') ||
                                    (categoriesCreateStatement.includes('UNIQUE') && !categoriesCreateStatement.includes('user_id'));
            const hasNewConstraint = categoriesCreateStatement.includes('UNIQUE(name, type, user_id)') || 
                                     categoriesCreateStatement.includes('UNIQUE (name, type, user_id)');
            
            status.categoriesConstraint = {
                includesUserId: hasNewConstraint,
                hasOldConstraint: hasOldConstraint && !hasNewConstraint,
                needsMigration: hasOldConstraint && !hasNewConstraint,
                createStatement: categoriesCreateStatement
            };
            
            const methodsTableInfo = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='methods'");
            const methodsCreateStatement = methodsTableInfo[0] && methodsTableInfo[0].values.length > 0 ? methodsTableInfo[0].values[0][0] : '';
            const methodsHasOldConstraint = methodsCreateStatement.includes('UNIQUE(name)') || 
                                             methodsCreateStatement.includes('name TEXT UNIQUE') ||
                                             (methodsCreateStatement.includes('UNIQUE') && !methodsCreateStatement.includes('user_id'));
            const methodsHasNewConstraint = methodsCreateStatement.includes('UNIQUE(name, user_id)') || 
                                            methodsCreateStatement.includes('UNIQUE (name, user_id)');
            
            status.methodsConstraint = {
                includesUserId: methodsHasNewConstraint,
                hasOldConstraint: methodsHasOldConstraint && !methodsHasNewConstraint,
                needsMigration: methodsHasOldConstraint && !methodsHasNewConstraint,
                createStatement: methodsCreateStatement
            };
        } catch (error) {
            console.error('Error checking constraint status:', error);
        }
        
        res.json(status);
    } catch (error) {
        console.error('Error getting migration status:', error);
        res.status(500).json({ error: 'Failed to get migration status', details: error.message });
    }
});

// Manual endpoint to fix UNIQUE constraints (requires authentication)
router.post('/api/migrate-constraints', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const { saveDatabase } = require('../db/database');
        const { columnExists } = require('../db/helpers');
        const force = req.body.force === true; // Allow forcing migration even if detection fails
        const results = {
            categories: { fixed: false, error: null, createStatement: null },
            methods: { fixed: false, error: null, createStatement: null }
        };
        
        // Fix categories UNIQUE constraint
        try {
            const categoriesTableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'");
            if (categoriesTableCheck[0] && categoriesTableCheck[0].values.length > 0) {
                const tableInfo = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='categories'");
                const createStatement = tableInfo[0] && tableInfo[0].values.length > 0 ? tableInfo[0].values[0][0] : '';
                results.categories.createStatement = createStatement;
                
                const hasOldConstraint = createStatement.includes('UNIQUE(name, type)') || 
                                        createStatement.includes('UNIQUE (name, type)') ||
                                        (createStatement.includes('UNIQUE') && !createStatement.includes('user_id'));
                const hasNewConstraint = createStatement.includes('UNIQUE(name, type, user_id)') || 
                                         createStatement.includes('UNIQUE (name, type, user_id)');
                
                console.log('Categories constraint check:', {
                    hasOldConstraint,
                    hasNewConstraint,
                    createStatement: createStatement.substring(0, 200) + '...'
                });
                
                // Force migration if requested, or if old constraint detected
                if (force || (createStatement && hasOldConstraint && !hasNewConstraint)) {
                    console.log('Fixing categories table UNIQUE constraint to include user_id...');
                    
                    // Create new table with correct constraint
                    db.run(`
                        CREATE TABLE categories_new (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            type TEXT NOT NULL,
                            icon TEXT,
                            user_id INTEGER,
                            UNIQUE(name, type, user_id)
                        )
                    `);
                    
                    // Copy all data from old table to new table
                    db.run(`
                        INSERT INTO categories_new (id, name, type, icon, user_id)
                        SELECT id, name, type, COALESCE(icon, ''), COALESCE(user_id, NULL) FROM categories
                    `);
                    
                    // Drop old table
                    db.run(`DROP TABLE categories`);
                    
                    // Rename new table
                    db.run(`ALTER TABLE categories_new RENAME TO categories`);
                    
                    saveDatabase();
                    results.categories.fixed = true;
                    console.log('✓ Categories UNIQUE constraint fixed');
                } else if (force) {
                    // Force migration even if detection didn't work
                    console.log('Force migrating categories table UNIQUE constraint...');
                    
                    // Create new table with correct constraint
                    db.run(`
                        CREATE TABLE categories_new (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            type TEXT NOT NULL,
                            icon TEXT,
                            user_id INTEGER,
                            UNIQUE(name, type, user_id)
                        )
                    `);
                    
                    // Copy all data from old table to new table
                    db.run(`
                        INSERT INTO categories_new (id, name, type, icon, user_id)
                        SELECT id, name, type, COALESCE(icon, ''), COALESCE(user_id, NULL) FROM categories
                    `);
                    
                    // Drop old table
                    db.run(`DROP TABLE categories`);
                    
                    // Rename new table
                    db.run(`ALTER TABLE categories_new RENAME TO categories`);
                    
                    saveDatabase();
                    results.categories.fixed = true;
                    console.log('✓ Categories UNIQUE constraint fixed (forced)');
                } else {
                    results.categories.fixed = false;
                    results.categories.message = hasNewConstraint ? 'Already has correct constraint' : 'No constraint found - use {"force": true} in request body to force migration';
                }
            }
        } catch (error) {
            console.error('Error fixing categories constraint:', error);
            results.categories.error = error.message;
        }
        
        // Fix methods UNIQUE constraint
        try {
            const methodsTableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='methods'");
            if (methodsTableCheck[0] && methodsTableCheck[0].values.length > 0) {
                const tableInfo = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='methods'");
                const createStatement = tableInfo[0] && tableInfo[0].values.length > 0 ? tableInfo[0].values[0][0] : '';
                
                const hasOldConstraint = createStatement.includes('UNIQUE(name)') || 
                                         createStatement.includes('name TEXT UNIQUE') ||
                                         (createStatement.includes('UNIQUE') && !createStatement.includes('user_id'));
                const hasNewConstraint = createStatement.includes('UNIQUE(name, user_id)') || 
                                         createStatement.includes('UNIQUE (name, user_id)');
                
                if (createStatement && hasOldConstraint && !hasNewConstraint) {
                    console.log('Fixing methods table UNIQUE constraint to include user_id...');
                    
                    // Create new table with correct constraint
                    db.run(`
                        CREATE TABLE methods_new (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            user_id INTEGER,
                            UNIQUE(name, user_id)
                        )
                    `);
                    
                    // Copy all data from old table to new table
                    db.run(`
                        INSERT INTO methods_new (id, name, user_id)
                        SELECT id, name, COALESCE(user_id, NULL) FROM methods
                    `);
                    
                    // Drop old table
                    db.run(`DROP TABLE methods`);
                    
                    // Rename new table
                    db.run(`ALTER TABLE methods_new RENAME TO methods`);
                    
                    saveDatabase();
                    results.methods.fixed = true;
                    console.log('✓ Methods UNIQUE constraint fixed');
                } else if (force) {
                    // Force migration even if detection didn't work
                    console.log('Force migrating methods table UNIQUE constraint...');
                    
                    // Create new table with correct constraint
                    db.run(`
                        CREATE TABLE methods_new (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            user_id INTEGER,
                            UNIQUE(name, user_id)
                        )
                    `);
                    
                    // Copy all data from old table to new table
                    db.run(`
                        INSERT INTO methods_new (id, name, user_id)
                        SELECT id, name, COALESCE(user_id, NULL) FROM methods
                    `);
                    
                    // Drop old table
                    db.run(`DROP TABLE methods`);
                    
                    // Rename new table
                    db.run(`ALTER TABLE methods_new RENAME TO methods`);
                    
                    saveDatabase();
                    results.methods.fixed = true;
                    console.log('✓ Methods UNIQUE constraint fixed (forced)');
                } else {
                    results.methods.fixed = false;
                    results.methods.message = hasNewConstraint ? 'Already has correct constraint' : 'No constraint found - use {"force": true} in request body to force migration';
                }
            }
        } catch (error) {
            console.error('Error fixing methods constraint:', error);
            results.methods.error = error.message;
        }
        
        res.json({
            success: true,
            message: 'Constraint migration completed',
            results: results
        });
    } catch (error) {
        console.error('Error migrating constraints:', error);
        res.status(500).json({ error: 'Failed to migrate constraints', details: error.message });
    }
});

// Manual migration endpoint (admin only - requires authentication)
router.post('/api/migrate-data', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        // Get admin user ID (or use current user if they're admin)
        const currentUserId = getCurrentUserId(req);
        const adminCheck = db.exec("SELECT id FROM users WHERE username = 'admin'");
        let adminUserId = null;
        
        if (!adminCheck[0] || adminCheck[0].values.length === 0) {
            // Admin doesn't exist - check if current user is admin by username
            const currentUserCheck = db.exec(`SELECT id, username FROM users WHERE id = ${currentUserId}`);
            if (currentUserCheck[0] && currentUserCheck[0].values.length > 0) {
                const username = currentUserCheck[0].values[0][1];
                if (username === 'admin') {
                    adminUserId = currentUserId;
                } else {
                    return res.status(404).json({ error: 'Admin user not found and current user is not admin' });
                }
            } else {
                return res.status(404).json({ error: 'Admin user not found' });
            }
        } else {
            adminUserId = adminCheck[0].values[0][0];
        }
        const results = {
            transactions: 0,
            categories: 0,
            methods: 0,
            budgets: 0
        };
        
        // Migrate transactions - ensure user_id column exists first
        if (!columnExists('transactions', 'user_id', db)) {
            const { ensureColumn } = require('../db/helpers');
            ensureColumn('transactions', 'user_id', 'INTEGER', db);
        }
        const transactionCheck = db.exec("SELECT COUNT(*) FROM transactions WHERE user_id IS NULL");
        const transactionCount = transactionCheck[0] && transactionCheck[0].values.length > 0 ? transactionCheck[0].values[0][0] : 0;
        if (transactionCount > 0) {
            db.run(`UPDATE transactions SET user_id = ${adminUserId} WHERE user_id IS NULL`);
            results.transactions = transactionCount;
            console.log(`Migrated ${transactionCount} transactions to admin user`);
        }
        
        // Migrate categories - ensure user_id column exists first
        if (!columnExists('categories', 'user_id', db)) {
            const { ensureColumn } = require('../db/helpers');
            ensureColumn('categories', 'user_id', 'INTEGER', db);
        }
        const categoryCheck = db.exec("SELECT COUNT(*) FROM categories WHERE user_id IS NULL");
        const categoryCount = categoryCheck[0] && categoryCheck[0].values.length > 0 ? categoryCheck[0].values[0][0] : 0;
        if (categoryCount > 0) {
            db.run(`UPDATE categories SET user_id = ${adminUserId} WHERE user_id IS NULL`);
            results.categories = categoryCount;
            console.log(`Migrated ${categoryCount} categories to admin user`);
        }
        
        // Migrate methods - ensure user_id column exists first
        if (!columnExists('methods', 'user_id', db)) {
            const { ensureColumn } = require('../db/helpers');
            ensureColumn('methods', 'user_id', 'INTEGER', db);
        }
        const methodCheck = db.exec("SELECT COUNT(*) FROM methods WHERE user_id IS NULL");
        const methodCount = methodCheck[0] && methodCheck[0].values.length > 0 ? methodCheck[0].values[0][0] : 0;
        if (methodCount > 0) {
            db.run(`UPDATE methods SET user_id = ${adminUserId} WHERE user_id IS NULL`);
            results.methods = methodCount;
            console.log(`Migrated ${methodCount} methods to admin user`);
        }
        
        // Migrate budgets - ensure user_id column exists first
        if (!columnExists('budgets', 'user_id', db)) {
            const { ensureColumn } = require('../db/helpers');
            ensureColumn('budgets', 'user_id', 'INTEGER', db);
        }
        const budgetCheck = db.exec("SELECT COUNT(*) FROM budgets WHERE user_id IS NULL");
        const budgetCount = budgetCheck[0] && budgetCheck[0].values.length > 0 ? budgetCheck[0].values[0][0] : 0;
        if (budgetCount > 0) {
            db.run(`UPDATE budgets SET user_id = ${adminUserId} WHERE user_id IS NULL`);
            results.budgets = budgetCount;
            console.log(`Migrated ${budgetCount} budgets to admin user`);
        }
        
        saveDatabase();
        
        res.json({ 
            success: true, 
            message: 'Data migration completed',
            migrated: results
        });
    } catch (error) {
        console.error('Error migrating data:', error);
        res.status(500).json({ error: 'Failed to migrate data', details: error.message });
    }
});

module.exports = router;
