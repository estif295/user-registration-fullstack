// routes/verifyRoutes.js
const express = require('express');
const router = express.Router();

// Make sure these controller functions exist and are properly imported
const { 
    validateEmailForRegistration, 
    quickEmailCheck 
} = require('../controllers/emailValidationController');

// Check if the imports are working
console.log('validateEmailForRegistration:', validateEmailForRegistration);
console.log('quickEmailCheck:', quickEmailCheck);

// Public email validation endpoint
if (validateEmailForRegistration) {
    router.post('/validate-email', validateEmailForRegistration);
} else {
    console.error('❌ validateEmailForRegistration is undefined!');
}

// Quick check endpoint
if (quickEmailCheck) {
    router.get('/check-email', quickEmailCheck);
} else {
    console.error('❌ quickEmailCheck is undefined!');
}

module.exports = router;