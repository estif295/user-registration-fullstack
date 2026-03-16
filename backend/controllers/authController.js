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
        res.json({ 
            success: true, 
            email, 
            isRealGmail: email.includes('@gmail.com'),
            message: 'Email check working' 
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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpires: new Date(Date.now() + 24*60*60*1000),
            isVerified: false
        });
        
        await user.save();
        
        // Try to send email (but don't fail if it doesn't work)
        try {
            await emailService.sendVerificationEmail(email, name, verificationToken);
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
        }
        
        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email.'
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
        res.json({ success: true, message: 'Verification endpoint working' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Resend verification
async function resendVerification(req, res) {
    try {
        const { email } = req.body;
        res.json({ success: true, message: 'Resend endpoint working' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Login
async function login(req, res) {
    try {
        const { email, password } = req.body;
        res.json({ success: true, message: 'Login endpoint working' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    checkEmail,
    register,
    verifyEmail,
    resendVerification,
    login
};