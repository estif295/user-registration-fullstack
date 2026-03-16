// middleware/validation.js
const { body, validationResult } = require('express-validator');

// Comprehensive validation rules for registration
const validateRegistration = [
    // Name validation
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces')
        .custom(value => {
            // Check if name has at least first and last name
            const nameParts = value.trim().split(/\s+/);
            if (nameParts.length < 2) {
                throw new Error('Please enter your full name (first and last name)');
            }
            return true;
        }),
    
    // Email validation
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail()
        .custom(email => {
            // Additional email validation
            const domain = email.split('@')[1];
            const allowedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
            
            // Optional: Restrict to specific domains
            // if (!allowedDomains.includes(domain)) {
            //     throw new Error('Please use a mainstream email provider');
            // }
            return true;
        }),
    
    // Password validation
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number')
        .matches(/^(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one special character (!@#$%^&*)'),
    
    // Confirm password (if you have confirm password field)
    body('confirmPassword')
        .optional()
        .custom((value, { req }) => {
            if (value && value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Rate limiting middleware
const rateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!global.rateLimitStore) {
        global.rateLimitStore = new Map();
    }
    
    const userAttempts = global.rateLimitStore.get(ip) || [];
    const recentAttempts = userAttempts.filter(time => now - time < 60000); // Last minute
    
    if (recentAttempts.length >= 3) {
        return res.status(429).json({
            success: false,
            message: 'Too many registration attempts. Please try again later.'
        });
    }
    
    recentAttempts.push(now);
    global.rateLimitStore.set(ip, recentAttempts);
    next();
};

module.exports = {
    validateRegistration,
    handleValidationErrors,
    rateLimiter
};