// Middleware Configuration
// Sets up Express middleware (CORS, JSON parsing, static files, authentication)

const express = require('express');
const cors = require('cors');
const basicAuth = require('express-basic-auth');
const path = require('path');

function setupMiddleware(app) {
    // CORS
    app.use(cors());
    
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
    
    // Basic authentication (if password is set)
    const BUDGET_PASSWORD = process.env.BUDGET_PASSWORD || '';
    if (BUDGET_PASSWORD) {
        app.use(basicAuth({
            users: { 'admin': BUDGET_PASSWORD },
            challenge: true,
            realm: 'Budget Sensei'
        }));
    }
}

module.exports = {
    setupMiddleware
};
