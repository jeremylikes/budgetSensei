// Script to delete users by email address
// Usage: node scripts/delete-users-by-email.js email1@example.com email2@example.com

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { DB_FILE } = require('../config/database');
const { escapeSql } = require('../db/helpers');

async function deleteUsersByEmail(emails) {
    try {
        const SQL = await initSqlJs();
        
        if (!fs.existsSync(DB_FILE)) {
            console.error(`Database file not found: ${DB_FILE}`);
            process.exit(1);
        }
        
        console.log(`Loading database from: ${DB_FILE}`);
        const buffer = fs.readFileSync(DB_FILE);
        const db = new SQL.Database(buffer);
        
        let deletedCount = 0;
        
        for (const email of emails) {
            // First, check if user exists
            const userCheck = db.exec(`SELECT id, username, email FROM users WHERE email = '${escapeSql(email)}'`);
            
            if (!userCheck[0] || userCheck[0].values.length === 0) {
                console.log(`⚠️  User with email ${email} not found - skipping`);
                continue;
            }
            
            const userId = userCheck[0].values[0][0];
            const username = userCheck[0].values[0][1];
            const userEmail = userCheck[0].values[0][2];
            
            console.log(`\nFound user:`);
            console.log(`  ID: ${userId}`);
            console.log(`  Username: ${username}`);
            console.log(`  Email: ${userEmail}`);
            
            // Delete user's data (cascading deletes)
            // Note: SQLite doesn't support foreign keys by default, so we delete manually
            
            // Delete user's transactions
            const transactionsResult = db.exec(`SELECT COUNT(*) FROM transactions WHERE user_id = ${userId}`);
            const transactionCount = transactionsResult[0] && transactionsResult[0].values.length > 0 
                ? transactionsResult[0].values[0][0] 
                : 0;
            if (transactionCount > 0) {
                db.run(`DELETE FROM transactions WHERE user_id = ${userId}`);
                console.log(`  Deleted ${transactionCount} transactions`);
            }
            
            // Delete user's categories
            const categoriesResult = db.exec(`SELECT COUNT(*) FROM categories WHERE user_id = ${userId}`);
            const categoryCount = categoriesResult[0] && categoriesResult[0].values.length > 0 
                ? categoriesResult[0].values[0][0] 
                : 0;
            if (categoryCount > 0) {
                db.run(`DELETE FROM categories WHERE user_id = ${userId}`);
                console.log(`  Deleted ${categoryCount} categories`);
            }
            
            // Delete user's methods
            const methodsResult = db.exec(`SELECT COUNT(*) FROM methods WHERE user_id = ${userId}`);
            const methodCount = methodsResult[0] && methodsResult[0].values.length > 0 
                ? methodsResult[0].values[0][0] 
                : 0;
            if (methodCount > 0) {
                db.run(`DELETE FROM methods WHERE user_id = ${userId}`);
                console.log(`  Deleted ${methodCount} payment methods`);
            }
            
            // Delete user's budgets
            const budgetsResult = db.exec(`SELECT COUNT(*) FROM budgets WHERE user_id = ${userId}`);
            const budgetCount = budgetsResult[0] && budgetsResult[0].values.length > 0 
                ? budgetsResult[0].values[0][0] 
                : 0;
            if (budgetCount > 0) {
                db.run(`DELETE FROM budgets WHERE user_id = ${userId}`);
                console.log(`  Deleted ${budgetCount} budgets`);
            }
            
            // Finally, delete the user
            db.run(`DELETE FROM users WHERE id = ${userId}`);
            console.log(`✅ Deleted user: ${username} (${email})`);
            deletedCount++;
        }
        
        // Save the database
        const data = db.export();
        const outputBuffer = Buffer.from(data);
        fs.writeFileSync(DB_FILE, outputBuffer);
        
        console.log(`\n✅ Successfully deleted ${deletedCount} user(s)`);
        console.log(`Database saved to: ${DB_FILE}`);
        
    } catch (error) {
        console.error('Error deleting users:', error);
        process.exit(1);
    }
}

// Get email addresses from command line arguments
const emails = process.argv.slice(2);

if (emails.length === 0) {
    console.error('Usage: node scripts/delete-users-by-email.js email1@example.com email2@example.com');
    process.exit(1);
}

console.log(`\n🗑️  Deleting users with emails: ${emails.join(', ')}\n`);
deleteUsersByEmail(emails);
