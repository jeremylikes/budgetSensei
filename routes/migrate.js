// Data Migration Utility Route
// Manually trigger data migration to admin user (for troubleshooting)

const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../db/database');
const { columnExists } = require('../db/helpers');
const { requireAuth } = require('../middleware/auth');

// Manual migration endpoint (admin only - requires authentication)
router.post('/api/migrate-data', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        // Get admin user ID
        const adminCheck = db.exec("SELECT id FROM users WHERE username = 'admin'");
        if (!adminCheck[0] || adminCheck[0].values.length === 0) {
            return res.status(404).json({ error: 'Admin user not found' });
        }
        
        const adminUserId = adminCheck[0].values[0][0];
        const results = {
            transactions: 0,
            categories: 0,
            methods: 0,
            budgets: 0
        };
        
        // Migrate transactions
        if (columnExists('transactions', 'user_id', db)) {
            const check = db.exec("SELECT COUNT(*) FROM transactions WHERE user_id IS NULL");
            const count = check[0] && check[0].values.length > 0 ? check[0].values[0][0] : 0;
            if (count > 0) {
                db.run(`UPDATE transactions SET user_id = ${adminUserId} WHERE user_id IS NULL`);
                results.transactions = count;
            }
        }
        
        // Migrate categories
        if (columnExists('categories', 'user_id', db)) {
            const check = db.exec("SELECT COUNT(*) FROM categories WHERE user_id IS NULL");
            const count = check[0] && check[0].values.length > 0 ? check[0].values[0][0] : 0;
            if (count > 0) {
                db.run(`UPDATE categories SET user_id = ${adminUserId} WHERE user_id IS NULL`);
                results.categories = count;
            }
        }
        
        // Migrate methods
        if (columnExists('methods', 'user_id', db)) {
            const check = db.exec("SELECT COUNT(*) FROM methods WHERE user_id IS NULL");
            const count = check[0] && check[0].values.length > 0 ? check[0].values[0][0] : 0;
            if (count > 0) {
                db.run(`UPDATE methods SET user_id = ${adminUserId} WHERE user_id IS NULL`);
                results.methods = count;
            }
        }
        
        // Migrate budgets
        if (columnExists('budgets', 'user_id', db)) {
            const check = db.exec("SELECT COUNT(*) FROM budgets WHERE user_id IS NULL");
            const count = check[0] && check[0].values.length > 0 ? check[0].values[0][0] : 0;
            if (count > 0) {
                db.run(`UPDATE budgets SET user_id = ${adminUserId} WHERE user_id IS NULL`);
                results.budgets = count;
            }
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
