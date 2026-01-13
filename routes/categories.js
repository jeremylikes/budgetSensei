// Category Routes (Income and Expenses)
// Handles all category CRUD operations for Income and Expenses separately

const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../db/database');
const { escapeSql, ensureColumn, columnExists } = require('../db/helpers');

// Helper function to get categories by type
function getCategoriesByType(type) {
    const db = getDb();
    if (!db) {
        return [];
    }
    // Ensure type column exists
    if (!columnExists('categories', 'type', db)) {
        ensureColumn('categories', 'type', 'TEXT', db);
    }
    const result = db.exec(`SELECT id, name FROM categories WHERE type = '${type}' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name`);
    return result[0] ? result[0].values : [];
}

// Get all income categories
router.get('/api/income', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        // Ensure type column exists
        if (!columnExists('categories', 'type', db)) {
            ensureColumn('categories', 'type', 'TEXT', db);
        }
        
        const result = db.exec("SELECT name FROM categories WHERE type = 'Income' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
        const categories = result[0] ? result[0].values.map(row => row[0]) : [];
        res.json(categories);
    } catch (error) {
        console.error('Error reading income categories:', error);
        res.status(500).json({ error: 'Failed to read income categories' });
    }
});

// Get all expense categories
router.get('/api/expenses', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        // Ensure type column exists
        if (!columnExists('categories', 'type', db)) {
            ensureColumn('categories', 'type', 'TEXT', db);
        }
        
        const result = db.exec("SELECT name FROM categories WHERE type = 'Expense' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
        const categories = result[0] ? result[0].values.map(row => row[0]) : [];
        res.json(categories);
    } catch (error) {
        console.error('Error reading expense categories:', error);
        res.status(500).json({ error: 'Failed to read expense categories' });
    }
});

// Add income category
router.post('/api/income', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        // Ensure type column exists
        if (!columnExists('categories', 'type', db)) {
            ensureColumn('categories', 'type', 'TEXT', db);
        }
        
        const category = req.body.name;
        
        if (!category) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        try {
            db.run(`INSERT INTO categories (name, type) VALUES ('${escapeSql(category)}', 'Income')`);
            saveDatabase();
            
            const result = db.exec("SELECT name FROM categories WHERE type = 'Income' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
            const categories = result[0] ? result[0].values.map(row => row[0]) : [];
            res.json(categories);
        } catch (error) {
            if (error.message && error.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Category already exists' });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error adding income category:', error);
        res.status(500).json({ error: 'Failed to add income category' });
    }
});

// Add expense category
router.post('/api/expenses', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        // Ensure type column exists
        if (!columnExists('categories', 'type', db)) {
            ensureColumn('categories', 'type', 'TEXT', db);
        }
        
        const category = req.body.name;
        
        if (!category) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        try {
            db.run(`INSERT INTO categories (name, type) VALUES ('${escapeSql(category)}', 'Expense')`);
            saveDatabase();
            
            const result = db.exec("SELECT name FROM categories WHERE type = 'Expense' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
            const categories = result[0] ? result[0].values.map(row => row[0]) : [];
            res.json(categories);
        } catch (error) {
            if (error.message && error.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Category already exists' });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error adding expense category:', error);
        res.status(500).json({ error: 'Failed to add expense category' });
    }
});

// Update income category
router.put('/api/income/:index', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const index = parseInt(req.params.index);
        const newName = req.body.name;
        const categories = getCategoriesByType('Income');
        
        if (index < 0 || index >= categories.length) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        const oldName = categories[index][1];
        const categoryId = categories[index][0];
        
        if (newName === oldName) {
            const result = db.exec("SELECT name FROM categories WHERE type = 'Income' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
            const catList = result[0] ? result[0].values.map(row => row[0]) : [];
            return res.json(catList);
        }
        
        // Check if new name already exists for Income type
        const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(newName)}' AND type = 'Income'`);
        if (existing[0] && existing[0].values.length > 0 && existing[0].values[0][0] !== categoryId) {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        
        // Prevent renaming "Default"
        if (oldName === 'Default') {
            return res.status(400).json({ error: 'Cannot rename the Default category' });
        }
        
        // Update category
        db.run(`UPDATE categories SET name = '${escapeSql(newName)}' WHERE id = ${categoryId}`);
        
        // Update all transactions with this category
        db.run(`UPDATE transactions SET category = '${escapeSql(newName)}' WHERE category = '${escapeSql(oldName)}' AND type = 'Income'`);
        
        saveDatabase();
        
        const result = db.exec("SELECT name FROM categories WHERE type = 'Income' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
        const updatedCategories = result[0] ? result[0].values.map(row => row[0]) : [];
        res.json(updatedCategories);
    } catch (error) {
        console.error('Error updating income category:', error);
        res.status(500).json({ error: 'Failed to update income category' });
    }
});

// Update expense category
router.put('/api/expenses/:index', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const index = parseInt(req.params.index);
        const newName = req.body.name;
        const categories = getCategoriesByType('Expense');
        
        if (index < 0 || index >= categories.length) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        const oldName = categories[index][1];
        const categoryId = categories[index][0];
        
        if (newName === oldName) {
            const result = db.exec("SELECT name FROM categories WHERE type = 'Expense' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
            const catList = result[0] ? result[0].values.map(row => row[0]) : [];
            return res.json(catList);
        }
        
        // Check if new name already exists for Expense type
        const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(newName)}' AND type = 'Expense'`);
        if (existing[0] && existing[0].values.length > 0 && existing[0].values[0][0] !== categoryId) {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        
        // Prevent renaming "Default"
        if (oldName === 'Default') {
            return res.status(400).json({ error: 'Cannot rename the Default category' });
        }
        
        // Update category
        db.run(`UPDATE categories SET name = '${escapeSql(newName)}' WHERE id = ${categoryId}`);
        
        // Update all transactions with this category
        db.run(`UPDATE transactions SET category = '${escapeSql(newName)}' WHERE category = '${escapeSql(oldName)}' AND type = 'Expense'`);
        
        saveDatabase();
        
        const result = db.exec("SELECT name FROM categories WHERE type = 'Expense' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
        const updatedCategories = result[0] ? result[0].values.map(row => row[0]) : [];
        res.json(updatedCategories);
    } catch (error) {
        console.error('Error updating expense category:', error);
        res.status(500).json({ error: 'Failed to update expense category' });
    }
});

// Delete income category
router.delete('/api/income/:name', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const categoryName = decodeURIComponent(req.params.name);
        
        // Prevent deletion of "Default"
        if (categoryName === 'Default') {
            return res.status(400).json({ error: 'Cannot delete the "Default" category' });
        }
        
        // Check if category exists
        const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(categoryName)}' AND type = 'Income'`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Update all transactions with this category to "Default" (Income type)
        db.run(`UPDATE transactions SET category = 'Default' WHERE category = '${escapeSql(categoryName)}' AND type = 'Income'`);
        
        // Delete the category
        db.run(`DELETE FROM categories WHERE name = '${escapeSql(categoryName)}' AND type = 'Income'`);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting income category:', error);
        res.status(500).json({ error: 'Failed to delete income category' });
    }
});

// Delete expense category
router.delete('/api/expenses/:name', (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const categoryName = decodeURIComponent(req.params.name);
        
        // Prevent deletion of "Default"
        if (categoryName === 'Default') {
            return res.status(400).json({ error: 'Cannot delete the "Default" category' });
        }
        
        // Check if category exists
        const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(categoryName)}' AND type = 'Expense'`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Update all transactions with this category to "Default" (Expense type)
        db.run(`UPDATE transactions SET category = 'Default' WHERE category = '${escapeSql(categoryName)}' AND type = 'Expense'`);
        
        // Delete the category
        db.run(`DELETE FROM categories WHERE name = '${escapeSql(categoryName)}' AND type = 'Expense'`);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting expense category:', error);
        res.status(500).json({ error: 'Failed to delete expense category' });
    }
});

module.exports = router;
