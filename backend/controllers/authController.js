// backend/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Check email
async function checkEmail(req, res) {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email required' });
        }
        
        // Simple check - you can replace with real email checker later
        const isRealGmail = email.includes('@gmail.com');
        
        res.json({ 
            success: true, 
            email, 
            isRealGmail,
            canRegister: isRealGmail,
            message: isRealGmail ? '✅ Valid Gmail' : '❌ Only Gmail allowed'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Register
async function register(req, res) {
    try {
        const { name, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Only allow Gmail
        if (!email.includes('@gmail.com')) {
            return res.status(400).json({ success: false, message: 'Only Gmail accounts allowed' });
        }

        // Create verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Create user; password will be hashed by schema pre-save hook
        const user = new User({
            name,
            email,
            password,
            verificationToken,
            verificationTokenExpires: new Date(Date.now() + 24*60*60*1000),
            isVerified: false,
            isRealGmail: true
        });
        
        await user.save();
        console.log(`✅ User created: ${user.email} with ID: ${user._id}`);
        
        // Send verification email
        try {
            await emailService.sendVerificationEmail(email, name, verificationToken);
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
            // Still return success - user can still get link from console
        }
        
        res.status(201).json({
            success: true,
            message: 'Please check your email to verify your account.',
            userId: user._id
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
}

// Verify email
async function verifyEmail(req, res) {
    try {
        const { token } = req.query;
        
        console.log(`🔍 Verifying email with token: ${token}`);
        
        if (!token) {
            return res.status(400).json({ success: false, message: 'Token required' });
        }

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log('❌ Invalid or expired token');
            return res.status(400).json({ success: false, message: 'Invalid or expired link' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        console.log(`✅ Email verified for: ${user.email}`);
        
        res.json({ 
            success: true, 
            message: 'Email verified successfully! You can now log in.' 
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
}

// Resend verification
async function resendVerification(req, res) {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'Email already verified' });
        }
        
        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = new Date(Date.now() + 24*60*60*1000);
        await user.save();
        
        // Send email
        await emailService.sendVerificationEmail(user.email, user.name, verificationToken);
        
        res.json({ success: true, message: 'Verification email resent' });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Login
async function login(req, res) {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        if (!user.isVerified) {
            return res.status(401).json({ 
                success: false, 
                message: 'Please verify your email first',
                needsVerification: true 
            });
        }
        
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        });
        
    } catch (error) {
        console.error('Login handler error:', error);
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
}

// Export ALL functions
module.exports = {
    checkEmail,
    register,
    verifyEmail,
    resendVerification,
    login
};