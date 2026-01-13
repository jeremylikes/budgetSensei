// Category Routes
// Handles all category CRUD operations

const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../db/database');
const { escapeSql } = require('../db/helpers');

// Get all categories
router.get('/api/categories', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const result = db.exec('SELECT name FROM categories ORDER BY name');
        const categories = result[0] ? result[0].values.map(row => row[0]) : [];
        res.json(categories);
    } catch (error) {
        console.error('Error reading categories:', error);
        res.status(500).json({ error: 'Failed to read categories' });
    }
});

// Add category
router.post('/api/categories', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const category = req.body.name;
        
        if (!category) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        try {
            db.run(`INSERT INTO categories (name) VALUES ('${escapeSql(category)}')`);
            saveDatabase();
            
            const result = db.exec('SELECT name FROM categories ORDER BY name');
            const categories = result[0] ? result[0].values.map(row => row[0]) : [];
            res.json(categories);
        } catch (error) {
            if (error.message && error.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Category already exists' });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'Failed to add category' });
    }
});

// Update category
router.put('/api/categories/:index', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const index = parseInt(req.params.index);
        const newName = req.body.name;
        
        // Get all categories
        const result = db.exec('SELECT id, name FROM categories ORDER BY name');
        const categories = result[0] ? result[0].values : [];
        
        if (index < 0 || index >= categories.length) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        const oldName = categories[index][1];
        const categoryId = categories[index][0];
        
        if (newName === oldName) {
            const catResult = db.exec('SELECT name FROM categories ORDER BY name');
            const catList = catResult[0] ? catResult[0].values.map(row => row[0]) : [];
            return res.json(catList);
        }
        
        // Check if new name already exists
        const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(newName)}'`);
        if (existing[0] && existing[0].values.length > 0 && existing[0].values[0][0] !== categoryId) {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        
        // Update category
        db.run(`UPDATE categories SET name = '${escapeSql(newName)}' WHERE id = ${categoryId}`);
        
        // Update all transactions with this category
        db.run(`UPDATE transactions SET category = '${escapeSql(newName)}' WHERE category = '${escapeSql(oldName)}'`);
        
        saveDatabase();
        
        const updatedResult = db.exec('SELECT name FROM categories ORDER BY name');
        const updatedCategories = updatedResult[0] ? updatedResult[0].values.map(row => row[0]) : [];
        res.json(updatedCategories);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete category
router.delete('/api/categories/:name', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const categoryName = decodeURIComponent(req.params.name);
        
        // Check if category exists
        const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(categoryName)}'`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        db.run(`DELETE FROM categories WHERE name = '${escapeSql(categoryName)}'`);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

module.exports = router;
