// controllers/authController.js (update your existing file)
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateEmailDeliverability, normalizeGmail } = require('../services/emailValidator');
const { checkGoogleAccount } = require('../services/googleChecker');

/**
 * Register new user with email validation
 */
async function register(req, res) {
    try {
        const { email, password } = req.body;
        
        // Normalize email
        const normalizedEmail = normalizeGmail(email);
        
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { normalizedEmail: normalizedEmail }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        // Validate email deliverability
        const validationResult = await validateEmailDeliverability(normalizedEmail);
        
        if (!validationResult.valid || validationResult.disposable || validationResult.roleBased) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address',
                details: {
                    format: validationResult.format,
                    disposable: validationResult.disposable,
                    roleBased: validationResult.roleBased
                }
            });
        }
        
        // Optional: Check Google account
        let hasGoogleAccount = null;
        try {
            const googleCheck = await checkGoogleAccount(normalizedEmail);
            hasGoogleAccount = googleCheck.exists;
        } catch (error) {
            console.log('Google check failed, continuing registration');
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            email: normalizedEmail,
            normalizedEmail: normalizedEmail,
            password: hashedPassword,
            emailValidation: {
                validatedAt: new Date(),
                isDisposable: validationResult.disposable,
                isRoleBased: validationResult.roleBased,
                hasGoogleAccount: hasGoogleAccount,
                googleCheckAt: new Date(),
                qualityScore: validationResult.qualityScore
            }
        });
        
        await user.save();
        
        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                isVerified: user.isVerified
            },
            warning: hasGoogleAccount === true ? 
                'Note: This email is associated with a Google account' : null
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
}

module.exports = { register };
// Export your other auth functions too