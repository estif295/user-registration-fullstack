// backend/controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { checkGoogleAccount } = require('../services/googleChecker');

/**
 * Register new user
 */
async function register(req, res) {
    try {
        const { name, email, password } = req.body;
        
        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        console.log(`\n📝 REGISTRATION ATTEMPT: ${email}`);

        // Check if already registered
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Check Google account
        const googleCheck = await checkGoogleAccount(email);
        
        if (!googleCheck.success) {
            return res.status(400).json({
                success: false,
                message: 'Unable to verify Google account status. Please try again later.'
            });
        }
        
        if (googleCheck.hasGoogleAccount !== true) {
            console.log(`❌ BLOCKED: ${email} has NO Google account`);
            return res.status(400).json({
                success: false,
                message: 'Registration is only allowed for emails that have a Google account.',
                code: 'NO_GOOGLE_ACCOUNT'
            });
        }

        // ALLOW registration
        console.log(`✅ ALLOWED: ${email} has REAL Google account`);

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user object
        const userData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            hasGoogleAccount: true,
            googleVerifiedAt: new Date()
        };
        
        console.log('Creating user with data:', userData);

        // Create and save user
        const user = new User(userData);
        await user.save();
        
        console.log(`✅ USER CREATED: ${user.email}`);

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        
        // Check for duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again later.'
        });
    }
}

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

        console.log(`\n🔍 CHECKING EMAIL: ${email}`);
        
        // Check if already registered
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        // Check Google account
        const googleCheck = await checkGoogleAccount(email);
        
        let canRegister = false;
        let message = '';
        
        if (existingUser) {
            canRegister = false;
            message = '❌ Email already registered in our system';
        }
        else if (googleCheck.success) {
            if (googleCheck.hasGoogleAccount === true) {
                canRegister = true;
                message = '✅ Email has REAL Google account - you can register';
            } else {
                canRegister = false;
                message = '❌ Email has NO Google account - registration not allowed';
            }
        } else {
            canRegister = false;
            message = '⚠️ Unable to verify email - please try again later';
        }

        return res.status(200).json({
            success: true,
            email: email,
            alreadyRegistered: !!existingUser,
            hasGoogleAccount: googleCheck.hasGoogleAccount,
            canRegister: canRegister,
            message: message
        });

    } catch (error) {
        console.error('Email check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking email'
        });
    }
}

module.exports = { register, checkEmailBeforeRegister };