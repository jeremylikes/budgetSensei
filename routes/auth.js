// Authentication Routes
// Handles user registration, login, logout, and session management using Passport.js

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const { getDb, saveDatabase } = require('../db/database');
const { escapeSql } = require('../db/helpers');

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
        
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
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
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user
        db.run(`INSERT INTO users (username, password_hash) VALUES ('${escapeSql(username)}', '${escapeSql(passwordHash)}')`);
        saveDatabase();
        
        // Get the new user
        const userResult = db.exec(`SELECT id, username FROM users WHERE username = '${escapeSql(username)}'`);
        const user = userResult[0] && userResult[0].values.length > 0 ? {
            id: userResult[0].values[0][0],
            username: userResult[0].values[0][1]
        } : null;
        
        if (!user) {
            return res.status(500).json({ error: 'Failed to create user' });
        }
        
        // Automatically log in the new user using Passport
        req.login(user, (err) => {
            if (err) {
                console.error('Error auto-logging in new user:', err);
                // User created but login failed - still return success
                return res.json({ 
                    success: true, 
                    user: { id: user.id, username: user.username },
                    message: 'Account created. Please log in.'
                });
            }
            
            res.json({ 
                success: true, 
                user: { id: user.id, username: user.username } 
            });
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login using Passport.js
router.post('/api/auth/login', strictAuthLimiter, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Error during authentication:', err);
            return res.status(500).json({ error: 'Authentication failed' });
        }
        
        if (!user) {
            // Authentication failed
            return res.status(401).json({ error: info.message || 'Invalid username or password' });
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
