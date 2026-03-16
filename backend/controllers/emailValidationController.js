// controllers/emailValidationController.js
const User = require('../models/user');

/**
 * Validate email for registration
 */
async function validateEmailForRegistration(req, res) {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if email already exists in database
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check for disposable email domains (basic list)
        const disposableDomains = ['tempmail.com', 'throwaway.com', 'mailinator.com'];
        const domain = email.split('@')[1];
        
        if (disposableDomains.includes(domain)) {
            return res.status(400).json({
                success: false,
                message: 'Disposable email addresses are not allowed'
            });
        }

        return res.status(200).json({
            success: true,
            valid: true,
            email: email,
            message: 'Email is valid'
        });

    } catch (error) {
        console.error('Email validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validating email'
        });
    }
}

/**
 * Quick email check (for frontend)
 */
async function quickEmailCheck(req, res) {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                valid: false 
            });
        }

        // Basic format check
        const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        
        // Check if already registered
        const existingUser = await User.findOne({ email });
        
        return res.status(200).json({
            valid: isValidFormat,
            available: !existingUser,
            format: isValidFormat
        });

    } catch (error) {
        console.error('Quick email check error:', error);
        return res.status(500).json({ 
            valid: false, 
            error: error.message 
        });
    }
}

module.exports = { 
    validateEmailForRegistration, 
    quickEmailCheck 
};