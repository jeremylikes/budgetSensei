const express = require('express');
const path = require('path');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'budget.db');

// Initialize database
const db = new Database(DB_FILE);

// Create tables if they don't exist
function initializeDatabase() {
    // Transactions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            method TEXT NOT NULL,
            type TEXT NOT NULL,
            amount REAL NOT NULL
        )
    `);

    // Categories table
    db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    `);

    // Methods table
    db.exec(`
        CREATE TABLE IF NOT EXISTS methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    `);

    // Initialize default categories if table is empty
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
    if (categoryCount.count === 0) {
        const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
        const defaultCategories = ['Groceries', 'Rent', 'Utilities', 'Work Income'];
        defaultCategories.forEach(cat => insertCategory.run(cat));
    }

    // Initialize default methods if table is empty
    const methodCount = db.prepare('SELECT COUNT(*) as count FROM methods').get();
    if (methodCount.count === 0) {
        const insertMethod = db.prepare('INSERT INTO methods (name) VALUES (?)');
        const defaultMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'];
        defaultMethods.forEach(method => insertMethod.run(method));
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files (HTML, CSS, JS)

// Initialize database
initializeDatabase();

// API Routes

// Get all data
app.get('/api/data', (req, res) => {
    try {
        const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
        const categories = db.prepare('SELECT name FROM categories ORDER BY name').all().map(r => r.name);
        const methods = db.prepare('SELECT name FROM methods ORDER BY name').all().map(r => r.name);
        
        res.json({ transactions, categories, methods });
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Get transactions
app.get('/api/transactions', (req, res) => {
    try {
        const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
        res.json(transactions);
    } catch (error) {
        console.error('Error reading transactions:', error);
        res.status(500).json({ error: 'Failed to read transactions' });
    }
});

// Add transaction
app.post('/api/transactions', (req, res) => {
    try {
        const { date, description, category, method, type, amount } = req.body;
        const id = Date.now();
        
        db.prepare(`
            INSERT INTO transactions (id, date, description, category, method, type, amount)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, date, description, category, method, type, amount);
        
        const transaction = { id, date, description, category, method, type, amount };
        res.json(transaction);
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Update transaction
app.put('/api/transactions/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { date, description, category, method, type, amount } = req.body;
        
        const result = db.prepare(`
            UPDATE transactions 
            SET date = ?, description = ?, category = ?, method = ?, type = ?, amount = ?
            WHERE id = ?
        `).run(date, description, category, method, type, amount, id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        const transaction = { id, date, description, category, method, type, amount };
        res.json(transaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// Delete transaction
app.delete('/api/transactions/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// Get categories
app.get('/api/categories', (req, res) => {
    try {
        const categories = db.prepare('SELECT name FROM categories ORDER BY name').all().map(r => r.name);
        res.json(categories);
    } catch (error) {
        console.error('Error reading categories:', error);
        res.status(500).json({ error: 'Failed to read categories' });
    }
});

// Add category
app.post('/api/categories', (req, res) => {
    try {
        const category = req.body.name;
        
        if (!category) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        
        try {
            db.prepare('INSERT INTO categories (name) VALUES (?)').run(category);
            const categories = db.prepare('SELECT name FROM categories ORDER BY name').all().map(r => r.name);
            res.json(categories);
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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
app.put('/api/categories/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const newName = req.body.name;
        
        // Get current category at index
        const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
        if (index < 0 || index >= categories.length) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        const oldName = categories[index].name;
        const categoryId = categories[index].id;
        
        if (newName === oldName) {
            return res.json(categories.map(r => r.name));
        }
        
        // Check if new name already exists
        const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(newName);
        if (existing && existing.id !== categoryId) {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        
        // Update category
        db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(newName, categoryId);
        
        // Update all transactions with this category
        db.prepare('UPDATE transactions SET category = ? WHERE category = ?').run(newName, oldName);
        
        const updatedCategories = db.prepare('SELECT name FROM categories ORDER BY name').all().map(r => r.name);
        res.json(updatedCategories);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete category
app.delete('/api/categories/:name', (req, res) => {
    try {
        const categoryName = decodeURIComponent(req.params.name);
        const result = db.prepare('DELETE FROM categories WHERE name = ?').run(categoryName);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Get methods
app.get('/api/methods', (req, res) => {
    try {
        const methods = db.prepare('SELECT name FROM methods ORDER BY name').all().map(r => r.name);
        res.json(methods);
    } catch (error) {
        console.error('Error reading methods:', error);
        res.status(500).json({ error: 'Failed to read methods' });
    }
});

// Add method
app.post('/api/methods', (req, res) => {
    try {
        const method = req.body.name;
        
        if (!method) {
            return res.status(400).json({ error: 'Method name is required' });
        }
        
        try {
            db.prepare('INSERT INTO methods (name) VALUES (?)').run(method);
            const methods = db.prepare('SELECT name FROM methods ORDER BY name').all().map(r => r.name);
            res.json(methods);
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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
app.put('/api/methods/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const newName = req.body.name;
        
        // Get current method at index
        const methods = db.prepare('SELECT id, name FROM methods ORDER BY name').all();
        if (index < 0 || index >= methods.length) {
            return res.status(404).json({ error: 'Method not found' });
        }
        
        const oldName = methods[index].name;
        const methodId = methods[index].id;
        
        if (newName === oldName) {
            return res.json(methods.map(r => r.name));
        }
        
        // Check if new name already exists
        const existing = db.prepare('SELECT id FROM methods WHERE name = ?').get(newName);
        if (existing && existing.id !== methodId) {
            return res.status(400).json({ error: 'Method name already exists' });
        }
        
        // Update method
        db.prepare('UPDATE methods SET name = ? WHERE id = ?').run(newName, methodId);
        
        // Update all transactions with this method
        db.prepare('UPDATE transactions SET method = ? WHERE method = ?').run(newName, oldName);
        
        const updatedMethods = db.prepare('SELECT name FROM methods ORDER BY name').all().map(r => r.name);
        res.json(updatedMethods);
    } catch (error) {
        console.error('Error updating method:', error);
        res.status(500).json({ error: 'Failed to update method' });
    }
});

// Delete method
app.delete('/api/methods/:name', (req, res) => {
    try {
        const methodName = decodeURIComponent(req.params.name);
        const result = db.prepare('DELETE FROM methods WHERE name = ?').run(methodName);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Method not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting method:', error);
        res.status(500).json({ error: 'Failed to delete method' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Database file: ${DB_FILE}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close();
    process.exit(0);
});
