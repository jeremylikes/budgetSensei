const express = require('express');
const path = require('path');
const cors = require('cors');
const initSqlJs = require('sql.js');
const fs = require('fs');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Determine database file path - use persistent storage if available
// Priority: 1) DB_PATH env var, 2) /data directory (persistent on most platforms), 3) /tmp, 4) project directory (local dev)
let DB_DIR;
if (process.env.DB_PATH) {
    DB_DIR = process.env.DB_PATH;
} else if (fs.existsSync('/data')) {
    DB_DIR = '/data';
} else if (fs.existsSync('/tmp')) {
    DB_DIR = '/tmp';
} else {
    DB_DIR = __dirname;
}

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
    try {
        fs.mkdirSync(DB_DIR, { recursive: true });
    } catch (error) {
        console.warn(`Could not create DB directory ${DB_DIR}, using project directory`);
        DB_DIR = __dirname;
    }
}

const DB_FILE = path.join(DB_DIR, 'budget.db');

// Simple password authentication (set via environment variable)
// To set password: export BUDGET_PASSWORD=yourpassword (or set in hosting platform)
const BUDGET_PASSWORD = process.env.BUDGET_PASSWORD || '';

// Add basic auth if password is set
if (BUDGET_PASSWORD) {
    app.use(basicAuth({
        users: { 'admin': BUDGET_PASSWORD },
        challenge: true,
        realm: 'Budget Sensei'
    }));
}

let db = null;

// Initialize database
async function initializeDatabase() {
    try {
        const SQL = await initSqlJs();
        
        // Load existing database or create new one
        if (fs.existsSync(DB_FILE)) {
            const buffer = fs.readFileSync(DB_FILE);
            db = new SQL.Database(buffer);
        } else {
            db = new SQL.Database();
            
            // Create tables
            db.run(`
                CREATE TABLE transactions (
                    id INTEGER PRIMARY KEY,
                    date TEXT NOT NULL,
                    description TEXT NOT NULL,
                    category TEXT NOT NULL,
                    method TEXT NOT NULL,
                    type TEXT NOT NULL,
                    amount REAL NOT NULL
                )
            `);
            
            db.run(`
                CREATE TABLE categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL
                )
            `);
            
            db.run(`
                CREATE TABLE methods (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL
                )
            `);
            
                // Insert default categories
            const defaultCategories = ['Groceries', 'Rent', 'Utilities', 'Work Income'];
            defaultCategories.forEach(cat => {
                db.run(`INSERT INTO categories (name) VALUES ('${escapeSql(cat)}')`);
            });
            
            // Insert default methods
            const defaultMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'];
            defaultMethods.forEach(method => {
                db.run(`INSERT INTO methods (name) VALUES ('${escapeSql(method)}')`);
            });
            
            saveDatabase();
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Save database to file
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_FILE, buffer);
    }
}

// Helper function to escape SQL strings (preserves multibyte/UTF-8 characters)
function escapeSql(str) {
    if (typeof str !== 'string') return str;
    // Only escape single quotes for SQL injection prevention
    // This preserves all multibyte characters (UTF-8)
    return str.replace(/'/g, "''");
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support larger payloads for multibyte characters
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Support URL-encoded data
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        // Ensure UTF-8 charset for text-based files
        if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
    }
})); // Serve static files (HTML, CSS, JS) with UTF-8

// API Routes

// Get all data
app.get('/api/data', (req, res) => {
    try {
        const transactions = db.exec('SELECT * FROM transactions ORDER BY date DESC');
        const categories = db.exec('SELECT name FROM categories ORDER BY name');
        const methods = db.exec('SELECT name FROM methods ORDER BY name');
        
        res.json({
            transactions: transactions[0] ? transactions[0].values.map(row => ({
                id: row[0],
                date: row[1],
                description: row[2],
                category: row[3],
                method: row[4],
                type: row[5],
                amount: row[6]
            })) : [],
            categories: categories[0] ? categories[0].values.map(row => row[0]) : [],
            methods: methods[0] ? methods[0].values.map(row => row[0]) : []
        });
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Get transactions
app.get('/api/transactions', (req, res) => {
    try {
        const result = db.exec('SELECT * FROM transactions ORDER BY date DESC');
        const transactions = result[0] ? result[0].values.map(row => ({
            id: row[0],
            date: row[1],
            description: row[2],
            category: row[3],
            method: row[4],
            type: row[5],
            amount: row[6]
        })) : [];
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
        
        db.run(`INSERT INTO transactions (id, date, description, category, method, type, amount) VALUES (${id}, '${escapeSql(date)}', '${escapeSql(description)}', '${escapeSql(category)}', '${escapeSql(method)}', '${escapeSql(type)}', ${amount})`);
        saveDatabase();
        
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
        
        // Check if transaction exists
        const existing = db.exec(`SELECT id FROM transactions WHERE id = ${id}`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        db.run(`UPDATE transactions SET date = '${escapeSql(date)}', description = '${escapeSql(description)}', category = '${escapeSql(category)}', method = '${escapeSql(method)}', type = '${escapeSql(type)}', amount = ${amount} WHERE id = ${id}`);
        saveDatabase();
        
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
        
        // Check if transaction exists
        const existing = db.exec(`SELECT id FROM transactions WHERE id = ${id}`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        db.run(`DELETE FROM transactions WHERE id = ${id}`);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// Get categories
app.get('/api/categories', (req, res) => {
    try {
        const result = db.exec('SELECT name FROM categories ORDER BY name');
        const categories = result[0] ? result[0].values.map(row => row[0]) : [];
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
app.put('/api/categories/:index', (req, res) => {
    try {
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
app.delete('/api/categories/:name', (req, res) => {
    try {
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

// Get methods
app.get('/api/methods', (req, res) => {
    try {
        const result = db.exec('SELECT name FROM methods ORDER BY name');
        const methods = result[0] ? result[0].values.map(row => row[0]) : [];
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
app.put('/api/methods/:index', (req, res) => {
    try {
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
app.delete('/api/methods/:name', (req, res) => {
    try {
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

// Start server - wait for database initialization
async function startServer() {
    try {
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Database file: ${DB_FILE}`);
            console.log(`Database directory: ${DB_DIR}`);
            if (DB_DIR !== __dirname) {
                console.log(`✓ Using persistent storage location (data will survive deployments)`);
            } else {
                console.log(`⚠ Using project directory (data may be lost on deployment - set DB_PATH env var for persistence)`);
            }
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Server is ready to accept connections`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
    if (db) {
        saveDatabase();
        db.close();
    }
    process.exit(0);
});
