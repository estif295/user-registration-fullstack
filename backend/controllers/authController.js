// backend/controllers/authController.js
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { checkEmail } = require('../services/ultimateEmailChecker');

/**
 * Check email before registration (FREE ULTIMATE VERSION)
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
        
        // Use our FREE ultimate email checker
        const emailCheck = await checkEmail(email);
        
        let canRegister = false;
        let message = '';
        
        if (existingUser) {
            canRegister = false;
            message = '❌ Email already registered in our system';
        }
        else if (emailCheck.success) {
            canRegister = emailCheck.canRegister;
            message = emailCheck.message;
        } else {
            canRegister = false;
            message = '⚠️ Unable to verify email - please try again';
        }

        const response = {
            success: true,
            email: email,
            canonicalEmail: emailCheck.canonicalEmail,
            alreadyRegistered: !!existingUser,
            isRealGmail: emailCheck.isRealGmail,
            canRegister: canRegister,
            message: message,
            details: {
                isValid: emailCheck.isValid,
                isDisposable: emailCheck.isDisposable,
                isRoleBased: emailCheck.isRoleBased
            }
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
 * Register new user (ONLY ALLOW REAL GMAIL ACCOUNTS)
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

        // Use our FREE ultimate email checker
        const emailCheck = await checkEmail(email);
        
        if (!emailCheck.success) {
            return res.status(400).json({
                success: false,
                message: 'Unable to verify email. Please try again.'
            });
        }
        
        // ONLY ALLOW REAL GMAIL ACCOUNTS
        if (!emailCheck.isRealGmail) {
            console.log(`❌ BLOCKED: ${email} is not a real Gmail account`);
            return res.status(400).json({
                success: false,
                message: emailCheck.message,
                code: 'INVALID_EMAIL'
            });
        }

        // ALLOW registration
        console.log(`✅ ALLOWED: ${email} is a REAL Gmail account`);

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            name: name.trim(),
            email: emailCheck.canonicalEmail.toLowerCase(), // Use canonical email
            password: hashedPassword,
            originalEmail: email,
            verifiedAt: new Date()
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
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
}

module.exports = { register, checkEmailBeforeRegister };