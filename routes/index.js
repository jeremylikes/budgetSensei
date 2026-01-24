// Main Data Route
// Returns all data (transactions, categories, methods) in one response

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { requireAuth, getCurrentUserId } = require('../middleware/auth');

router.get('/api/data', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        
        // Ensure Default categories exist for this user (for orphaned transactions and fallback)
        const { ensureDefaultCategories } = require('./categories');
        if (ensureDefaultCategories) {
            ensureDefaultCategories(userId, db);
        }
        
        // Check if root_id column exists and use explicit column selection
        const { columnExists, ensureColumn } = require('../db/helpers');
        const hasRootIdColumn = columnExists('transactions', 'root_id', db);
        
        let transactionQuery;
        if (hasRootIdColumn) {
            transactionQuery = `SELECT id, date, description, category, method, type, amount, note, user_id, root_id FROM transactions WHERE user_id = ${userId} ORDER BY date DESC`;
        } else {
            transactionQuery = `SELECT id, date, description, category, method, type, amount, note, user_id FROM transactions WHERE user_id = ${userId} ORDER BY date DESC`;
        }
        
        const transactions = db.exec(transactionQuery);
        
        // Check if type column exists in categories table
        const hasTypeColumn = columnExists('categories', 'type', db);
        
        let incomeCategories = { values: [] };
        let expenseCategories = { values: [] };
        let categoryTypes = {};
        
        if (hasTypeColumn) {
            // Get income and expense categories separately (filtered by user_id, excluding Default)
            try {
                incomeCategories = db.exec(`SELECT name FROM categories WHERE type = 'Income' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
            } catch (error) {
                console.error('Error reading income categories:', error);
                incomeCategories = { values: [] };
            }
            
            try {
                expenseCategories = db.exec(`SELECT name FROM categories WHERE type = 'Expense' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
            } catch (error) {
                console.error('Error reading expense categories:', error);
                expenseCategories = { values: [] };
            }
            
            // Also get category type mapping for transactions (filtered by user_id)
            try {
                const allCategories = db.exec(`SELECT name, type FROM categories WHERE user_id = ${userId}`);
                if (allCategories[0]) {
                    allCategories[0].values.forEach(row => {
                        categoryTypes[row[0]] = row[1];
                    });
                }
            } catch (error) {
                console.error('Error reading category types:', error);
            }
        } else {
            // Fallback: if type column doesn't exist, return all categories as expenses
            console.warn('Type column does not exist in categories table. Migration may not have run.');
            try {
                const allCategories = db.exec(`SELECT name FROM categories WHERE user_id = ${userId} ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name`);
                if (allCategories[0]) {
                    expenseCategories = allCategories;
                    allCategories[0].values.forEach(row => {
                        categoryTypes[row[0]] = 'Expense'; // Default to Expense
                    });
                }
            } catch (error) {
                console.error('Error reading categories:', error);
            }
        }
        
        // Ensure icon column exists for methods
        if (!columnExists('methods', 'icon', db)) {
            ensureColumn('methods', 'icon', 'TEXT', db);
        }
        
        const methods = db.exec(`SELECT name, COALESCE(icon, '') as icon FROM methods WHERE user_id = ${userId} ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name`);
        
        // Process transactions and ensure type matches category
        let needsSave = false;
        const processedTransactions = transactions[0] ? transactions[0].values.map(row => {
            const category = row[3];
            const transactionType = categoryTypes[category] || row[5] || 'Expense'; // Use category type, fallback to stored type, default to Expense
            
            // Update transaction type if it doesn't match category type
            if (row[5] !== transactionType) {
                const { escapeSql } = require('../db/helpers');
                const { saveDatabase } = require('../db/database');
                db.run(`UPDATE transactions SET type = '${transactionType}' WHERE id = ${row[0]} AND user_id = ${userId}`);
                needsSave = true;
            }
            
            // Extract root_id if column exists (it's the last column when present)
            let rootId = null;
            if (hasRootIdColumn && row.length > 9) {
                const rootIdValue = row[9]; // root_id is at index 9 (10th column)
                if (rootIdValue != null && rootIdValue !== undefined && rootIdValue !== '' && !isNaN(Number(rootIdValue)) && Number(rootIdValue) > 0) {
                    rootId = Number(rootIdValue);
                }
            }
            
            return {
                id: row[0],
                date: row[1],
                description: row[2],
                category: category,
                method: row[4],
                type: transactionType,
                amount: row[6],
                note: row[7] || '', // Note field (may not exist in old databases)
                root_id: rootId // Include root_id if it exists
            };
        }) : [];
        
        if (needsSave) {
            const { saveDatabase } = require('../db/database');
            saveDatabase();
        }
        
        // Ensure icon column exists for categories
        if (hasTypeColumn) {
            if (!columnExists('categories', 'icon', db)) {
                ensureColumn('categories', 'icon', 'TEXT', db);
            }
        }
        
        // Get categories with icons
        let incomeWithIcons = [];
        let expensesWithIcons = [];
        
        if (hasTypeColumn) {
            try {
                const incomeResult = db.exec(`SELECT name, COALESCE(icon, '') as icon FROM categories WHERE type = 'Income' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
                incomeWithIcons = incomeResult[0] ? incomeResult[0].values.map(row => ({ name: row[0], icon: row[1] || '' })) : [];
            } catch (error) {
                console.error('Error reading income categories with icons:', error);
                incomeWithIcons = incomeCategories[0] ? incomeCategories[0].values.map(row => ({ name: row[0], icon: '' })) : [];
            }
            
            try {
                const expenseResult = db.exec(`SELECT name, COALESCE(icon, '') as icon FROM categories WHERE type = 'Expense' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
                expensesWithIcons = expenseResult[0] ? expenseResult[0].values.map(row => ({ name: row[0], icon: row[1] || '' })) : [];
            } catch (error) {
                console.error('Error reading expense categories with icons:', error);
                expensesWithIcons = expenseCategories[0] ? expenseCategories[0].values.map(row => ({ name: row[0], icon: '' })) : [];
            }
        } else {
            // Fallback to old format
            incomeWithIcons = incomeCategories[0] ? incomeCategories[0].values.map(row => ({ name: row[0], icon: '' })) : [];
            expensesWithIcons = expenseCategories[0] ? expenseCategories[0].values.map(row => ({ name: row[0], icon: '' })) : [];
        }
        
        // Get methods with icons
        const methodsWithIcons = methods[0] ? methods[0].values.map(row => ({ name: row[0], icon: row[1] || '' })) : [];
        
        res.json({
            transactions: processedTransactions,
            income: incomeWithIcons,
            expenses: expensesWithIcons,
            methods: methodsWithIcons
        });
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

module.exports = router;
