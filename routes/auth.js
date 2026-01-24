// Authentication Routes
// Handles user registration, login, logout, and session management using Passport.js

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const { getDb, saveDatabase } = require('../db/database');
const { escapeSql } = require('../db/helpers');
const { generateToken, sendVerificationEmail, sendPasswordResetEmail, isValidEmail } = require('../utils/email');

// Seed default data for new users
function seedDefaultData(db, userId) {
    try {
        // Add default income category
        db.run(`INSERT INTO categories (name, type, user_id) VALUES ('Paycheck', 'Income', ${userId})`);
        
        // Add default expense categories
        db.run(`INSERT INTO categories (name, type, user_id) VALUES ('Dining', 'Expense', ${userId})`);
        db.run(`INSERT INTO categories (name, type, user_id) VALUES ('Rent', 'Expense', ${userId})`);
        db.run(`INSERT INTO categories (name, type, user_id) VALUES ('Grocery', 'Expense', ${userId})`);
        
        // Add default payment methods
        db.run(`INSERT INTO methods (name, user_id) VALUES ('American Express', ${userId})`);
        db.run(`INSERT INTO methods (name, user_id) VALUES ('Bank Transfer', ${userId})`);
        db.run(`INSERT INTO methods (name, user_id) VALUES ('Debit Card', ${userId})`);
        db.run(`INSERT INTO methods (name, user_id) VALUES ('Venmo', ${userId})`);
        
        // Add default transactions
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        
        // Transaction 1: Paycheck
        const id1 = Date.now();
        db.run(`INSERT INTO transactions (id, date, description, category, method, type, amount, note, user_id) 
                VALUES (${id1}, '${today}', 'Paycheck 2', 'Paycheck', 'Bank Transfer', 'Income', 2000, '', ${userId})`);
        
        // Transaction 2: Rent
        const id2 = Date.now() + 1;
        db.run(`INSERT INTO transactions (id, date, description, category, method, type, amount, note, user_id) 
                VALUES (${id2}, '${firstOfMonth}', 'Alpine Place Rent', 'Rent', 'Venmo', 'Expense', 1500, '', ${userId})`);
        
        // Transaction 3: Grocery
        const id3 = Date.now() + 2;
        db.run(`INSERT INTO transactions (id, date, description, category, method, type, amount, note, user_id) 
                VALUES (${id3}, '${firstOfMonth}', 'Meal Prep', 'Grocery', 'Debit Card', 'Expense', 125, '', ${userId})`);
        
        console.log(`Seeded default data for user ${userId}`);
    } catch (error) {
        console.error('Error seeding default data:', error);
        // Don't throw - seeding failure shouldn't prevent account creation
    }
}

// Rate limiting for auth routes (prevent brute force attacks)
// More lenient limits to avoid blocking legitimate users
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs (increased from 5)
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    skipFailedRequests: false
});

// Stricter rate limiting for login/register
const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login/register attempts per windowMs (increased from 3)
    message: 'Too many login attempts, please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    skipFailedRequests: false
});

// Register new user
router.post('/api/auth/register', strictAuthLimiter, async (req, res) => {
    try {
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        const { username, password, email } = req.body;
        
        // Validate input
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, password, and email are required' });
        }
        
        // Email validation
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Username validation
        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
        }
        
        // Username format validation (alphanumeric and underscore only)
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
        }
        
        // Password validation
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        // Check if username already exists
        const existingUser = db.exec(`SELECT id FROM users WHERE username = '${escapeSql(username)}'`);
        if (existingUser[0] && existingUser[0].values.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Check if email already exists
        const existingEmail = db.exec(`SELECT id FROM users WHERE email = '${escapeSql(email)}'`);
        if (existingEmail[0] && existingEmail[0].values.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Generate verification token
        const verificationToken = generateToken();
        const tokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        const tokenExpiresStr = tokenExpires.toISOString();
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user (unverified)
        db.run(`INSERT INTO users (username, password_hash, email, email_verified, verification_token, verification_token_expires) 
                VALUES ('${escapeSql(username)}', '${escapeSql(passwordHash)}', '${escapeSql(email)}', 0, '${escapeSql(verificationToken)}', '${escapeSql(tokenExpiresStr)}')`);
        saveDatabase();
        
        // Get the new user
        const userResult = db.exec(`SELECT id, username, email FROM users WHERE username = '${escapeSql(username)}'`);
        const user = userResult[0] && userResult[0].values.length > 0 ? {
            id: userResult[0].values[0][0],
            username: userResult[0].values[0][1],
            email: userResult[0].values[0][2]
        } : null;
        
        if (!user) {
            return res.status(500).json({ error: 'Failed to create user' });
        }
        
        // Send verification email
        const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');
        const emailSent = await sendVerificationEmail(email, verificationToken, baseUrl);
        
        if (!emailSent) {
            console.error('Failed to send verification email, but user was created');
            // Check if this is a Resend limitation (testing mode)
            // For now, we'll still create the account but inform the user
            // In production with a verified domain, this won't be an issue
            return res.status(200).json({ 
                success: true, 
                message: 'Account created, but verification email could not be sent. This may be due to Resend testing limitations. Please contact support or try using the email address associated with your Resend account.',
                requiresVerification: true,
                emailSent: false
            });
        }
        
        // Don't auto-login - user must verify email first
        res.json({ 
            success: true, 
            message: 'Account created. Please check your email to verify your account.',
            requiresVerification: true,
            emailSent: true
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login using Passport.js
router.post('/api/auth/login', strictAuthLimiter, (req, res, next) => {
    // Log login attempt (without password)
    const username = req.body.username || req.body.email || 'unknown';
    console.log(`[Login Attempt] Username/Email: ${username.substring(0, 20)}... (length: ${username.length})`);
    
    passport.authenticate('local', async (err, user, info) => {
        if (err) {
            console.error('[Login] Error during authentication:', err);
            return res.status(500).json({ error: 'Authentication failed' });
        }
        
        if (!user) {
            // Authentication failed
            console.log(`[Login] Authentication failed for: ${username.substring(0, 20)}... - ${info?.message || 'Unknown error'}`);
            return res.status(401).json({ error: info.message || 'Invalid username or password' });
        }
        
        // Check if email exists and is verified
        const db = getDb();
        if (db) {
            const userResult = db.exec(`SELECT email, email_verified FROM users WHERE id = ${user.id}`);
            if (userResult[0] && userResult[0].values.length > 0) {
                const email = userResult[0].values[0][0];
                const emailVerified = userResult[0].values[0][1];
                
                // Debug logging
                console.log(`[Login] User ${user.username} (id: ${user.id}) - email: ${email}, email_verified: ${emailVerified}`);
                
                // If email is missing or NULL, require association
                // Handle null, undefined, empty string, or whitespace-only
                const emailStr = (email != null && email !== undefined) ? String(email).trim() : '';
                if (!emailStr) {
                    console.log(`[Login] User ${user.username} has no email - requiring email association`);
                    // Don't log in - return special response for email association
                    return res.status(200).json({ 
                        success: false,
                        requiresEmail: true,
                        username: user.username,
                        message: 'Please associate an email address with your account.'
                    });
                }
                
                // If email exists but not verified, require verification
                // Check for 1, true, or string "1"
                const isVerified = emailVerified === 1 || emailVerified === true || emailVerified === '1' || String(emailVerified) === '1';
                if (!isVerified) {
                    console.log(`[Login] User ${user.username} has email but not verified (email_verified value: ${emailVerified}, type: ${typeof emailVerified})`);
                    return res.status(200).json({ 
                        success: false,
                        requiresVerification: true,
                        username: user.username,
                        email: emailStr,
                        message: 'Please verify your email address before logging in. Check your email for the verification link.' 
                    });
                }
                
                console.log(`[Login] User ${user.username} has verified email (email_verified: ${emailVerified}) - allowing login`);
            } else {
                // User found but no email data - treat as missing email
                console.log(`[Login] User ${user.username} - no email data found in query result`);
                return res.status(200).json({ 
                    success: false,
                    requiresEmail: true,
                    username: user.username,
                    message: 'Please associate an email address with your account.'
                });
            }
        }
        
        // Log the user in
        req.login(user, (err) => {
            if (err) {
                console.error('Error logging in user:', err);
                return res.status(500).json({ error: 'Failed to login' });
            }
            
            res.json({ 
                success: true, 
                user: { id: user.id, username: user.username } 
            });
        });
    })(req, res, next);
});

// Logout using Passport.js
router.post('/api/auth/logout', authLimiter, (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).json({ error: 'Failed to logout' });
        }
        
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({ error: 'Failed to logout' });
            }
            res.json({ success: true });
        });
    });
});

// Verify email address
router.get('/api/auth/verify-email', async (req, res) => {
    try {
        console.log('[Verify Email] Endpoint called');
        const { token } = req.query;
        console.log(`[Verify Email] Token received: ${token ? 'yes' : 'no'}`);
        
        if (!token) {
            console.log('[Verify Email] No token provided');
            return res.redirect('/?error=missing_token');
        }
        
        const db = getDb();
        if (!db) {
            console.error('[Verify Email] Database not initialized');
            return res.redirect('/?error=database_error');
        }
        
        // Find user with this verification token
        console.log(`[Verify Email] Searching for user with token: ${token.substring(0, 10)}...`);
        const userResult = db.exec(`SELECT id, username, email, verification_token_expires, email_verified FROM users WHERE verification_token = '${escapeSql(token)}'`);
        
        if (!userResult[0] || userResult[0].values.length === 0) {
            console.log('[Verify Email] No user found with this token');
            return res.redirect('/?error=invalid_token');
        }
        
        const userId = userResult[0].values[0][0];
        const username = userResult[0].values[0][1];
        const email = userResult[0].values[0][2];
        const expiresStr = userResult[0].values[0][3];
        const currentVerified = userResult[0].values[0][4];
        
        console.log(`[Verify Email] Found user: ${username} (id: ${userId}), current email_verified: ${currentVerified}`);
        
        // Check if token has expired
        if (expiresStr) {
            const expires = new Date(expiresStr);
            const now = new Date();
            console.log(`[Verify Email] Token expires: ${expiresStr}, now: ${now.toISOString()}`);
            if (expires < now) {
                console.log('[Verify Email] Token has expired');
                return res.redirect('/?error=token_expired');
            }
        }
        
        // Check if this is a new account (no default data) or existing account (email association)
        const hasDataCheck = db.exec(`SELECT COUNT(*) as count FROM transactions WHERE user_id = ${userId}`);
        const hasData = hasDataCheck[0] && hasDataCheck[0].values.length > 0 && hasDataCheck[0].values[0][0] > 0;
        
        console.log(`[Verify Email] User ${username} (id: ${userId}) - hasData: ${hasData}`);
        
        // Verify the user's email
        console.log(`[Verify Email] Executing UPDATE: SET email_verified = 1 WHERE id = ${userId}`);
        try {
            db.run(`UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ${userId}`);
            console.log('[Verify Email] UPDATE query executed');
            saveDatabase();
            console.log('[Verify Email] Database saved');
        } catch (updateError) {
            console.error('[Verify Email] Error executing UPDATE:', updateError);
            throw updateError;
        }
        
        // Verify the update worked
        const verifyCheck = db.exec(`SELECT email_verified FROM users WHERE id = ${userId}`);
        if (verifyCheck[0] && verifyCheck[0].values.length > 0) {
            const verifiedStatus = verifyCheck[0].values[0][0];
            console.log(`[Verify Email] Verification status after update: ${verifiedStatus} (type: ${typeof verifiedStatus})`);
            if (verifiedStatus !== 1 && verifiedStatus !== true && verifiedStatus !== '1') {
                console.error(`[Verify Email] WARNING: Update may have failed! Expected 1, got ${verifiedStatus}`);
            }
        } else {
            console.error('[Verify Email] WARNING: Could not verify update - user not found in verification check');
        }
        
        // Only seed default data for new accounts (accounts without any transactions)
        if (!hasData) {
            seedDefaultData(db, userId);
            saveDatabase();
            // Redirect to account verified page (new account)
            console.log(`[Verify Email] New account - redirecting to verified=true`);
            return res.redirect('/?verified=true');
        } else {
            // Existing account - email association successful
            console.log(`[Verify Email] Existing account - redirecting to email_associated=true`);
            return res.redirect('/?email_associated=true');
        }
    } catch (error) {
        console.error('[Verify Email] Exception:', error);
        console.error('[Verify Email] Stack:', error.stack);
        return res.redirect('/?error=verification_failed');
    }
});

// Request password reset
router.post('/api/auth/request-password-reset', strictAuthLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ error: 'Valid email address is required' });
        }
        
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        // Find user by email
        const userResult = db.exec(`SELECT id, username, email FROM users WHERE email = '${escapeSql(email)}'`);
        
        // Always return success (don't reveal if email exists)
        if (userResult[0] && userResult[0].values.length > 0) {
            const userId = userResult[0].values[0][0];
            const username = userResult[0].values[0][1];
            const userEmail = userResult[0].values[0][2];
            
            // Generate reset token
            const resetToken = generateToken();
            const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
            const tokenExpiresStr = tokenExpires.toISOString();
            
            // Save reset token
            db.run(`UPDATE users SET reset_token = '${escapeSql(resetToken)}', reset_token_expires = '${escapeSql(tokenExpiresStr)}' WHERE id = ${userId}`);
            saveDatabase();
            
            // Send reset email
            const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');
            await sendPasswordResetEmail(userEmail, resetToken, baseUrl);
        }
        
        // Always return success (security: don't reveal if email exists)
        res.json({ 
            success: true, 
            message: 'If that email address is registered, a password reset link has been sent.' 
        });
    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});

// Reset password
router.post('/api/auth/reset-password', strictAuthLimiter, async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;
        
        if (!token || !password || !confirmPassword) {
            return res.status(400).json({ error: 'Token, password, and confirmation are required' });
        }
        
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        // Find user with this reset token
        const userResult = db.exec(`SELECT id, reset_token_expires FROM users WHERE reset_token = '${escapeSql(token)}'`);
        
        if (!userResult[0] || userResult[0].values.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        
        const userId = userResult[0].values[0][0];
        const expiresStr = userResult[0].values[0][1];
        
        // Check if token has expired
        if (expiresStr) {
            const expires = new Date(expiresStr);
            if (expires < new Date()) {
                return res.status(400).json({ error: 'Reset token has expired' });
            }
        }
        
        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Update password and clear reset token
        db.run(`UPDATE users SET password_hash = '${escapeSql(passwordHash)}', reset_token = NULL, reset_token_expires = NULL WHERE id = ${userId}`);
        saveDatabase();
        
        res.json({ 
            success: true, 
            message: 'Password reset successfully' 
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Resend verification email (for accounts with unverified email)
router.post('/api/auth/resend-verification', strictAuthLimiter, async (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        // Find user by username
        const userResult = db.exec(`SELECT id, email, email_verified FROM users WHERE username = '${escapeSql(username)}'`);
        
        if (!userResult[0] || userResult[0].values.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userId = userResult[0].values[0][0];
        const email = userResult[0].values[0][1];
        const emailVerified = userResult[0].values[0][2];
        
        // Check if user has an email
        const emailStr = (email != null && email !== undefined) ? String(email).trim() : '';
        if (!emailStr) {
            return res.status(400).json({ error: 'No email address associated with this account' });
        }
        
        // Check if already verified
        if (emailVerified === 1 || emailVerified === true) {
            return res.status(400).json({ error: 'Email is already verified' });
        }
        
        // Generate new verification token
        const verificationToken = generateToken();
        const tokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        const tokenExpiresStr = tokenExpires.toISOString();
        
        // Update verification token
        db.run(`UPDATE users SET verification_token = '${escapeSql(verificationToken)}', verification_token_expires = '${escapeSql(tokenExpiresStr)}' WHERE id = ${userId}`);
        saveDatabase();
        
        // Send verification email
        const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');
        const emailSent = await sendVerificationEmail(emailStr, verificationToken, baseUrl);
        
        if (!emailSent) {
            console.error('Failed to send verification email');
            return res.status(500).json({ error: 'Failed to send verification email' });
        }
        
        res.json({ 
            success: true, 
            message: 'Verification email sent. Please check your email.' 
        });
    } catch (error) {
        console.error('Error resending verification email:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});

// Request email association (for existing accounts without email)
router.post('/api/auth/request-email-association', strictAuthLimiter, async (req, res) => {
    try {
        const { email, username } = req.body;
        
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ error: 'Valid email address is required' });
        }
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        const db = getDb();
        if (!db) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        
        // Find user by username
        const userResult = db.exec(`SELECT id, email FROM users WHERE username = '${escapeSql(username)}'`);
        
        if (!userResult[0] || userResult[0].values.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userId = userResult[0].values[0][0];
        const existingEmail = userResult[0].values[0][1];
        
        // Check if user already has an email
        if (existingEmail && existingEmail.trim() !== '') {
            return res.status(400).json({ error: 'This account already has an email address associated' });
        }
        
        // Check if email is already in use by another account
        const emailCheck = db.exec(`SELECT id FROM users WHERE email = '${escapeSql(email)}'`);
        if (emailCheck[0] && emailCheck[0].values.length > 0) {
            return res.status(400).json({ error: 'This email address is already registered' });
        }
        
        // Generate verification token
        const verificationToken = generateToken();
        const tokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        const tokenExpiresStr = tokenExpires.toISOString();
        
        // Save email and verification token (but don't mark as verified yet)
        db.run(`UPDATE users SET email = '${escapeSql(email)}', verification_token = '${escapeSql(verificationToken)}', verification_token_expires = '${escapeSql(tokenExpiresStr)}' WHERE id = ${userId}`);
        saveDatabase();
        
        // Send verification email
        const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');
        try {
            const emailSent = await sendVerificationEmail(email, verificationToken, baseUrl);
            
            if (!emailSent) {
                console.error('Failed to send verification email for email association');
                // Return success but indicate email wasn't sent (similar to registration)
                // This handles cases where Resend has limitations (e.g., testing mode)
                return res.status(200).json({ 
                    success: true, 
                    emailSent: false,
                    message: 'Account updated, but verification email could not be sent. This may be due to Resend testing limitations. Please contact support or verify your domain in Resend for production use.'
                });
            }
            
            res.json({ 
                success: true, 
                emailSent: true,
                message: 'Verification email sent. Please check your email.' 
            });
        } catch (emailError) {
            console.error('Exception sending verification email for email association:', emailError);
            // Still return success but indicate email wasn't sent
            return res.status(200).json({ 
                success: true, 
                emailSent: false,
                message: 'Account updated, but verification email could not be sent. Please try again or contact support.'
            });
        }
    } catch (error) {
        console.error('Error requesting email association:', error);
        res.status(500).json({ error: 'Failed to process email association request' });
    }
});

// Verify email association (same endpoint as regular verification, but handles both cases)
// The existing /api/auth/verify-email endpoint already handles this correctly

// Check session using Passport.js
// No rate limiting on session check - it's called frequently and is a read-only operation
router.get('/api/auth/session', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        res.json({ 
            authenticated: true, 
            user: { 
                id: req.user.id, 
                username: req.user.username 
            } 
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;
