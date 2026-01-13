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
            runMigrations(db);
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
                    name TEXT UNIQUE NOT NULL
                )
            `);
            
            db.run(`
                CREATE TABLE methods (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL
                )
            `);
            
            // Insert default categories (Default must be first)
            const defaultCategories = ['Default', 'Groceries', 'Rent', 'Utilities', 'Work Income'];
            defaultCategories.forEach(cat => {
                db.run(`INSERT INTO categories (name) VALUES ('${escapeSql(cat)}')`);
            });
            
            // Insert default methods (Default must be first)
            const defaultMethods = ['Default', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'];
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

// Get database instance
function getDb() {
    return db;
}

module.exports = {
    initializeDatabase,
    saveDatabase,
    getDb
};
