// Main Server Entry Point
// Coordinates all modules and starts the Express server

// Load environment variables from .env file (for local development)
// Try .env first, then fall back to 'env' if .env doesn't exist
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
const envPathAlt = path.join(__dirname, 'env');

if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('Loaded environment variables from .env file');
} else if (fs.existsSync(envPathAlt)) {
    require('dotenv').config({ path: envPathAlt });
    console.log('Loaded environment variables from "env" file (consider renaming to ".env")');
} else {
    require('dotenv').config(); // Try default .env
}

// Verify critical environment variables are loaded
if (process.env.RESEND_API_KEY) {
    console.log('✓ RESEND_API_KEY is configured');
} else {
    console.warn('⚠ RESEND_API_KEY is not set - email functionality will not work');
}

if (process.env.RESEND_FROM_EMAIL) {
    console.log(`✓ RESEND_FROM_EMAIL is set to: ${process.env.RESEND_FROM_EMAIL}`);
} else {
    console.warn('⚠ RESEND_FROM_EMAIL is not set - using default: onboarding@resend.dev');
}

const express = require('express');
const { initializeDatabase, saveDatabase, getDb } = require('./db/database');
const { setupMiddleware } = require('./middleware');
const { DB_DIR, DB_FILENAME, DB_FILE, isLocalDev } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup middleware (CORS, JSON parsing, static files, auth)
setupMiddleware(app);

// Load routes
const authRoutes = require('./routes/auth');
const migrateRoutes = require('./routes/migrate');
const dataRoutes = require('./routes');
const transactionRoutes = require('./routes/transactions');
const { router: categoryRoutes } = require('./routes/categories');
const methodRoutes = require('./routes/methods');
const budgetRoutes = require('./routes/budgets');
const userRoutes = require('./routes/user');

// Auth routes (no authentication required)
app.use(authRoutes);

// Protected routes (require authentication)
app.use(migrateRoutes);
app.use(dataRoutes);
app.use(transactionRoutes);
app.use(categoryRoutes);
app.use(methodRoutes);
app.use(budgetRoutes);
app.use('/api/user', userRoutes);

// Start server - wait for database initialization
async function startServer() {
    try {
        await initializeDatabase();
        console.log('Database initialized successfully');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Database file: ${DB_FILE}`);
            console.log(`Database directory: ${DB_DIR}`);
            if (isLocalDev) {
                console.log(`✓ LOCAL DEVELOPMENT MODE - Using local database (${DB_FILENAME}) - will NOT affect production`);
            } else if (DB_DIR !== require('path').join(__dirname)) {
                console.log(`✓ Using persistent storage location (data will survive deployments)`);
            } else {
                console.log(`⚠ Using project directory (data may be lost on deployment - set DB_PATH env var for persistence)`);
            }
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Server is ready to accept connections`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
    const db = getDb();
    if (db) {
        saveDatabase();
        db.close();
    }
    process.exit(0);
});
