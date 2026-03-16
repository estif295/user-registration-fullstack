// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    register,
    verifyEmail,
    resendVerification,
    login,
    checkEmail
} = require('../controllers/authController');

// ==================== TEST ROUTE ====================
// Use this to test if email sending works
router.post('/test-email', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email is required' 
        });
    }
    
    try {
        const crypto = require('crypto');
        const testToken = crypto.randomBytes(32).toString('hex');
        
        console.log(`📧 Test email requested for: ${email}`);
        console.log(`🔑 Test token: ${testToken}`);
        
        const result = await require('../services/emailService').sendVerificationEmail(
            email,
            'Test User',
            testToken
        );
        
        console.log('📬 Email send result:', result);
        res.json(result);
        
    } catch (error) {
        console.error('❌ Test email error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
// ==================== END TEST ROUTE ====================

// Your regular routes
router.post('/check-email', checkEmail);
router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);

module.exports = router;