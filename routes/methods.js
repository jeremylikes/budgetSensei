// Method Routes
// Handles all payment method CRUD operations

const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../db/database');
const { escapeSql } = require('../db/helpers');

// Get all methods
router.get('/api/methods', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const result = db.exec('SELECT name FROM methods ORDER BY name');
        const methods = result[0] ? result[0].values.map(row => row[0]) : [];
        res.json(methods);
    } catch (error) {
        console.error('Error reading methods:', error);
        res.status(500).json({ error: 'Failed to read methods' });
    }
});

// Add method
router.post('/api/methods', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const method = req.body.name;
        
        if (!method) {
            return res.status(400).json({ error: 'Method name is required' });
        }
        
        try {
            db.run(`INSERT INTO methods (name) VALUES ('${escapeSql(method)}')`);
            saveDatabase();
            
            const result = db.exec('SELECT name FROM methods ORDER BY name');
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
router.put('/api/methods/:index', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const index = parseInt(req.params.index);
        const newName = req.body.name;
        
        // Get all methods
        const result = db.exec('SELECT id, name FROM methods ORDER BY name');
        const methods = result[0] ? result[0].values : [];
        
        if (index < 0 || index >= methods.length) {
            return res.status(404).json({ error: 'Method not found' });
        }
        
        const oldName = methods[index][1];
        const methodId = methods[index][0];
        
        if (newName === oldName) {
            const methodResult = db.exec('SELECT name FROM methods ORDER BY name');
            const methodList = methodResult[0] ? methodResult[0].values.map(row => row[0]) : [];
            return res.json(methodList);
        }
        
        // Check if new name already exists
        const existing = db.exec(`SELECT id FROM methods WHERE name = '${escapeSql(newName)}'`);
        if (existing[0] && existing[0].values.length > 0 && existing[0].values[0][0] !== methodId) {
            return res.status(400).json({ error: 'Method name already exists' });
        }
        
        // Update method
        db.run(`UPDATE methods SET name = '${escapeSql(newName)}' WHERE id = ${methodId}`);
        
        // Update all transactions with this method
        db.run(`UPDATE transactions SET method = '${escapeSql(newName)}' WHERE method = '${escapeSql(oldName)}'`);
        
        saveDatabase();
        
        const updatedResult = db.exec('SELECT name FROM methods ORDER BY name');
        const updatedMethods = updatedResult[0] ? updatedResult[0].values.map(row => row[0]) : [];
        res.json(updatedMethods);
    } catch (error) {
        console.error('Error updating method:', error);
        res.status(500).json({ error: 'Failed to update method' });
    }
});

// Delete method
router.delete('/api/methods/:name', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const methodName = decodeURIComponent(req.params.name);
        
        // Check if method exists
        const existing = db.exec(`SELECT id FROM methods WHERE name = '${escapeSql(methodName)}'`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Method not found' });
        }
        
        db.run(`DELETE FROM methods WHERE name = '${escapeSql(methodName)}'`);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting method:', error);
        res.status(500).json({ error: 'Failed to delete method' });
    }
});

module.exports = router;
