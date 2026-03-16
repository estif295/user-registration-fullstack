// controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { checkGoogleAccount } = require('../services/googleChecker');

/**
 * Check email before registration
 */
async function checkEmailBeforeRegister(req, res) {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        console.log('🔍 Checking email:', email);

        // Check if already registered in your system
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        // Check Google account
        const googleCheck = await checkGoogleAccount(email);
        
        console.log('Google check result:', googleCheck);

        // Prepare response
        const response = {
            success: true,
            email: email,
            available: !existingUser,
            hasGoogleAccount: googleCheck.hasGoogleAccount,
            googleCheckStatus: googleCheck.success ? 'success' : 'failed',
        };

        // Add appropriate message
        if (googleCheck.success) {
            if (googleCheck.hasGoogleAccount) {
                response.message = '⚠️ This email has a Google account';
                response.warning = true;
            } else {
                response.message = '✅ No Google account detected';
            }
        } else {
            response.message = '⚠️ Could not verify Google account status';
            response.note = googleCheck.note || 'Service temporarily unavailable';
        }

        // If email already registered in your system
        if (existingUser) {
            response.message = '❌ Email already registered in our system';
            response.available = false;
        }

        res.json(response);

    } catch (error) {
        console.error('Email check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking email',
            error: error.message
        });
    }
}

/**
 * Register new user
 */
async function register(req, res) {
    try {
        console.log('📝 Registration request received:', req.body);
        
        const { name, email, password } = req.body;
        
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Check Google account
        console.log(`🔍 Checking Google account for: ${email}`);
        const googleCheck = await checkGoogleAccount(email);
        
        // If Google check was successful and account exists, block registration
        if (googleCheck.success && googleCheck.hasGoogleAccount) {
            console.log(`⚠️ Email ${email} has a Google account - blocking registration`);
            
            return res.status(400).json({
                success: false,
                message: 'This email is already associated with a Google account. Please sign in with Google instead.',
                code: 'GOOGLE_ACCOUNT_EXISTS',
                suggestion: 'Use "Sign in with Google" option'
            });
        }

        // If check failed but it's a gmail.com domain, we should be cautious
        if (!googleCheck.success && email.toLowerCase().includes('@gmail.com')) {
            console.log(`⚠️ Could not verify Google status for Gmail address: ${email}`);
            
            // You can choose to allow or block
            // I'll allow but add a warning
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            googleAccountCheck: {
                checked: true,
                hasGoogleAccount: googleCheck.hasGoogleAccount,
                checkedAt: new Date(),
                note: googleCheck.note || ''
            }
        });

        await user.save();
        console.log('✅ User created successfully:', user.email);

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
                email: user.email
            }
        };

        // Add warning if Google check failed for Gmail
        if (!googleCheck.success && email.toLowerCase().includes('@gmail.com')) {
            response.warning = 'Could not verify Google account status. If you have a Google account, consider using Google Sign-In.';
        }

        res.status(201).json(response);

    } catch (error) {
        console.error('❌ Registration error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports = { register, checkEmailBeforeRegister };