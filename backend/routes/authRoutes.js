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

// ========== GOOGLE AUTH ==========
// This route redirects to Google's account chooser
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account' // 👈 This forces Google to show account chooser EVERY time
}));

// This route handles the callback from Google after user selects account
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/login?error=google_auth_failed',
    session: false 
  }),
  (req, res) => {
    try {
      console.log('✅ Google callback successful');
      console.log('👤 User:', req.user.email);
      
      // Make sure JWT_EXPIRE is valid
      const expiresIn = process.env.JWT_EXPIRE || '7d';
      console.log('⏰ JWT Expires In:', expiresIn);
      
      // Generate JWT token
      const token = jwt.sign(
        { id: req.user._id || req.user.id },
        process.env.JWT_SECRET,
        { expiresIn: expiresIn }
      );
      
      console.log('🔑 Token generated successfully');
      
      // Prepare user data for frontend
      const userData = {
        id: req.user._id || req.user.id,
        name: req.user.name || req.user.displayName,
        email: req.user.email || req.user.emails?.[0]?.value,
        isVerified: true,
        provider: 'google'
      };
      
      // Redirect to frontend with token and user data
      const redirectUrl = `http://localhost:3000/social-login?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
      console.log('➡️ Redirecting to:', redirectUrl);
      
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('❌ Google callback error:', error);
      res.redirect('http://localhost:3000/login?error=token_creation_failed');
    }
  }
);

// ========== FACEBOOK AUTH ==========
router.get('/facebook', passport.authenticate('facebook', { 
  scope: ['email'],
  authType: 'reauthenticate', // Similar to prompt for Facebook
  authNonce: Math.random().toString(36).substring(7) // Prevent caching
}));

router.get('/facebook/callback', 
  passport.authenticate('facebook', { 
    failureRedirect: 'http://localhost:3000/login?error=facebook_auth_failed',
    session: false 
  }),
  (req, res) => {
    try {
      console.log('✅ Facebook callback successful');
      console.log('👤 User:', req.user.email || req.user.id);
      
      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
      
      const userData = {
        id: req.user._id,
        name: req.user.name || req.user.displayName,
        email: req.user.email || `${req.user.id}@facebook.com`,
        isVerified: true,
        provider: 'facebook'
      };
      
      res.redirect(`http://localhost:3000/social-login?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
      console.error('❌ Facebook callback error:', error);
      res.redirect('http://localhost:3000/login?error=auth_failed');
    }
  }
);

// ========== GITHUB AUTH ==========
router.get('/github', passport.authenticate('github', { 
  scope: ['user:email'],
  prompt: 'select_account' // GitHub also supports this
}));

router.get('/github/callback', 
  passport.authenticate('github', { 
    failureRedirect: 'http://localhost:3000/login?error=github_auth_failed',
    session: false 
  }),
  (req, res) => {
    try {
      console.log('✅ GitHub callback successful');
      console.log('👤 User:', req.user.username);
      
      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
      
      const userData = {
        id: req.user._id,
        name: req.user.name || req.user.displayName || req.user.username,
        email: req.user.email || `${req.user.username}@github.com`,
        isVerified: true,
        provider: 'github'
      };
      
      res.redirect(`http://localhost:3000/social-login?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (error) {
      console.error('❌ GitHub callback error:', error);
      res.redirect('http://localhost:3000/login?error=auth_failed');
    }
  }
);

// Debug routes
router.get('/debug-jwt', (req, res) => {
  try {
    const jwtConfig = {
      secret: process.env.JWT_SECRET ? '✅ Present (length: ' + process.env.JWT_SECRET.length + ')' : '❌ Missing',
      expiresIn: process.env.JWT_EXPIRE || '7d (default)',
      expiresInType: typeof process.env.JWT_EXPIRE
    };
    
    // Try to create a test token
    const testToken = jwt.sign(
      { test: 'data' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.json({
      config: jwtConfig,
      testTokenCreated: !!testToken,
      message: 'JWT configuration looks good'
    });
  } catch (error) {
    res.json({
      error: error.message,
      config: {
        secret: process.env.JWT_SECRET ? 'Present' : 'Missing',
        expiresIn: process.env.JWT_EXPIRE
      }
    });
  }
});

// Debug OAuth configuration
router.get('/debug-oauth', (req, res) => {
  res.json({
    google: {
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      redirectUri: 'http://localhost:5000/api/auth/google/callback'
    },
    facebook: {
      configured: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      redirectUri: 'http://localhost:5000/api/auth/facebook/callback'
    },
    github: {
      configured: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      redirectUri: 'http://localhost:5000/api/auth/github/callback'
    }
  });
});

module.exports = router;