// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// Import controllers - make sure ALL these functions exist in authController.js
const { 
    register, 
    verifyEmail, 
    resendVerification, 
    login, 
    checkEmail 
} = require('../controllers/authController');

// Log to check if imports work
console.log('✅ Auth routes loaded:');
console.log('  - register:', typeof register);
console.log('  - verifyEmail:', typeof verifyEmail);
console.log('  - resendVerification:', typeof resendVerification);
console.log('  - login:', typeof login);
console.log('  - checkEmail:', typeof checkEmail);

// ==================== REAL ROUTES ====================
router.post('/check-email', checkEmail);
router.post('/register', register);
router.get('/verify-email', verifyEmail);  // GET for email links
router.post('/resend-verification', resendVerification);
router.post('/login', login);

// ==================== TEST ROUTE ====================
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
        
        const emailService = require('../services/emailService');
        const result = await emailService.sendVerificationEmail(
            email,
            'Test User',
            testToken
        );
        
        res.json(result);
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;