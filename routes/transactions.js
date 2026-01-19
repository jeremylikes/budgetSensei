// Transaction Routes
// Handles all transaction CRUD operations

const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../db/database');
const { escapeSql } = require('../db/helpers');
const { requireAuth, getCurrentUserId } = require('../middleware/auth');

// Get all transactions
router.get('/api/transactions', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const result = db.exec(`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY date DESC`);
        const transactions = result[0] ? result[0].values.map(row => ({
            id: row[0],
            date: row[1],
            description: row[2],
            category: row[3],
            method: row[4],
            type: row[5],
            amount: row[6],
            note: row[7] || '' // Note field (may not exist in old databases)
        })) : [];
        res.json(transactions);
    } catch (error) {
        console.error('Error reading transactions:', error);
        res.status(500).json({ error: 'Failed to read transactions' });
    }
});

// Add transaction
router.post('/api/transactions', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const { date, description, category, method, type, amount, note } = req.body;
        
        // Validate required fields
        if (!date || !description || !category /*|| !method*/ || !type || amount === undefined || amount === null) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Validate amount is a number
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }
        
        const id = Date.now();
        const noteValue = note || '';
        const methodValue = method || 'Default';
        
        db.run(`INSERT INTO transactions (id, date, description, category, method, type, amount, note, user_id) VALUES (${id}, '${escapeSql(date)}', '${escapeSql(description)}', '${escapeSql(category)}', '${escapeSql(methodValue)}', '${escapeSql(type)}', ${amountNum}, '${escapeSql(noteValue)}', ${userId})`);
        saveDatabase();
        
        const transaction = { id, date, description, category, method: methodValue, type, amount: amountNum, note: noteValue };
        res.json(transaction);
    } catch (error) {
        console.error('Error adding transaction:', error);
        console.error('Error details:', error.message);
        res.status(500).json({ error: 'Failed to add transaction', details: error.message });
    }
});

// Update transaction
router.put('/api/transactions/:id', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const id = parseInt(req.params.id);
        const { date, description, category, method, type, amount, note } = req.body;
        const noteValue = note || '';
        
        // Check if transaction exists and belongs to user
        const existing = db.exec(`SELECT id FROM transactions WHERE id = ${id} AND user_id = ${userId}`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        db.run(`UPDATE transactions SET date = '${escapeSql(date)}', description = '${escapeSql(description)}', category = '${escapeSql(category)}', method = '${escapeSql(method)}', type = '${escapeSql(type)}', amount = ${amount}, note = '${escapeSql(noteValue)}' WHERE id = ${id} AND user_id = ${userId}`);
        saveDatabase();
        
        const transaction = { id, date, description, category, method, type, amount, note: noteValue };
        res.json(transaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// Delete transaction
router.delete('/api/transactions/:id', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const id = parseInt(req.params.id);
        
        // Check if transaction exists and belongs to user
        const existing = db.exec(`SELECT id FROM transactions WHERE id = ${id} AND user_id = ${userId}`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        db.run(`DELETE FROM transactions WHERE id = ${id} AND user_id = ${userId}`);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

module.exports = router;
