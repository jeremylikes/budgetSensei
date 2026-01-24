// User Settings Routes
// Handles user profile updates: username, password reset with code

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDb, saveDatabase } = require('../db/database');
const { escapeSql } = require('../db/helpers');
const { sendPasswordResetCodeEmail } = require('../utils/email');
const { requireAuth } = require('../middleware/auth');

// Generate a random 7-digit code
function generateResetCode() {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
}

// Update username
router.put('/update-username', requireAuth, async (req, res) => {
    try {
        const { username } = req.body;
        const userId = req.user.id;

        if (!username || typeof username !== 'string' || username.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Username is required' });
        }

        const escapedUsername = escapeSql(username.trim());
        const db = getDb();

        // Check if username is already taken by another user
        const existingUser = db.exec(`SELECT id FROM users WHERE username = '${escapedUsername}' AND id != ${userId}`);
        
        if (existingUser[0] && existingUser[0].values.length > 0) {
            return res.status(400).json({ success: false, error: 'Username already taken' });
        }

        // Update username
        db.run(`UPDATE users SET username = '${escapedUsername}' WHERE id = ${userId}`);
        await saveDatabase();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error in update-username route:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Request password reset code (sends email with 7-digit code)
router.post('/request-password-reset-code', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const db = getDb();

        // Get user email
        const userResult = db.exec(`SELECT email, email_verified FROM users WHERE id = ${userId}`);
        
        if (!userResult[0] || userResult[0].values.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'User not found' 
            });
        }
        
        const user = {
            email: userResult[0].values[0][0],
            email_verified: userResult[0].values[0][1]
        };

        if (!user.email || !user.email_verified) {
            return res.status(400).json({ 
                success: false, 
                error: 'No verified email address associated with this account' 
            });
        }

        // Generate 7-digit code
        const resetCode = generateResetCode();
        const codeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store code in database
        db.run(`UPDATE users SET reset_token = '${escapeSql(resetCode)}', reset_token_expires = '${codeExpires.toISOString()}' WHERE id = ${userId}`);
        await saveDatabase();

        // Send email with code
        try {
            const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');
            await sendPasswordResetCodeEmail(user.email, resetCode, baseUrl);
            res.json({ success: true });
        } catch (emailError) {
            console.error('Error sending reset code email:', emailError);
            // Still return success - code is generated and stored
            res.json({ 
                success: true, 
                emailSent: false,
                message: 'Reset code generated but email failed to send. Please contact support.' 
            });
        }
    } catch (error) {
        console.error('Error in request-password-reset-code route:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Verify reset code
router.post('/verify-reset-code', requireAuth, async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        if (!code || typeof code !== 'string' || code.length !== 7) {
            return res.status(400).json({ success: false, error: 'Invalid code format' });
        }

        const db = getDb();

        const userResult = db.exec(`SELECT reset_token, reset_token_expires FROM users WHERE id = ${userId}`);
        
        if (!userResult[0] || userResult[0].values.length === 0) {
            return res.status(400).json({ success: false, error: 'No reset code found' });
        }
        
        const user = {
            reset_token: userResult[0].values[0][0],
            reset_token_expires: userResult[0].values[0][1]
        };

        if (!user.reset_token) {
            return res.status(400).json({ success: false, error: 'No reset code found' });
        }

        // Check if code matches
        if (user.reset_token !== code) {
            return res.status(400).json({ success: false, error: 'Invalid code' });
        }

        // Check if code is expired
        const now = new Date();
        const expires = new Date(user.reset_token_expires);
        if (now > expires) {
            return res.status(400).json({ success: false, error: 'Code has expired' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error in verify-reset-code route:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update password (after code verification)
router.put('/update-password', requireAuth, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                error: 'Password must be at least 6 characters' 
            });
        }

        const db = getDb();

        // Verify that a reset code was used (check reset_token exists and is valid)
        const userResult = db.exec(`SELECT reset_token, reset_token_expires FROM users WHERE id = ${userId}`);
        
        if (!userResult[0] || userResult[0].values.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please request a reset code first' 
            });
        }
        
        const user = {
            reset_token: userResult[0].values[0][0],
            reset_token_expires: userResult[0].values[0][1]
        };

        if (!user.reset_token) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please request a reset code first' 
            });
        }

        // Check if code is expired
        const now = new Date();
        const expires = new Date(user.reset_token_expires);
        if (now > expires) {
            return res.status(400).json({ 
                success: false, 
                error: 'Reset code has expired. Please request a new code.' 
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and clear reset token
        db.run(`UPDATE users SET password_hash = '${escapeSql(hashedPassword)}', reset_token = NULL, reset_token_expires = NULL WHERE id = ${userId}`);
        saveDatabase();
        
        // Verify the password was updated by checking the hash matches
        const verifyResult = db.exec(`SELECT password_hash FROM users WHERE id = ${userId}`);
        if (!verifyResult[0] || verifyResult[0].values.length === 0) {
            console.error('Failed to verify password update - user not found');
            return res.status(500).json({ success: false, error: 'Failed to update password' });
        }
        
        const updatedHash = verifyResult[0].values[0][0];
        // Verify the hash was updated (should match our new hash)
        if (!updatedHash || updatedHash !== hashedPassword) {
            console.error('Password hash mismatch after update', {
                expected: hashedPassword.substring(0, 20) + '...',
                got: updatedHash ? updatedHash.substring(0, 20) + '...' : 'null'
            });
            return res.status(500).json({ success: false, error: 'Password update verification failed' });
        }
        
        // Invalidate the current session - user must log in again with new password
        req.logout((err) => {
            if (err) {
                console.error('Error logging out after password change:', err);
            }
        });
        
        res.json({ 
            success: true,
            message: 'Password updated successfully. Please log in again with your new password.'
        });
    } catch (error) {
        console.error('Error in update-password route:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
