const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// @desc    Forgot Password - Send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔍 Forgot password request for:', email);
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found:', email);
      // For security, still return success even if user doesn't exist
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists with this email, a reset link will be sent.' 
      });
    }
    
    console.log('✅ User found:', user.email);
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log('🔑 Reset token generated:', resetToken);
    
    // Hash token and save to database
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save({ validateBeforeSave: false });
    console.log('💾 Reset token saved to database');
    
    // Create reset URL - MAKE SURE THIS MATCHES YOUR FRONTEND ROUTE
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    console.log('🔗 Reset URL:', resetUrl);
    
    // Email content
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4f46e5; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>This link will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            <p>Or copy this link to your browser:</p>
            <p style="word-break: break-all; color: #4f46e5;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Send email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: `"User Registration System" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: message
      });
      
      console.log('📧 Reset email sent to:', user.email);
      
      res.status(200).json({ 
        success: true, 
        message: 'Password reset email sent successfully' 
      });
      
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      
      // Clean up token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({ 
        success: false,
        message: 'Email could not be sent. Please try again.' 
      });
    }
    
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { resetToken } = req.params;
    
    console.log('🔍 Reset password attempt with token:', resetToken);
    
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a password with at least 6 characters' 
      });
    }
    
    if (!resetToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Reset token is required' 
      });
    }
    
    // Hash the token from URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    console.log('🔑 Hashed token:', hashedToken);
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      // Check if token exists but expired
      const expiredUser = await User.findOne({
        resetPasswordToken: hashedToken
      });
      
      if (expiredUser) {
        console.log('⏰ Token expired for:', expiredUser.email);
        return res.status(400).json({ 
          success: false,
          message: 'Reset link has expired. Please request a new one.' 
        });
      }
      
      return res.status(400).json({ 
        success: false,
        message: 'Invalid reset link' 
      });
    }
    
    console.log('✅ Valid token found for:', user.email);
    
    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    console.log('✅ Password reset successful for:', user.email);
    
    res.status(200).json({ 
      success: true, 
      message: 'Password reset successful. You can now login with your new password.' 
    });
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
};