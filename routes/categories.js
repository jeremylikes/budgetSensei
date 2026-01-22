// Category Routes (Income and Expenses)
// Handles all category CRUD operations for Income and Expenses separately

const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../db/database');
const { escapeSql, ensureColumn, columnExists } = require('../db/helpers');
const { requireAuth, getCurrentUserId } = require('../middleware/auth');

// Helper function to ensure "Default" categories exist for a user
// This is used for orphaned transactions and as a fallback when no categories exist
function ensureDefaultCategories(userId, db) {
    try {
        if (!columnExists('categories', 'type', db)) {
            ensureColumn('categories', 'type', 'TEXT', db);
        }
        
        // Check if Default Income category exists for this user
        const defaultIncomeCheck = db.exec(`SELECT id FROM categories WHERE name = 'Default' AND type = 'Income' AND user_id = ${userId}`);
        if (!defaultIncomeCheck[0] || defaultIncomeCheck[0].values.length === 0) {
            try {
                db.run(`INSERT INTO categories (name, type, user_id) VALUES ('Default', 'Income', ${userId})`);
                console.log(`Created Default Income category for user ${userId}`);
                saveDatabase();
            } catch (insertError) {
                // If UNIQUE constraint fails, it means the constraint hasn't been migrated yet
                // Check if it exists for another user and log a warning
                if (insertError.message && insertError.message.includes('UNIQUE')) {
                    const allDefaultIncome = db.exec(`SELECT id, user_id FROM categories WHERE name = 'Default' AND type = 'Income'`);
                    if (allDefaultIncome[0] && allDefaultIncome[0].values.length > 0) {
                        console.warn(`Default Income category exists for another user. UNIQUE constraint migration may be needed.`);
                    }
                } else {
                    throw insertError;
                }
            }
        }
        
        // Check if Default Expense category exists for this user
        const defaultExpenseCheck = db.exec(`SELECT id FROM categories WHERE name = 'Default' AND type = 'Expense' AND user_id = ${userId}`);
        if (!defaultExpenseCheck[0] || defaultExpenseCheck[0].values.length === 0) {
            try {
                db.run(`INSERT INTO categories (name, type, user_id) VALUES ('Default', 'Expense', ${userId})`);
                console.log(`Created Default Expense category for user ${userId}`);
                saveDatabase();
            } catch (insertError) {
                // If UNIQUE constraint fails, it means the constraint hasn't been migrated yet
                // Check if it exists for another user and log a warning
                if (insertError.message && insertError.message.includes('UNIQUE')) {
                    const allDefaultExpense = db.exec(`SELECT id, user_id FROM categories WHERE name = 'Default' AND type = 'Expense'`);
                    if (allDefaultExpense[0] && allDefaultExpense[0].values.length > 0) {
                        console.warn(`Default Expense category exists for another user. UNIQUE constraint migration may be needed.`);
                    }
                } else {
                    throw insertError;
                }
            }
        }
    } catch (error) {
        console.error('Error ensuring default categories:', error);
        // Don't throw - allow operation to continue
    }
}

// Helper function to get categories by type
function getCategoriesByType(type, userId) {
    const db = getDb();
    if (!db) {
        return [];
    }
    // Ensure type column exists
    if (!columnExists('categories', 'type', db)) {
        ensureColumn('categories', 'type', 'TEXT', db);
    }
    const result = db.exec(`SELECT id, name FROM categories WHERE type = '${type}' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
    return result[0] ? result[0].values : [];
}

// Get all income categories
router.get('/api/income', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        
        // Ensure Default categories exist for this user
        ensureDefaultCategories(userId, db);
        
        // Ensure type column exists
        if (!columnExists('categories', 'type', db)) {
            ensureColumn('categories', 'type', 'TEXT', db);
        }
        
        // Ensure icon column exists
        if (!columnExists('categories', 'icon', db)) {
            ensureColumn('categories', 'icon', 'TEXT', db);
        }
        
        const result = db.exec(`SELECT name, COALESCE(icon, '') as icon FROM categories WHERE type = 'Income' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
        const categories = result[0] ? result[0].values.map(row => ({
            name: row[0],
            icon: row[1] || ''
        })) : [];
        res.json(categories);
    } catch (error) {
        console.error('Error reading income categories:', error);
        res.status(500).json({ error: 'Failed to read income categories' });
    }
});

// Get all expense categories
router.get('/api/expenses', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        
        // Ensure Default categories exist for this user
        ensureDefaultCategories(userId, db);
        
        // Ensure type column exists
        if (!columnExists('categories', 'type', db)) {
            ensureColumn('categories', 'type', 'TEXT', db);
        }
        
        // Ensure icon column exists
        if (!columnExists('categories', 'icon', db)) {
            ensureColumn('categories', 'icon', 'TEXT', db);
        }
        
        const result = db.exec(`SELECT name, COALESCE(icon, '') as icon FROM categories WHERE type = 'Expense' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
        const categories = result[0] ? result[0].values.map(row => ({
            name: row[0],
            icon: row[1] || ''
        })) : [];
        res.json(categories);
    } catch (error) {
        console.error('Error reading expense categories:', error);
        res.status(500).json({ error: 'Failed to read expense categories' });
    }
});

// Add income category
router.post('/api/income', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        
        // Ensure type column exists
        if (!columnExists('categories', 'type', db)) {
            ensureColumn('categories', 'type', 'TEXT', db);
        }
        
        const category = req.body.name;
        
        if (!category) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        // Check if category already exists for this user
        // Also check for NULL user_id (orphaned data that should be cleaned up)
        const existingCheck = db.exec(`SELECT id, user_id FROM categories WHERE name = '${escapeSql(category)}' AND type = 'Income' AND (user_id = ${userId} OR user_id IS NULL)`);
        if (existingCheck[0] && existingCheck[0].values.length > 0) {
            const foundCategory = existingCheck[0].values[0];
            const foundUserId = foundCategory[1];
            
            if (foundUserId === userId) {
                console.log(`Category "${category}" already exists for user ${userId} (ID: ${foundCategory[0]})`);
                return res.status(400).json({ error: 'Category already exists' });
            } else if (foundUserId === null) {
                // Orphaned category with NULL user_id - clean it up by assigning to admin
                console.log(`Found orphaned category "${category}" with NULL user_id, cleaning up...`);
                try {
                    const adminCheck = db.exec("SELECT id FROM users WHERE username = 'admin'");
                    if (adminCheck[0] && adminCheck[0].values.length > 0) {
                        const adminUserId = adminCheck[0].values[0][0];
                        db.run(`UPDATE categories SET user_id = ${adminUserId} WHERE id = ${foundCategory[0]}`);
                        saveDatabase();
                        console.log(`Assigned orphaned category to admin user`);
                    } else {
                        // No admin user, delete the orphaned category
                        db.run(`DELETE FROM categories WHERE id = ${foundCategory[0]}`);
                        saveDatabase();
                        console.log(`Deleted orphaned category (no admin user)`);
                    }
                    // After cleanup, check again if it exists for this user
                    const recheck = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(category)}' AND type = 'Income' AND user_id = ${userId}`);
                    if (recheck[0] && recheck[0].values.length > 0) {
                        return res.status(400).json({ error: 'Category already exists' });
                    }
                } catch (error) {
                    console.error('Error cleaning up orphaned category:', error);
                }
            }
        }
        
        // Also check if it exists for other users (for debugging)
        const otherUsersCheck = db.exec(`SELECT id, user_id FROM categories WHERE name = '${escapeSql(category)}' AND type = 'Income' AND user_id IS NOT NULL AND user_id != ${userId}`);
        if (otherUsersCheck[0] && otherUsersCheck[0].values.length > 0) {
            console.log(`Category "${category}" exists for other users (${otherUsersCheck[0].values.length} other users), but not for user ${userId} - proceeding with insert`);
        }
        
        try {
            db.run(`INSERT INTO categories (name, type, user_id) VALUES ('${escapeSql(category)}', 'Income', ${userId})`);
            saveDatabase();
            
            const result = db.exec(`SELECT name FROM categories WHERE type = 'Income' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
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
router.post('/api/expenses', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        
        // Ensure type column exists
        if (!columnExists('categories', 'type', db)) {
            ensureColumn('categories', 'type', 'TEXT', db);
        }
        
        const category = req.body.name;
        
        if (!category) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        // Check if category already exists for this user
        // Also check for NULL user_id (orphaned data that should be cleaned up)
        const existingCheck = db.exec(`SELECT id, user_id FROM categories WHERE name = '${escapeSql(category)}' AND type = 'Expense' AND (user_id = ${userId} OR user_id IS NULL)`);
        if (existingCheck[0] && existingCheck[0].values.length > 0) {
            const foundCategory = existingCheck[0].values[0];
            const foundUserId = foundCategory[1];
            
            if (foundUserId === userId) {
                console.log(`Category "${category}" already exists for user ${userId} (ID: ${foundCategory[0]})`);
                return res.status(400).json({ error: 'Category already exists' });
            } else if (foundUserId === null) {
                // Orphaned category with NULL user_id - clean it up by assigning to admin
                console.log(`Found orphaned category "${category}" with NULL user_id, cleaning up...`);
                try {
                    const adminCheck = db.exec("SELECT id FROM users WHERE username = 'admin'");
                    if (adminCheck[0] && adminCheck[0].values.length > 0) {
                        const adminUserId = adminCheck[0].values[0][0];
                        db.run(`UPDATE categories SET user_id = ${adminUserId} WHERE id = ${foundCategory[0]}`);
                        saveDatabase();
                        console.log(`Assigned orphaned category to admin user`);
                    } else {
                        // No admin user, delete the orphaned category
                        db.run(`DELETE FROM categories WHERE id = ${foundCategory[0]}`);
                        saveDatabase();
                        console.log(`Deleted orphaned category (no admin user)`);
                    }
                    // After cleanup, check again if it exists for this user
                    const recheck = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(category)}' AND type = 'Expense' AND user_id = ${userId}`);
                    if (recheck[0] && recheck[0].values.length > 0) {
                        return res.status(400).json({ error: 'Category already exists' });
                    }
                } catch (error) {
                    console.error('Error cleaning up orphaned category:', error);
                }
            }
        }
        
        // Also check if it exists for other users (for debugging)
        const otherUsersCheck = db.exec(`SELECT id, user_id FROM categories WHERE name = '${escapeSql(category)}' AND type = 'Expense' AND user_id IS NOT NULL AND user_id != ${userId}`);
        if (otherUsersCheck[0] && otherUsersCheck[0].values.length > 0) {
            console.log(`Category "${category}" exists for other users (${otherUsersCheck[0].values.length} other users), but not for user ${userId} - proceeding with insert`);
        }
        
        try {
            db.run(`INSERT INTO categories (name, type, user_id) VALUES ('${escapeSql(category)}', 'Expense', ${userId})`);
            saveDatabase();
            
            const result = db.exec(`SELECT name FROM categories WHERE type = 'Expense' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
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
router.put('/api/income/:index', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const index = parseInt(req.params.index);
        const newName = req.body.name;
        const categories = getCategoriesByType('Income', userId);
        
        if (index < 0 || index >= categories.length) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        const categoryId = categories[index][0];
        // Get old name directly from database using category ID to avoid index sync issues (check user_id)
        const categoryResult = db.exec(`SELECT name FROM categories WHERE id = ${categoryId} AND user_id = ${userId}`);
        if (!categoryResult[0] || categoryResult[0].values.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        const oldName = categoryResult[0].values[0][0];
        
        // Normalize names for comparison (trim whitespace)
        const normalizedOldName = (oldName || '').trim();
        const normalizedNewName = (newName || '').trim();
        
        // If name hasn't changed, nothing to do
        if (normalizedNewName === normalizedOldName) {
            const result = db.exec(`SELECT name FROM categories WHERE type = 'Income' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
            const catList = result[0] ? result[0].values.map(row => row[0]) : [];
            return res.json(catList);
        }
        
        // Name is changing - check for conflicts with OTHER categories
        const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(normalizedNewName)}' AND type = 'Income' AND user_id = ${userId} AND id != ${categoryId}`);
        if (existing[0] && existing[0].values.length > 0) {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        
        // Prevent renaming "Default"
        if (normalizedOldName === 'Default') {
            return res.status(400).json({ error: 'Cannot rename the Default category' });
        }
        
        // Update category name
        db.run(`UPDATE categories SET name = '${escapeSql(normalizedNewName)}' WHERE id = ${categoryId}`);
        
        // Update all transactions with this category
        db.run(`UPDATE transactions SET category = '${escapeSql(normalizedNewName)}' WHERE category = '${escapeSql(normalizedOldName)}' AND type = 'Income' AND user_id = ${userId}`);
        
        saveDatabase();
        
        const result = db.exec(`SELECT name FROM categories WHERE type = 'Income' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
        const updatedCategories = result[0] ? result[0].values.map(row => row[0]) : [];
        res.json(updatedCategories);
    } catch (error) {
        console.error('Error updating income category:', error);
        res.status(500).json({ error: 'Failed to update income category' });
    }
});

// Update expense category
router.put('/api/expenses/:index', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const index = parseInt(req.params.index);
        const newName = req.body.name;
        const categories = getCategoriesByType('Expense', userId);
        
        if (index < 0 || index >= categories.length) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        const categoryId = categories[index][0];
        // Get old name directly from database using category ID to avoid index sync issues (check user_id)
        const categoryResult = db.exec(`SELECT name FROM categories WHERE id = ${categoryId} AND user_id = ${userId}`);
        if (!categoryResult[0] || categoryResult[0].values.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        const oldName = categoryResult[0].values[0][0];
        
        // Normalize names for comparison (trim whitespace)
        const normalizedOldName = (oldName || '').trim();
        const normalizedNewName = (newName || '').trim();
        
        // If name hasn't changed, nothing to do
        if (normalizedNewName === normalizedOldName) {
            const result = db.exec(`SELECT name FROM categories WHERE type = 'Expense' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
            const catList = result[0] ? result[0].values.map(row => row[0]) : [];
            return res.json(catList);
        }
        
        // Name is changing - check for conflicts with OTHER categories
        const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(normalizedNewName)}' AND type = 'Expense' AND user_id = ${userId} AND id != ${categoryId}`);
        if (existing[0] && existing[0].values.length > 0) {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        
        // Prevent renaming "Default"
        if (normalizedOldName === 'Default') {
            return res.status(400).json({ error: 'Cannot rename the Default category' });
        }
        
        // Update category name
        db.run(`UPDATE categories SET name = '${escapeSql(normalizedNewName)}' WHERE id = ${categoryId}`);
        
        // Update all transactions with this category
        db.run(`UPDATE transactions SET category = '${escapeSql(normalizedNewName)}' WHERE category = '${escapeSql(normalizedOldName)}' AND type = 'Expense' AND user_id = ${userId}`);
        
        saveDatabase();
        
        const result = db.exec(`SELECT name FROM categories WHERE type = 'Expense' AND user_id = ${userId} AND name != 'Default' ORDER BY name`);
        const updatedCategories = result[0] ? result[0].values.map(row => row[0]) : [];
        res.json(updatedCategories);
    } catch (error) {
        console.error('Error updating expense category:', error);
        res.status(500).json({ error: 'Failed to update expense category' });
    }
});

// Delete income category
router.delete('/api/income/:name', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const categoryName = decodeURIComponent(req.params.name);
        
        // Prevent deletion of "Default"
        if (categoryName === 'Default') {
            return res.status(400).json({ error: 'Cannot delete the "Default" category' });
        }
        
        // Check if category exists and belongs to user
        const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(categoryName)}' AND type = 'Income' AND user_id = ${userId}`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Update all transactions with this category to "Default" (Income type) - filter by user_id
        db.run(`UPDATE transactions SET category = 'Default' WHERE category = '${escapeSql(categoryName)}' AND type = 'Income' AND user_id = ${userId}`);
        
        // Delete the category
        db.run(`DELETE FROM categories WHERE name = '${escapeSql(categoryName)}' AND type = 'Income' AND user_id = ${userId}`);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting income category:', error);
        res.status(500).json({ error: 'Failed to delete income category' });
    }
});

// Update category icon
router.put('/api/categories/:type/:name/icon', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const type = req.params.type; // 'Income' or 'Expense'
        const categoryName = decodeURIComponent(req.params.name);
        const icon = req.body.icon || '';
        
        // Ensure icon column exists
        if (!columnExists('categories', 'icon', db)) {
            ensureColumn('categories', 'icon', 'TEXT', db);
        }
        
        // Check if category exists and belongs to user
        const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(categoryName)}' AND type = '${type}' AND user_id = ${userId}`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Update icon
        db.run(`UPDATE categories SET icon = '${escapeSql(icon)}' WHERE name = '${escapeSql(categoryName)}' AND type = '${type}' AND user_id = ${userId}`);
        saveDatabase();
        
        res.json({ success: true, icon: icon });
    } catch (error) {
        console.error('Error updating category icon:', error);
        res.status(500).json({ error: 'Failed to update category icon' });
    }
});

// Delete expense category
router.delete('/api/expenses/:name', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const categoryName = decodeURIComponent(req.params.name);
        
        // Prevent deletion of "Default"
        if (categoryName === 'Default') {
            return res.status(400).json({ error: 'Cannot delete the "Default" category' });
        }
        
        // Check if category exists and belongs to user
        const existing = db.exec(`SELECT id FROM categories WHERE name = '${escapeSql(categoryName)}' AND type = 'Expense' AND user_id = ${userId}`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Update all transactions with this category to "Default" (Expense type) - filter by user_id
        db.run(`UPDATE transactions SET category = 'Default' WHERE category = '${escapeSql(categoryName)}' AND type = 'Expense' AND user_id = ${userId}`);
        
        // Delete the category
        db.run(`DELETE FROM categories WHERE name = '${escapeSql(categoryName)}' AND type = 'Expense' AND user_id = ${userId}`);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting expense category:', error);
        res.status(500).json({ error: 'Failed to delete expense category' });
    }
});

module.exports = {
    router,
    ensureDefaultCategories
};
