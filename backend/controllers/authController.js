const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ========== REGISTER USER ==========
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log('📝 Registration attempt for:', email);
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: verificationToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });
    
    console.log('✅ User created:', user.email);
    
    // Create verification URL
    const verificationUrl = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;
    
    // Send email (optional - can be commented out for testing)
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      const message = `
        <h1>Email Verification</h1>
        <p>Thank you for registering, ${name}!</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `;
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Verify Your Email',
        html: message
      });
      
      console.log('📧 Verification email sent');
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
      // Continue even if email fails
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.status(201).json({
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
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== LOGIN USER ==========
// ✅ UPDATED: Now REQUIRES email verification
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt for:', email);
    
    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      console.log('❌ Password incorrect');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // ✅ REQUIRE EMAIL VERIFICATION - REMOVED DEVELOPMENT BYPASS
    if (!user.isVerified) {
      console.log('❌ Email not verified for:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        needsVerification: true,
        email: user.email
      });
    }
    
    console.log('✅ Login successful for:', user.email);
    
    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
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
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ========== VERIFY EMAIL ==========
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('🔍 Verifying email with token:', token);
    
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired link' 
      });
    }
    
    // Update user
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    
    await user.save({ validateBeforeSave: false });
    
    console.log('✅ Email verified for:', user.email);
    
    res.redirect('http://localhost:3000/login?verified=true');
    
  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========== RESEND VERIFICATION ==========
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }
    
    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });
    
    // Create verification URL
    const verificationUrl = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;
    
    // Send email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      const message = `
        <h1>Email Verification</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `;
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Verify Your Email',
        html: message
      });
      
      res.json({ success: true, message: 'Verification email sent' });
      
    } catch (emailError) {
      console.error('Email error:', emailError);
      res.status(500).json({ message: 'Failed to send email' });
    }
    
  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ IMPORTANT: Export all functions at the bottom
module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification
};