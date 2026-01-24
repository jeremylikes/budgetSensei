// Transaction Routes
// Handles all transaction CRUD operations

const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../db/database');
const { escapeSql, ensureColumn, columnExists } = require('../db/helpers');
const { requireAuth, getCurrentUserId } = require('../middleware/auth');

// Get all transactions
router.get('/api/transactions', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        
        // Check if root_id column exists
        const { columnExists } = require('../db/helpers');
        const hasRootIdColumn = columnExists('transactions', 'root_id', db);
        
        // Use explicit column selection to ensure root_id is included if it exists
        let query;
        if (hasRootIdColumn) {
            query = `SELECT id, date, description, category, method, type, amount, note, user_id, root_id FROM transactions WHERE user_id = ${userId} ORDER BY date DESC`;
        } else {
            query = `SELECT id, date, description, category, method, type, amount, note, user_id FROM transactions WHERE user_id = ${userId} ORDER BY date DESC`;
            console.log(`[GET /api/transactions] WARNING: root_id column does not exist! Migration may not have run.`);
        }
        
        const result = db.exec(query);
        const transactions = result[0] ? result[0].values.map((row, index) => {
            // If root_id column exists, it's the last column
            let rootId = null;
            if (hasRootIdColumn) {
                // root_id is the last column in our SELECT statement (index 9)
                const rootIdIndex = 9; // Explicitly use index 9 since we know the column order
                if (row.length > rootIdIndex) {
                    const rootIdValue = row[rootIdIndex];
                    // root_id can be null, undefined, empty string, or a number
                    // In SQLite/sql.js, NULL values are returned as null (not undefined)
                    // Check if it's a valid positive number
                    if (rootIdValue !== null && rootIdValue !== undefined && rootIdValue !== '' && !isNaN(Number(rootIdValue))) {
                        const numValue = Number(rootIdValue);
                        if (numValue > 0) {
                            rootId = numValue;
                        }
                    }
                }
            }
            
            // Column order when root_id exists: id, date, description, category, method, type, amount, note, user_id, root_id
            // Column order when root_id doesn't exist: id, date, description, category, method, type, amount, note, user_id
            return {
                id: row[0],
                date: row[1],
                description: row[2],
                category: row[3],
                method: row[4],
                type: row[5],
                amount: row[6],
                note: row[7] || '', // Note field (may not exist in old databases)
                root_id: rootId // Always include root_id, even if null
            };
        }) : [];
        
        res.json(transactions);
    } catch (error) {
        console.error('Error reading transactions:', error);
        res.status(500).json({ error: 'Failed to read transactions' });
    }
});

// Helper function to get next recurring date
function getNextRecurringDate(startDate, frequency, originalDay = null) {
    const nextDate = new Date(startDate);
    
    switch (frequency) {
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'bi-weekly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
        case 'monthly':
            const currentMonth = nextDate.getMonth();
            const currentYear = nextDate.getFullYear();
            
            // Use original day if provided, otherwise use current date's day
            const targetDay = originalDay !== null ? originalDay : nextDate.getDate();
            
            let nextMonth = currentMonth + 1;
            let nextYear = currentYear;
            
            if (nextMonth > 11) {
                nextMonth = 0;
                nextYear++;
            }
            
            // Get the last day of the target month
            const lastDayOfMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
            // Use the original day if it exists in the month, otherwise use the last day
            const dayToUse = Math.min(targetDay, lastDayOfMonth);
            
            nextDate.setFullYear(nextYear, nextMonth, dayToUse);
            break;
        default:
            return null;
    }
    
    return nextDate;
}

// Helper function to parse date string (YYYY-MM-DD) without timezone issues
function parseDateString(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
        return new Date(dateStr); // Fallback
    }
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
}

// Helper function to format date as YYYY-MM-DD without timezone issues
function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper function to generate recurring dates
function generateRecurringDates(startDateStr, frequency) {
    if (!frequency || frequency === 'none') {
        return [startDateStr];
    }
    
    const dates = [];
    const startDate = parseDateString(startDateStr);
    const currentYear = new Date().getFullYear();
    const endOfYear = new Date(currentYear, 11, 31);
    
    // Store the original day for monthly recurring transactions
    // Parse from string to avoid timezone issues
    const originalDay = frequency === 'monthly' ? parseInt(startDateStr.split('-')[2], 10) : null;
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endOfYear) {
        dates.push(formatDateString(currentDate));
        
        const nextDate = getNextRecurringDate(currentDate, frequency, originalDay);
        if (!nextDate || nextDate <= currentDate) {
            break;
        }
        currentDate = nextDate;
    }
    
    return dates;
}

// Add transaction
router.post('/api/transactions', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const { date, description, category, method, type, amount, note, recurring } = req.body;
        
        // Validate required fields
        if (!date || !description || !category /*|| !method*/ || !type || amount === undefined || amount === null) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Validate amount is a number
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }
        
        const noteValue = note || '';
        const methodValue = method || 'Default';
        const recurringValue = recurring || 'none';
        
        // Generate all dates for recurring transactions (if recurring is set)
        const dates = generateRecurringDates(date, recurringValue);
        const transactions = [];
        let baseId = Date.now();
        
        // Check if root_id column exists
        const { columnExists } = require('../db/helpers');
        const hasRootIdColumn = columnExists('transactions', 'root_id', db);
        
        // Determine if this is a recurring transaction (more than one date)
        const isRecurring = dates.length > 1;
        const rootId = isRecurring ? baseId : null; // First transaction is the root
        
        // Create a transaction for each date
        for (let i = 0; i < dates.length; i++) {
            const transactionId = baseId + i;
            const transactionDate = dates[i];
            
            // Root transaction has root_id = NULL, branches have root_id = rootId
            const transactionRootId = (isRecurring && i > 0) ? rootId : null;
            
            // Insert transaction with root_id if column exists
            if (hasRootIdColumn) {
                if (transactionRootId !== null) {
                    db.run(`INSERT INTO transactions (id, date, description, category, method, type, amount, note, user_id, root_id) VALUES (${transactionId}, '${escapeSql(transactionDate)}', '${escapeSql(description)}', '${escapeSql(category)}', '${escapeSql(methodValue)}', '${escapeSql(type)}', ${amountNum}, '${escapeSql(noteValue)}', ${userId}, ${transactionRootId})`);
                } else {
                    db.run(`INSERT INTO transactions (id, date, description, category, method, type, amount, note, user_id, root_id) VALUES (${transactionId}, '${escapeSql(transactionDate)}', '${escapeSql(description)}', '${escapeSql(category)}', '${escapeSql(methodValue)}', '${escapeSql(type)}', ${amountNum}, '${escapeSql(noteValue)}', ${userId}, NULL)`);
                }
            } else {
                // Column doesn't exist - insert without root_id
                db.run(`INSERT INTO transactions (id, date, description, category, method, type, amount, note, user_id) VALUES (${transactionId}, '${escapeSql(transactionDate)}', '${escapeSql(description)}', '${escapeSql(category)}', '${escapeSql(methodValue)}', '${escapeSql(type)}', ${amountNum}, '${escapeSql(noteValue)}', ${userId})`);
            }
            
            transactions.push({
                id: transactionId,
                date: transactionDate,
                description,
                category,
                method: methodValue,
                type,
                amount: amountNum,
                note: noteValue,
                root_id: transactionRootId
            });
        }
        
        saveDatabase();
        
        // Return the first transaction
        const response = transactions[0];
        response._recurringCount = transactions.length;
        res.json(response);
    } catch (error) {
        console.error('Error adding transaction:', error);
        console.error('Error details:', error.message);
        res.status(500).json({ error: 'Failed to add transaction', details: error.message });
    }
});

// Update transaction
router.put('/api/transactions/:id', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const id = parseInt(req.params.id);
        const { date, description, category, method, type, amount, note, recurring } = req.body;
        const noteValue = note || '';
        const recurringValue = recurring || 'none';
        
        // Check if transaction exists and belongs to user
        const existing = db.exec(`SELECT * FROM transactions WHERE id = ${id} AND user_id = ${userId}`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        // Check if this transaction is already a branch (has a root_id)
        const existingRow = existing[0].values[0];
        const existingRootId = existingRow.length > 9 ? existingRow[9] : null; // root_id is the 10th column (index 9)
        const isBranch = existingRootId !== null && existingRootId !== undefined;
        
        // If this is a branch, we can't make it recurring - branches can't have their own branches
        // Only root transactions can generate branches
        const rootId = isBranch ? existingRootId : id;
        
        // Update the transaction
        db.run(`UPDATE transactions SET date = '${escapeSql(date)}', description = '${escapeSql(description)}', category = '${escapeSql(category)}', method = '${escapeSql(method)}', type = '${escapeSql(type)}', amount = ${amount}, note = '${escapeSql(noteValue)}' WHERE id = ${id} AND user_id = ${userId}`);
        
        // If recurring is set and this is not a branch, generate recurring transactions
        if (recurringValue && recurringValue !== 'none' && !isBranch) {
            const dates = generateRecurringDates(date, recurringValue);
            // Skip the first date (it's the current transaction we just updated)
            if (dates.length > 1) {
                const transactions = [];
                let baseId = Date.now();
                
                for (let i = 1; i < dates.length; i++) {
                    const transactionId = baseId + i;
                    const transactionDate = dates[i];
                    
                    // Create branch transactions with root_id pointing to the root
                    db.run(`INSERT INTO transactions (id, date, description, category, method, type, amount, note, user_id, root_id) VALUES (${transactionId}, '${escapeSql(transactionDate)}', '${escapeSql(description)}', '${escapeSql(category)}', '${escapeSql(method)}', '${escapeSql(type)}', ${amount}, '${escapeSql(noteValue)}', ${userId}, ${rootId})`);
                    
                    transactions.push({
                        id: transactionId,
                        date: transactionDate,
                        description,
                        category,
                        method,
                        type,
                        amount,
                        note: noteValue,
                        root_id: rootId
                    });
                }
                console.log(`[PUT /api/transactions/${id}] Created ${transactions.length} recurring transactions`);
            }
        }
        
        saveDatabase();
        
        // Don't return recurring field - we don't persist it
        const transaction = { id, date, description, category, method, type, amount, note: noteValue };
        res.json(transaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// Delete transaction
router.delete('/api/transactions/:id', requireAuth, (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const userId = getCurrentUserId(req);
        const id = parseInt(req.params.id);
        
        // Check if transaction exists and belongs to user
        const existing = db.exec(`SELECT id, root_id, date FROM transactions WHERE id = ${id} AND user_id = ${userId}`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        const transaction = existing[0].values[0];
        const rootId = transaction[1]; // root_id is the second column (index 1)
        const transactionDate = transaction[2]; // date is the third column (index 2)
        
        if (rootId === null || rootId === undefined) {
            // This is a root transaction - delete all its branches
            const branches = db.exec(`SELECT id FROM transactions WHERE root_id = ${id} AND user_id = ${userId}`);
            if (branches[0] && branches[0].values.length > 0) {
                const branchIds = branches[0].values.map(row => row[0]);
                // Delete all branches
                branchIds.forEach(branchId => {
                    db.run(`DELETE FROM transactions WHERE id = ${branchId} AND user_id = ${userId}`);
                });
                console.log(`[DELETE /api/transactions/${id}] Deleted root transaction and ${branchIds.length} branches`);
            }
        } else {
            // This is a branch transaction - delete it and all subsequent branches (later dates)
            // Find all branches with the same root_id that have dates >= this transaction's date
            const subsequentBranches = db.exec(`SELECT id FROM transactions WHERE root_id = ${rootId} AND user_id = ${userId} AND date >= '${escapeSql(transactionDate)}' AND id != ${id}`);
            if (subsequentBranches[0] && subsequentBranches[0].values.length > 0) {
                const branchIds = subsequentBranches[0].values.map(row => row[0]);
                // Delete all subsequent branches
                branchIds.forEach(branchId => {
                    db.run(`DELETE FROM transactions WHERE id = ${branchId} AND user_id = ${userId}`);
                });
                console.log(`[DELETE /api/transactions/${id}] Deleted branch transaction and ${branchIds.length} subsequent branches`);
            }
        }
        
        // Delete the transaction itself
        db.run(`DELETE FROM transactions WHERE id = ${id} AND user_id = ${userId}`);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

module.exports = router;
