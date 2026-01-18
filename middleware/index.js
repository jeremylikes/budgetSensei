// Middleware Configuration
// Sets up Express middleware (CORS, JSON parsing, static files, authentication)

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('../config/passport');
const path = require('path');

function setupMiddleware(app) {
    // Trust proxy (important for production behind reverse proxy like Render, Railway, etc.)
    // This allows req.protocol to correctly detect HTTPS even when behind a proxy
    app.set('trust proxy', 1);
    
    // CORS - configure to allow credentials
    app.use(cors({
        origin: true,
        credentials: true
    }));
    
    // Session management
    const isProduction = process.env.NODE_ENV === 'production';
    app.use(session({
        secret: process.env.SESSION_SECRET || 'budget-sensei-secret-key-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isProduction, // Secure cookies in production (HTTPS only, works with trust proxy)
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: isProduction ? 'lax' : 'strict' // 'lax' for production (works behind proxies), 'strict' for local dev
        }
    }));
    
    // Initialize Passport.js
    app.use(passport.initialize());
    app.use(passport.session());
    
    // JSON and URL-encoded body parsing
    app.use(express.json({ limit: '10mb' })); // Support larger payloads for multibyte characters
    app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Support URL-encoded data
    
    // Static file serving with UTF-8 charset
    app.use(express.static(path.join(__dirname, '..'), {
        setHeaders: (res, filePath) => {
            // Ensure UTF-8 charset for text-based files
            if (filePath.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
            } else if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            } else if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css; charset=utf-8');
            }
        }
    }));
}

module.exports = {
    setupMiddleware
};
