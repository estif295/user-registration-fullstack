// controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateEmail, normalizeGmail } = require('../services/emailValidator');
const { checkGoogleAccount } = require('../services/googleChecker');

/**
 * Register new user with name, email, and password
 */
async function register(req, res) {
    try {
        const { name, email, password } = req.body;
        
        // Validate name has first and last name
        const nameParts = name.trim().split(/\s+/);
        if (nameParts.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Please enter your full name (first and last name)'
            });
        }
        
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        // Normalize email
        const normalizedEmail = normalizeGmail(email);
        
        // Check if user already exists (by email or normalized email)
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { normalizedEmail: normalizedEmail }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }
        
        // Validate email thoroughly
        const validationResult = await validateEmail(normalizedEmail);
        
        // Check for critical validation failures
        if (!validationResult.format_valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
                field: 'email'
            });
        }
        
        if (validationResult.disposable) {
            return res.status(400).json({
                success: false,
                message: 'Disposable email addresses are not allowed. Please use a permanent email address.',
                field: 'email'
            });
        }
        
        // Optional: Warn about role-based emails but don't block
        const isRoleBased = validationResult.role_based;
        
        // Check Google account existence
        let hasGoogleAccount = null;
        let googleCheckError = null;
        
        try {
            const googleCheck = await checkGoogleAccount(normalizedEmail);
            hasGoogleAccount = googleCheck.exists;
        } catch (error) {
            googleCheckError = error.message;
            console.log('Google check failed:', error.message);
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user with all fields
        const user = new User({
            name: name.trim(),
            firstName,
            lastName,
            email: normalizedEmail,
            normalizedEmail: normalizedEmail,
            password: hashedPassword,
            emailValidation: {
                validatedAt: new Date(),
                isDisposable: validationResult.disposable,
                isRoleBased: isRoleBased,
                hasGoogleAccount: hasGoogleAccount,
                googleCheckAt: new Date(),
                qualityScore: validationResult.quality_score,
                mxFound: validationResult.mx_found
            }
        });
        
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                name: user.name 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Prepare response
        const response = {
            success: true,
            message: 'Registration successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        };
        
        // Add warnings if any
        if (isRoleBased) {
            response.warning = 'This appears to be a role-based email (like info@). Consider using a personal email for better account recovery.';
        }
        
        if (hasGoogleAccount === true) {
            response.note = 'This email is associated with a Google account. You can use Google Sign-In for easier access.';
        }
        
        if (validationResult.typo_suggestions) {
            response.suggestion = validationResult.typo_suggestions;
        }
        
        return res.status(201).json(response);
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * Pre-registration email validation (can be called from frontend)
 */
async function validateEmailBeforeRegister(req, res) {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        
        // Normalize email
        const normalizedEmail = normalizeGmail(email);
        
        // Check if already registered
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { normalizedEmail: normalizedEmail }
            ]
        });
        
        if (existingUser) {
            return res.status(200).json({
                valid: false,
                message: 'Email already registered',
                available: false
            });
        }
        
        // Validate email
        const validationResult = await validateEmail(normalizedEmail);
        
        return res.status(200).json({
            valid: validationResult.format_valid && !validationResult.disposable,
            available: true,
            quality_score: validationResult.quality_score,
            isDisposable: validationResult.disposable,
            isRoleBased: validationResult.role_based,
            suggestion: validationResult.typo_suggestions,
            message: validationResult.disposable ? 'Disposable emails not allowed' : 
                     !validationResult.format_valid ? 'Invalid email format' : 
                     'Email is valid'
        });
        
    } catch (error) {
        console.error('Pre-validation error:', error);
        return res.status(500).json({
            valid: false,
            message: 'Validation service unavailable'
        });
    }
}

module.exports = { 
    register,
    validateEmailBeforeRegister 
};