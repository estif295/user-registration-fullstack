// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, checkEmailBeforeRegister } = require('../controllers/authController');

// Check email before registration
router.post('/check-email', checkEmailBeforeRegister);

// Register new user
router.post('/register', register);

module.exports = router;