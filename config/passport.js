// Passport.js Configuration
// Sets up authentication strategies

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { getDb } = require('../db/database');
const { escapeSql } = require('../db/helpers');

// Configure local strategy (username/password)
passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password'
    },
    async (username, password, done) => {
        try {
            const db = getDb();
            if (!db) {
                return done(new Error('Database not initialized'));
            }
            
            // Find user
            const userResult = db.exec(`SELECT id, username, password_hash FROM users WHERE username = '${escapeSql(username)}'`);
            if (!userResult[0] || userResult[0].values.length === 0) {
                // Don't reveal if user exists - generic error message
                return done(null, false, { message: 'Invalid username or password' });
            }
            
            const user = {
                id: userResult[0].values[0][0],
                username: userResult[0].values[0][1],
                passwordHash: userResult[0].values[0][2]
            };
            
            // Verify password
            const passwordMatch = await bcrypt.compare(password, user.passwordHash);
            if (!passwordMatch) {
                return done(null, false, { message: 'Invalid username or password' });
            }
            
            // Success - return user object
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
    try {
        const db = getDb();
        if (!db) {
            return done(new Error('Database not initialized'));
        }
        
        const userResult = db.exec(`SELECT id, username FROM users WHERE id = ${id}`);
        if (!userResult[0] || userResult[0].values.length === 0) {
            return done(null, false);
        }
        
        const user = {
            id: userResult[0].values[0][0],
            username: userResult[0].values[0][1]
        };
        
        done(null, user);
    } catch (error) {
        done(error);
    }
});

module.exports = passport;
