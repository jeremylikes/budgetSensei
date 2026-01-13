// Main Data Route
// Returns all data (transactions, categories, methods) in one response

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

router.get('/api/data', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const transactions = db.exec('SELECT * FROM transactions ORDER BY date DESC');
        
        // Check if type column exists in categories table
        const { columnExists } = require('../db/helpers');
        const hasTypeColumn = columnExists('categories', 'type', db);
        
        let incomeCategories = { values: [] };
        let expenseCategories = { values: [] };
        let categoryTypes = {};
        
        if (hasTypeColumn) {
            // Get income and expense categories separately
            try {
                incomeCategories = db.exec("SELECT name FROM categories WHERE type = 'Income' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
            } catch (error) {
                console.error('Error reading income categories:', error);
                incomeCategories = { values: [] };
            }
            
            try {
                expenseCategories = db.exec("SELECT name FROM categories WHERE type = 'Expense' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
            } catch (error) {
                console.error('Error reading expense categories:', error);
                expenseCategories = { values: [] };
            }
            
            // Also get category type mapping for transactions
            try {
                const allCategories = db.exec("SELECT name, type FROM categories");
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
                const allCategories = db.exec("SELECT name FROM categories ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
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
        
        const methods = db.exec("SELECT name FROM methods ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
        
        // Process transactions and ensure type matches category
        let needsSave = false;
        const processedTransactions = transactions[0] ? transactions[0].values.map(row => {
            const category = row[3];
            const transactionType = categoryTypes[category] || row[5] || 'Expense'; // Use category type, fallback to stored type, default to Expense
            
            // Update transaction type if it doesn't match category type
            if (row[5] !== transactionType) {
                const { escapeSql } = require('../db/helpers');
                const { saveDatabase } = require('../db/database');
                db.run(`UPDATE transactions SET type = '${transactionType}' WHERE id = ${row[0]}`);
                needsSave = true;
            }
            
            return {
                id: row[0],
                date: row[1],
                description: row[2],
                category: category,
                method: row[4],
                type: transactionType,
                amount: row[6],
                note: row[7] || '' // Note field (may not exist in old databases)
            };
        }) : [];
        
        if (needsSave) {
            const { saveDatabase } = require('../db/database');
            saveDatabase();
        }
        
        res.json({
            transactions: processedTransactions,
            income: incomeCategories[0] ? incomeCategories[0].values.map(row => row[0]) : [],
            expenses: expenseCategories[0] ? expenseCategories[0].values.map(row => row[0]) : [],
            methods: methods[0] ? methods[0].values.map(row => row[0]) : []
        });
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

module.exports = router;
