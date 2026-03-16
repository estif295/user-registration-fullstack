// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RealEmailChecker = require('../services/realEmailChecker');
const emailService = require('../services/emailService');

const emailChecker = new RealEmailChecker(process.env.BLOOMBOX_URL);

// Generate verification token
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Register new user
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

        // Step 1: Check if email is REAL
        console.log(`🔍 Step 1: Checking if ${email} is REAL...`);
        const emailCheck = await emailChecker.checkEmail(email);

        if (!emailCheck.success) {
            return res.status(503).json({
                success: false,
                message: 'Email verification service unavailable. Please try again.'
            });
        }

        // Step 2: Apply your business rule (ONLY REAL Gmail accounts)
        if (!emailCheck.isRealGmail) {
            console.log(`❌ Blocked: ${email} - ${emailCheck.message}`);
            return res.status(400).json({
                success: false,
                message: emailCheck.message,
                code: emailCheck.isGmail ? 'INVALID_GMAIL' : 'NON_GMAIL_NOT_ALLOWED'
            });
        }

        // Step 3: Check if already registered
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Step 4: Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Step 5: Create verification token
        const verificationToken = generateToken();
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Step 6: Create user (unverified)
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            verificationToken,
            verificationTokenExpires: tokenExpires,
            isRealGmail: true,
            isVerified: false
        });

        await user.save();
        console.log(`✅ User created: ${email} (unverified)`);

        // Step 7: Send verification email (DON'T WAIT for response)
        emailService.sendVerificationEmail(email, name, verificationToken)
            .catch(err => console.error('Background email error:', err));

        // Step 8: Respond to user
        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            requiresVerification: true,
            email: email
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

// Verify email
async function verifyEmail(req, res) {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        // Find user with valid token
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification link'
            });
        }

        // Mark as verified
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        user.emailVerifiedAt = new Date();
        await user.save();

        console.log(`✅ Email verified for: ${user.email}`);

        // Redirect to frontend success page or return JSON
        res.json({
            success: true,
            message: 'Email verified successfully! You can now log in.',
            email: user.email
        });

    } catch (error) {
        console.error('❌ Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed. Please try again.'
        });
    }
}

// Resend verification email
async function resendVerification(req, res) {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Generate new token
        const verificationToken = generateToken();
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        // Send new verification email
        await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

        res.json({
            success: true,
            message: 'Verification email resent. Please check your inbox.'
        });

    } catch (error) {
        console.error('Resend error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend verification email'
        });
    }
}

// Login (only allow verified users)
async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if verified
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in',
                needsVerification: true,
                email: user.email
            });
        }

        // Check password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                name: user.name 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
}

// Check email before registration (for frontend)
async function checkEmail(req, res) {
    try {
        const { email } = req.body;

        const result = await emailChecker.checkEmail(email);

        res.json({
            success: true,
            email: email,
            isRealGmail: result.isRealGmail,
            message: result.message,
            canRegister: result.isRealGmail
        });

    } catch (error) {
        console.error('Check email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking email'
        });
    }
}

module.exports = {
    register,
    verifyEmail,
    resendVerification,
    login,
    checkEmail
};