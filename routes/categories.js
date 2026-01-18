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
    // Ensure icon column exists
    if (!columnExists('categories', 'icon', db)) {
        ensureColumn('categories', 'icon', 'TEXT', db);
    }
    const result = db.exec(`SELECT id, name, COALESCE(icon, '') as icon FROM categories WHERE type = '${type}' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name`);
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
        
        // Ensure icon column exists
        if (!columnExists('categories', 'icon', db)) {
            ensureColumn('categories', 'icon', 'TEXT', db);
        }
        const result = db.exec("SELECT name, COALESCE(icon, '') as icon FROM categories WHERE type = 'Expense' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
        const categories = result[0] ? result[0].values.map(row => ({ name: row[0], icon: row[1] || '' })) : [];
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
        const icon = req.body.icon || '';
        
        if (!category) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        // Ensure icon column exists
        if (!columnExists('categories', 'icon', db)) {
            ensureColumn('categories', 'icon', 'TEXT', db);
        }
        
        try {
            db.run(`INSERT INTO categories (name, type, icon) VALUES ('${escapeSql(category)}', 'Expense', '${escapeSql(icon)}')`);
            saveDatabase();
            
            const result = db.exec("SELECT name, COALESCE(icon, '') as icon FROM categories WHERE type = 'Expense' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
            const categories = result[0] ? result[0].values.map(row => ({ name: row[0], icon: row[1] || '' })) : [];
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
        const newIcon = req.body.icon !== undefined ? req.body.icon : null;
        const categories = getCategoriesByType('Income');
        
        if (index < 0 || index >= categories.length) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        const categoryId = categories[index][0];
        // Get old name directly from database using category ID to avoid index sync issues
        const categoryResult = db.exec(`SELECT name, COALESCE(icon, '') as icon FROM categories WHERE id = ${categoryId}`);
        if (!categoryResult[0] || categoryResult[0].values.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        const oldName = categoryResult[0].values[0][0];
        
        // Ensure icon column exists
        if (!columnExists('categories', 'icon', db)) {
            ensureColumn('categories', 'icon', 'TEXT', db);
        }
        
        // Normalize names for comparison (trim whitespace)
        const normalizedOldName = (oldName || '').trim();
        const normalizedNewName = (newName || '').trim();
        
        // Normalize empty string to null for icon removal, but track if icon was explicitly provided
        const iconWasProvided = req.body.icon !== undefined;
        const normalizedIcon = (newIcon === '' || newIcon === null) ? null : newIcon;
        
        // Only skip update if name hasn't changed AND icon wasn't explicitly provided (or was provided as null)
        if (normalizedNewName === normalizedOldName && (!iconWasProvided || normalizedIcon === null)) {
            // Check if icon actually needs to be removed (user sent empty string explicitly)
            if (iconWasProvided && newIcon === '') {
                // User wants to remove icon, so we need to update it
                // Don't return early, continue to update logic below
            } else {
                // Nothing is changing, return early
                const result = db.exec("SELECT name, COALESCE(icon, '') as icon FROM categories WHERE type = 'Income' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
                const catList = result[0] ? result[0].values.map(row => ({ name: row[0], icon: row[1] || '' })) : [];
                return res.json(catList);
            }
        }
        
        // Check if new name already exists for Income type (only if name is changing)
        if (normalizedNewName && normalizedNewName !== normalizedOldName) {
            const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(normalizedNewName)}' AND type = 'Income'`);
            if (existing[0] && existing[0].values.length > 0 && existing[0].values[0][0] !== categoryId) {
                return res.status(400).json({ error: 'Category name already exists' });
            }
        }
        
        // Prevent renaming "Default"
        if (normalizedOldName === 'Default' && normalizedNewName !== normalizedOldName) {
            return res.status(400).json({ error: 'Cannot rename the Default category' });
        }
        
        // Update category (name and/or icon) - use normalized names
        if (normalizedNewName !== normalizedOldName && normalizedIcon !== null) {
            db.run(`UPDATE categories SET name = '${escapeSql(normalizedNewName)}', icon = '${escapeSql(normalizedIcon)}' WHERE id = ${categoryId}`);
        } else if (normalizedNewName !== normalizedOldName) {
            db.run(`UPDATE categories SET name = '${escapeSql(normalizedNewName)}' WHERE id = ${categoryId}`);
        } else if (normalizedIcon !== null) {
            db.run(`UPDATE categories SET icon = '${escapeSql(normalizedIcon)}' WHERE id = ${categoryId}`);
        } else if (normalizedIcon === null && normalizedNewName === normalizedOldName) {
            // Removing icon only (setting to empty string)
            db.run(`UPDATE categories SET icon = '' WHERE id = ${categoryId}`);
        }
        
        // Update all transactions with this category (only if name changed)
        if (normalizedNewName !== normalizedOldName) {
            db.run(`UPDATE transactions SET category = '${escapeSql(normalizedNewName)}' WHERE category = '${escapeSql(normalizedOldName)}' AND type = 'Income'`);
        }
        
        saveDatabase();
        
        const result = db.exec("SELECT name, COALESCE(icon, '') as icon FROM categories WHERE type = 'Income' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
        const updatedCategories = result[0] ? result[0].values.map(row => ({ name: row[0], icon: row[1] || '' })) : [];
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
        const newIcon = req.body.icon !== undefined ? req.body.icon : null;
        const categories = getCategoriesByType('Expense');
        
        if (index < 0 || index >= categories.length) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        const categoryId = categories[index][0];
        // Get old name directly from database using category ID to avoid index sync issues
        const categoryResult = db.exec(`SELECT name, COALESCE(icon, '') as icon FROM categories WHERE id = ${categoryId}`);
        if (!categoryResult[0] || categoryResult[0].values.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        const oldName = categoryResult[0].values[0][0];
        
        // Ensure icon column exists
        if (!columnExists('categories', 'icon', db)) {
            ensureColumn('categories', 'icon', 'TEXT', db);
        }
        
        // Normalize names for comparison (trim whitespace)
        const normalizedOldName = (oldName || '').trim();
        const normalizedNewName = (newName || '').trim();
        
        // Normalize empty string to null for icon removal, but track if icon was explicitly provided
        const iconWasProvided = req.body.icon !== undefined;
        const normalizedIcon = (newIcon === '' || newIcon === null) ? null : newIcon;
        
        // Only skip update if name hasn't changed AND icon wasn't explicitly provided (or was provided as null)
        if (normalizedNewName === normalizedOldName && (!iconWasProvided || normalizedIcon === null)) {
            // Check if icon actually needs to be removed (user sent empty string explicitly)
            if (iconWasProvided && newIcon === '') {
                // User wants to remove icon, so we need to update it
                // Don't return early, continue to update logic below
            } else {
                // Nothing is changing, return early
                const result = db.exec("SELECT name, COALESCE(icon, '') as icon FROM categories WHERE type = 'Expense' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
                const catList = result[0] ? result[0].values.map(row => ({ name: row[0], icon: row[1] || '' })) : [];
                return res.json(catList);
            }
        }
        
        // Only check for duplicate name if the name is actually changing
        if (normalizedNewName && normalizedNewName !== normalizedOldName) {
            // Check if new name already exists for Expense type
            const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(normalizedNewName)}' AND type = 'Expense'`);
            if (existing[0] && existing[0].values.length > 0 && existing[0].values[0][0] !== categoryId) {
                return res.status(400).json({ error: 'Category name already exists' });
            }
        }
        
        // Prevent renaming "Default"
        if (normalizedOldName === 'Default' && normalizedNewName !== normalizedOldName) {
            return res.status(400).json({ error: 'Cannot rename the Default category' });
        }
        
        // Update category (name and/or icon) - use normalized names
        if (normalizedNewName !== normalizedOldName && normalizedIcon !== null) {
            db.run(`UPDATE categories SET name = '${escapeSql(normalizedNewName)}', icon = '${escapeSql(normalizedIcon)}' WHERE id = ${categoryId}`);
        } else if (normalizedNewName !== normalizedOldName) {
            db.run(`UPDATE categories SET name = '${escapeSql(normalizedNewName)}' WHERE id = ${categoryId}`);
        } else if (normalizedIcon !== null) {
            db.run(`UPDATE categories SET icon = '${escapeSql(normalizedIcon)}' WHERE id = ${categoryId}`);
        } else if (normalizedIcon === null && normalizedNewName === normalizedOldName) {
            // Removing icon only (setting to empty string)
            db.run(`UPDATE categories SET icon = '' WHERE id = ${categoryId}`);
        }
        
        // Update all transactions with this category (only if name changed)
        if (normalizedNewName !== normalizedOldName) {
            db.run(`UPDATE transactions SET category = '${escapeSql(normalizedNewName)}' WHERE category = '${escapeSql(normalizedOldName)}' AND type = 'Expense'`);
        }
        
        saveDatabase();
        
        const result = db.exec("SELECT name, COALESCE(icon, '') as icon FROM categories WHERE type = 'Expense' ORDER BY CASE WHEN name = 'Default' THEN 0 ELSE 1 END, name");
        const updatedCategories = result[0] ? result[0].values.map(row => ({ name: row[0], icon: row[1] || '' })) : [];
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
