// Middleware Configuration
// Sets up Express middleware (CORS, JSON parsing, static files, authentication)

const express = require('express');
const cors = require('cors');
const basicAuth = require('express-basic-auth');
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
    
    // Determine if we should use secure cookies
    // Use secure cookies if:
    // 1. NODE_ENV is production AND
    // 2. We're actually using HTTPS (check via proxy headers or direct connection)
    // For production behind a proxy, we trust the X-Forwarded-Proto header
    const isProduction = process.env.NODE_ENV === 'production';
    // In production, use secure cookies but trust proxy headers
    // This allows cookies to work behind reverse proxies (Render, Railway, etc.)
    const useSecureCookies = isProduction;
    
    // Session management
    app.use(session({
        secret: process.env.SESSION_SECRET || 'budget-sensei-secret-key-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: useSecureCookies, // Secure cookies in production (works with trust proxy)
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: isProduction ? 'lax' : 'strict' // 'lax' works better behind proxies, 'strict' for local dev
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
    
    // Basic authentication (if password is set) - only for non-API routes
    // This is kept for backward compatibility but can be removed once all users migrate
    const BUDGET_PASSWORD = process.env.BUDGET_PASSWORD || '';
    if (BUDGET_PASSWORD) {
        // Only apply basic auth to non-API routes
        app.use((req, res, next) => {
            if (!req.path.startsWith('/api/')) {
                return basicAuth({
                    users: { 'admin': BUDGET_PASSWORD },
                    challenge: true,
                    realm: 'Budget Sensei'
                })(req, res, next);
            }
            next();
        });
    }
}

module.exports = {
    setupMiddleware
};
