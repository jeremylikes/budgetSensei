// Authentication Middleware
// Protects routes that require authentication

function requireAuth(req, res, next) {
    // Passport.js adds req.user if authenticated
    if (req.isAuthenticated && req.isAuthenticated()) {
        // User is authenticated
        next();
    } else {
        // User is not authenticated
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Get current user ID from session (Passport.js compatible)
function getCurrentUserId(req) {
    // Passport.js stores user in req.user
    if (req.user && req.user.id) {
        return req.user.id;
    }
    // Fallback for backward compatibility
    return req.session && req.session.userId ? req.session.userId : null;
}

module.exports = {
    requireAuth,
    getCurrentUserId
};
