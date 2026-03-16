// middleware/validation.js
const { body, validationResult } = require('express-validator');

// Email format validation rules
const validateEmailFormat = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Rate limiting for validation attempts
const validateRateLimit = (req, res, next) => {
    // Simple in-memory rate limit
    // In production, use Redis or similar
    const ip = req.ip;
    const now = Date.now();
    
    if (!global.rateLimitStore) {
        global.rateLimitStore = new Map();
    }
    
    const userAttempts = global.rateLimitStore.get(ip) || [];
    const recentAttempts = userAttempts.filter(time => now - time < 60000); // Last minute
    
    if (recentAttempts.length >= 5) {
        return res.status(429).json({
            success: false,
            message: 'Too many validation attempts. Please try again later.'
        });
    }
    
    recentAttempts.push(now);
    global.rateLimitStore.set(ip, recentAttempts);
    next();
};

module.exports = {
    validateEmailFormat,
    handleValidationErrors,
    validateRateLimit
};