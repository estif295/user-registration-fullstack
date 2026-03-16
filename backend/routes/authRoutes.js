// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register } = require('../controllers/authController');

// Make sure register function exists
console.log('Register function:', register);

if (!register) {
    console.error('❌ Register function is not imported properly!');
}

// Registration route
router.post('/register', register);

module.exports = router;