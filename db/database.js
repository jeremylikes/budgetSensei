// Database Operations
// Handles database initialization, saving, and helper functions

const initSqlJs = require('sql.js');
const fs = require('fs');
const { DB_FILE } = require('../config/database');
const { runMigrations } = require('./migrations');
const { escapeSql } = require('./helpers');

let db = null;

// Initialize database
async function initializeDatabase() {
    try {
        const SQL = await initSqlJs();
        
        // Load existing database or create new one
        if (fs.existsSync(DB_FILE)) {
            console.log(`Loading existing database from: ${DB_FILE}`);
            const buffer = fs.readFileSync(DB_FILE);
            db = new SQL.Database(buffer);
            console.log('Database loaded successfully');
            
            // Run migrations to add any missing columns (safe - won't delete data)
            await runMigrations(db);
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
                    amount REAL NOT NULL,
                    note TEXT
                )
            `);
            
            db.run(`
                CREATE TABLE categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    UNIQUE(name, type)
                )
            `);
            
            db.run(`
                CREATE TABLE methods (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL
                )
            `);
            
            db.run(`
                CREATE TABLE budgets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category TEXT NOT NULL,
                    year INTEGER NOT NULL,
                    month INTEGER NOT NULL,
                    planned_amount REAL NOT NULL,
                    user_id INTEGER,
                    UNIQUE(category, year, month, user_id)
                )
            `);
            
            db.run(`
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
            `);
            
            // Run migrations to set up user_id columns and create admin user
            await runMigrations(db);
            
            // Get admin user ID for default data
            const adminResult = db.exec("SELECT id FROM users WHERE username = 'admin'");
            const adminUserId = adminResult[0] && adminResult[0].values.length > 0 ? adminResult[0].values[0][0] : null;
            
            // Insert default Income categories (with user_id if admin exists)
            const defaultIncomeCategories = ['Default', 'Work Income', 'Freelance', 'Investment'];
            defaultIncomeCategories.forEach(cat => {
                if (adminUserId) {
                    db.run(`INSERT INTO categories (name, type, user_id) VALUES ('${escapeSql(cat)}', 'Income', ${adminUserId})`);
                } else {
                    db.run(`INSERT INTO categories (name, type) VALUES ('${escapeSql(cat)}', 'Income')`);
                }
            });
            
            // Insert default Expense categories (with user_id if admin exists)
            const defaultExpenseCategories = ['Default', 'Groceries', 'Rent', 'Utilities', 'Transportation', 'Entertainment'];
            defaultExpenseCategories.forEach(cat => {
                if (adminUserId) {
                    db.run(`INSERT INTO categories (name, type, user_id) VALUES ('${escapeSql(cat)}', 'Expense', ${adminUserId})`);
                } else {
                    db.run(`INSERT INTO categories (name, type) VALUES ('${escapeSql(cat)}', 'Expense')`);
                }
            });
            
            // Insert default methods (Default must be first) (with user_id if admin exists)
            const defaultMethods = ['Default', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'];
            defaultMethods.forEach(method => {
                if (adminUserId) {
                    db.run(`INSERT INTO methods (name, user_id) VALUES ('${escapeSql(method)}', ${adminUserId})`);
                } else {
                    db.run(`INSERT INTO methods (name) VALUES ('${escapeSql(method)}')`);
                }
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

// Get database instance
function getDb() {
    return db;
}

module.exports = {
    initializeDatabase,
    saveDatabase,
    getDb
};
