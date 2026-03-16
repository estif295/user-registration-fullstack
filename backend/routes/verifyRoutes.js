// routes/verifyRoutes.js (update your existing file)
const express = require('express');
const router = express.Router();
const { 
    validateEmailForRegistration, 
    quickEmailCheck 
} = require('../controllers/emailValidationController');
const { validateRateLimit } = require('../middleware/validation');

// Public email validation endpoint (with rate limiting)
router.post('/validate-email', validateRateLimit, validateEmailForRegistration);

// Quick check for frontend (format + availability only)
router.get('/check-email', quickEmailCheck);

// Your other verify routes...

module.exports = router;