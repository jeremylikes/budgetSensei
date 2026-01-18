// Data Migration Utility Route
// Manually trigger data migration to admin user (for troubleshooting)

const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../db/database');
const { columnExists } = require('../db/helpers');
const { requireAuth, getCurrentUserId } = require('../middleware/auth');

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
        
        res.json(status);
    } catch (error) {
        console.error('Error getting migration status:', error);
        res.status(500).json({ error: 'Failed to get migration status', details: error.message });
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
