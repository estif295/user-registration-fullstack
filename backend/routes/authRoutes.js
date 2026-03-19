const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Import controllers
const { 
  registerUser, 
  loginUser, 
  verifyEmail,
  resendVerification 
} = require('../controllers/authController');

const { forgotPassword, resetPassword } = require('../controllers/passwordController');

// Regular auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// ========== ONLY GOOGLE AUTH ==========
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/login?error=google_auth_failed',
    session: false 
  }),
  (req, res) => {
    try {
      console.log('✅ Google callback successful');
      console.log('👤 User:', req.user.email);
      
      const token = jwt.sign(
        { id: req.user._id || req.user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
      
      const userData = {
        id: req.user._id || req.user.id,
        name: req.user.name || req.user.displayName,
        email: req.user.email || req.user.emails?.[0]?.value,
        isVerified: true,
        provider: 'google'
      };
      
      res.redirect(`http://localhost:3000/social-login?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
      
    } catch (error) {
      console.error('❌ Google callback error:', error);
      res.redirect('http://localhost:3000/login?error=token_creation_failed');
    }
  }
);

// ❌ REMOVED: Facebook and GitHub routes

// Debug route
router.get('/debug-jwt', (req, res) => {
  try {
    const jwtConfig = {
      secret: process.env.JWT_SECRET ? '✅ Present' : '❌ Missing',
      expiresIn: process.env.JWT_EXPIRE || '7d'
    };
    
    res.json({
      config: jwtConfig,
      message: 'JWT configuration looks good'
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

module.exports = router;