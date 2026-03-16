// backend/controllers/authController.js
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

        console.log(`\n🔍 CHECKING EMAIL: ${email}`);
        
        // Check if already registered in your system
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
                // live: true → HAS Google account → ALLOW
                canRegister = true;
                message = '✅ Email has REAL Google account - you can register';
            } else {
                // live: false → NO Google account → BLOCK
                canRegister = false;
                message = '❌ Email has NO Google account - registration not allowed';
            }
        } else {
            canRegister = false;
            message = '⚠️ Unable to verify email - please try again later';
        }

        const response = {
            success: true,
            email: email,
            alreadyRegistered: !!existingUser,
            hasGoogleAccount: googleCheck.hasGoogleAccount,
            canRegister: canRegister,
            message: message
        };

        console.log(`📋 DECISION: ${message}`);
        res.json(response);

    } catch (error) {
        console.error('Email check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking email'
        });
    }
}

/**
 * Register new user
 */
async function register(req, res) {
    try {
        const { name, email, password } = req.body;
        
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
            // Block if NO Google account
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

        // Create user
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            hasGoogleAccount: true,
            googleVerifiedAt: new Date()
        });

        await user.save();
        console.log(`✅ USER CREATED: ${user.email}`);

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
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
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
}

module.exports = { register, checkEmailBeforeRegister };