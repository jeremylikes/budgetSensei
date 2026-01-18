// Method Routes
// Handles all payment method CRUD operations

const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../db/database');
const { escapeSql } = require('../db/helpers');
const { requireAuth, getCurrentUserId } = require('../middleware/auth');

// Get all methods
router.get('/api/methods', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        // Sort with "Default" first, then alphabetically
        const result = db.exec(`SELECT name FROM methods WHERE user_id = ${userId} ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name`);
        const methods = result[0] ? result[0].values.map(row => row[0]) : [];
        res.json(methods);
    } catch (error) {
        console.error('Error reading methods:', error);
        res.status(500).json({ error: 'Failed to read methods' });
    }
});

// Add method
router.post('/api/methods', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const method = req.body.name;
        
        if (!method) {
            return res.status(400).json({ error: 'Method name is required' });
        }
        
        try {
            db.run(`INSERT INTO methods (name, user_id) VALUES ('${escapeSql(method)}', ${userId})`);
            saveDatabase();
            
            const result = db.exec(`SELECT name FROM methods WHERE user_id = ${userId} ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name`);
            const methods = result[0] ? result[0].values.map(row => row[0]) : [];
            res.json(methods);
        } catch (error) {
            if (error.message && error.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Method already exists' });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error adding method:', error);
        res.status(500).json({ error: 'Failed to add method' });
    }
});

// Update method
router.put('/api/methods/:index', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const index = parseInt(req.params.index);
        const newName = req.body.name;
        
        // Get all methods for this user
        const result = db.exec(`SELECT id, name FROM methods WHERE user_id = ${userId} ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name`);
        const methods = result[0] ? result[0].values : [];
        
        if (index < 0 || index >= methods.length) {
            return res.status(404).json({ error: 'Method not found' });
        }
        
        const oldName = methods[index][1];
        const methodId = methods[index][0];
        
        if (newName === oldName) {
            const methodResult = db.exec(`SELECT name FROM methods WHERE user_id = ${userId} ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name`);
            const methodList = methodResult[0] ? methodResult[0].values.map(row => row[0]) : [];
            return res.json(methodList);
        }
        
        // Check if new name already exists for this user
        const existing = db.exec(`SELECT id FROM methods WHERE name = '${escapeSql(newName)}' AND user_id = ${userId}`);
        if (existing[0] && existing[0].values.length > 0 && existing[0].values[0][0] !== methodId) {
            return res.status(400).json({ error: 'Method name already exists' });
        }
        
        // Prevent renaming "Default"
        if (oldName === 'Default') {
            return res.status(400).json({ error: 'Cannot rename the Default payment method' });
        }
        
        // Update method
        db.run(`UPDATE methods SET name = '${escapeSql(newName)}' WHERE id = ${methodId} AND user_id = ${userId}`);
        
        // Update all transactions with this method (filter by user_id)
        db.run(`UPDATE transactions SET method = '${escapeSql(newName)}' WHERE method = '${escapeSql(oldName)}' AND user_id = ${userId}`);
        
        saveDatabase();
        
        const updatedResult = db.exec(`SELECT name FROM methods WHERE user_id = ${userId} ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name`);
        const updatedMethods = updatedResult[0] ? updatedResult[0].values.map(row => row[0]) : [];
        res.json(updatedMethods);
    } catch (error) {
        console.error('Error updating method:', error);
        res.status(500).json({ error: 'Failed to update method' });
    }
});

// Delete method
router.delete('/api/methods/:name', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const methodName = decodeURIComponent(req.params.name);
        
        // Prevent deletion of "Default"
        if (methodName === 'Default') {
            return res.status(400).json({ error: 'Cannot delete the Default payment method' });
        }
        
        // Check if method exists and belongs to user
        const existing = db.exec(`SELECT id FROM methods WHERE name = '${escapeSql(methodName)}' AND user_id = ${userId}`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Method not found' });
        }
        
        // Update all transactions with this method to "Default" (filter by user_id)
        db.run(`UPDATE transactions SET method = 'Default' WHERE method = '${escapeSql(methodName)}' AND user_id = ${userId}`);
        
        // Delete the method
        db.run(`DELETE FROM methods WHERE name = '${escapeSql(methodName)}' AND user_id = ${userId}`);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting method:', error);
        res.status(500).json({ error: 'Failed to delete method' });
    }
});

module.exports = router;
