// Script to check if a user exists by email
// Usage: node scripts/check-user-by-email.js email@example.com

const initSqlJs = require('sql.js');
const fs = require('fs');
const { DB_FILE } = require('../config/database');
const { escapeSql } = require('../db/helpers');

async function checkUserByEmail(email) {
    try {
        const SQL = await initSqlJs();
        
        if (!fs.existsSync(DB_FILE)) {
            console.error(`Database file not found: ${DB_FILE}`);
            process.exit(1);
        }
        
        console.log(`Loading database from: ${DB_FILE}`);
        const buffer = fs.readFileSync(DB_FILE);
        const db = new SQL.Database(buffer);
        
        // Check if user exists
        const userCheck = db.exec(`SELECT id, username, email, email_verified FROM users WHERE email = '${escapeSql(email)}'`);
        
        if (!userCheck[0] || userCheck[0].values.length === 0) {
            console.log(`✅ No user found with email: ${email}`);
            return;
        }
        
        const userId = userCheck[0].values[0][0];
        const username = userCheck[0].values[0][1];
        const userEmail = userCheck[0].values[0][2];
        const emailVerified = userCheck[0].values[0][3];
        
        console.log(`\n⚠️  User found with email: ${email}`);
        console.log(`  ID: ${userId}`);
        console.log(`  Username: ${username}`);
        console.log(`  Email: ${userEmail}`);
        console.log(`  Email Verified: ${emailVerified}`);
        
    } catch (error) {
        console.error('Error checking user:', error);
        process.exit(1);
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.error('Usage: node scripts/check-user-by-email.js email@example.com');
    process.exit(1);
}

checkUserByEmail(email);
