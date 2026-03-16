// controllers/emailValidationController.js
const User = require('../models/user');
const { validateEmailDeliverability, normalizeGmail } = require('../services/emailValidator');
const { checkGoogleAccount } = require('../services/googleChecker');

/**
 * Validate email before registration
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
        
        // Step 1: Normalize email (especially for Gmail)
        const normalizedEmail = normalizeGmail(email);
        
        // Step 2: Check if already registered in your system
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { normalizedEmail: normalizedEmail }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered',
                code: 'EMAIL_EXISTS'
            });
        }
        
        // Step 3: Validate email deliverability
        const validationResult = await validateEmailDeliverability(normalizedEmail);
        
        if (!validationResult.valid && validationResult.format === false) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
                code: 'INVALID_FORMAT'
            });
        }
        
        // Step 4: Check for disposable emails
        if (validationResult.disposable) {
            return res.status(400).json({
                success: false,
                message: 'Disposable email addresses are not allowed',
                code: 'DISPOSABLE_EMAIL'
            });
        }
        
        // Step 5: Check for role-based emails
        if (validationResult.roleBased) {
            return res.status(400).json({
                success: false,
                message: 'Please use a personal email address, not a role-based one (like info@, support@)',
                code: 'ROLE_BASED'
            });
        }
        
        // Step 6: Check Google account existence (optional - warn but don't block)
        let googleCheck = { exists: null };
        try {
            googleCheck = await checkGoogleAccount(normalizedEmail);
        } catch (error) {
            console.log('Google check failed, proceeding anyway');
        }
        
        // Return validation result
        return res.status(200).json({
            success: true,
            valid: true,
            email: normalizedEmail,
            googleAccountExists: googleCheck.exists,
            googleCheckNote: googleCheck.exists === true ? 
                'This email is associated with a Google account' : null,
            validationDetails: {
                qualityScore: validationResult.qualityScore,
                mxFound: validationResult.mxFound
            }
        });
        
    } catch (error) {
        console.error('Email validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validating email',
            error: error.message
        });
    }
}

/**
 * Quick check endpoint (for frontend validation)
 */
async function quickEmailCheck(req, res) {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ valid: false });
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
        return res.status(500).json({ valid: false, error: error.message });
    }
}

module.exports = { validateEmailForRegistration, quickEmailCheck };