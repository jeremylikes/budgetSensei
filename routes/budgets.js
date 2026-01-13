// Budget Routes
// Handles all budget CRUD operations

const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../db/database');
const { escapeSql } = require('../db/helpers');

// Helper function to ensure budgets table exists (safety fallback)
function ensureBudgetsTable(db) {
    try {
        const check = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='budgets'");
        if (!check[0] || check[0].values.length === 0) {
            console.log('⚠ Budgets table missing - creating it now (migration may have failed)');
            db.run(`
                CREATE TABLE IF NOT EXISTS budgets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category TEXT NOT NULL,
                    year INTEGER NOT NULL,
                    month INTEGER NOT NULL,
                    planned_amount REAL NOT NULL,
                    UNIQUE(category, year, month)
                )
            `);
            saveDatabase();
            console.log('✓ Budgets table created');
        }
    } catch (error) {
        console.error('Error ensuring budgets table exists:', error);
    }
}

// Get budget for a specific month/year
router.get('/api/budgets/:year/:month', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        ensureBudgetsTable(db);
        
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        
        const result = db.exec(`SELECT category, planned_amount FROM budgets WHERE year = ${year} AND month = ${month}`);
        const budgets = {};
        
        if (result[0]) {
            result[0].values.forEach(row => {
                budgets[row[0]] = row[1];
            });
        }
        
        res.json(budgets);
    } catch (error) {
        console.error('Error reading budgets:', error);
        res.status(500).json({ error: 'Failed to read budgets' });
    }
});

// Set budget amount for a category/month/year
router.post('/api/budgets', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        ensureBudgetsTable(db);
        
        const { category, year, month, planned_amount } = req.body;
        
        if (!category || year === undefined || month === undefined || planned_amount === undefined) {
            return res.status(400).json({ error: 'Category, year, month, and planned_amount are required' });
        }
        
        const amount = parseFloat(planned_amount);
        if (isNaN(amount) || amount < 0) {
            return res.status(400).json({ error: 'Planned amount must be a non-negative number' });
        }
        
        // Use INSERT OR REPLACE to update if exists, insert if not
        db.run(`
            INSERT OR REPLACE INTO budgets (category, year, month, planned_amount)
            VALUES ('${escapeSql(category)}', ${year}, ${month}, ${amount})
        `);
        saveDatabase();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving budget:', error);
        res.status(500).json({ error: 'Failed to save budget' });
    }
});

// Delete budget for a category/month/year
router.delete('/api/budgets/:category/:year/:month', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        ensureBudgetsTable(db);
        
        const category = decodeURIComponent(req.params.category);
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        
        db.run(`DELETE FROM budgets WHERE category = '${escapeSql(category)}' AND year = ${year} AND month = ${month}`);
        saveDatabase();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});

module.exports = router;
