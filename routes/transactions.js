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
        const result = db.exec(`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY date DESC`);
        const transactions = result[0] ? result[0].values.map(row => {
            // Don't return recurring field - we don't persist it anymore
            return {
                id: row[0],
                date: row[1],
                description: row[2],
                category: row[3],
                method: row[4],
                type: row[5],
                amount: row[6],
                note: row[7] || '' // Note field (may not exist in old databases)
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
        
        // Create a transaction for each date (don't store recurring field)
        for (let i = 0; i < dates.length; i++) {
            const transactionId = baseId + i;
            const transactionDate = dates[i];
            
            // Don't store recurring field - just generate duplicates
            db.run(`INSERT INTO transactions (id, date, description, category, method, type, amount, note, user_id) VALUES (${transactionId}, '${escapeSql(transactionDate)}', '${escapeSql(description)}', '${escapeSql(category)}', '${escapeSql(methodValue)}', '${escapeSql(type)}', ${amountNum}, '${escapeSql(noteValue)}', ${userId})`);
            
            transactions.push({
                id: transactionId,
                date: transactionDate,
                description,
                category,
                method: methodValue,
                type,
                amount: amountNum,
                note: noteValue
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
        
        // Update the transaction (don't store recurring field)
        db.run(`UPDATE transactions SET date = '${escapeSql(date)}', description = '${escapeSql(description)}', category = '${escapeSql(category)}', method = '${escapeSql(method)}', type = '${escapeSql(type)}', amount = ${amount}, note = '${escapeSql(noteValue)}' WHERE id = ${id} AND user_id = ${userId}`);
        
        // If recurring is set, generate recurring transactions (don't store recurring field)
        if (recurringValue && recurringValue !== 'none') {
            const dates = generateRecurringDates(date, recurringValue);
            // Skip the first date (it's the current transaction we just updated)
            if (dates.length > 1) {
                const transactions = [];
                let baseId = Date.now();
                
                for (let i = 1; i < dates.length; i++) {
                    const transactionId = baseId + i;
                    const transactionDate = dates[i];
                    
                    // Don't store recurring field
                    db.run(`INSERT INTO transactions (id, date, description, category, method, type, amount, note, user_id) VALUES (${transactionId}, '${escapeSql(transactionDate)}', '${escapeSql(description)}', '${escapeSql(category)}', '${escapeSql(method)}', '${escapeSql(type)}', ${amount}, '${escapeSql(noteValue)}', ${userId})`);
                    
                    transactions.push({
                        id: transactionId,
                        date: transactionDate,
                        description,
                        category,
                        method,
                        type,
                        amount,
                        note: noteValue
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
        const existing = db.exec(`SELECT id FROM transactions WHERE id = ${id} AND user_id = ${userId}`);
        if (!existing[0] || existing[0].values.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        
        db.run(`DELETE FROM transactions WHERE id = ${id} AND user_id = ${userId}`);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

module.exports = router;
