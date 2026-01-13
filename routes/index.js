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
        // Sort with "Default" first, then alphabetically
        const categories = db.exec("SELECT name FROM categories ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
        const methods = db.exec("SELECT name FROM methods ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
        
        res.json({
            transactions: transactions[0] ? transactions[0].values.map(row => ({
                id: row[0],
                date: row[1],
                description: row[2],
                category: row[3],
                method: row[4],
                type: row[5],
                amount: row[6],
                note: row[7] || '' // Note field (may not exist in old databases)
            })) : [],
            categories: categories[0] ? categories[0].values.map(row => row[0]) : [],
            methods: methods[0] ? methods[0].values.map(row => row[0]) : []
        });
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

module.exports = router;
