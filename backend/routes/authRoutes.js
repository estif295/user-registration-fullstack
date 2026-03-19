const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Import password reset functions
const passwordController = require('../controllers/passwordController');

// Auth routes
router.post('/register', register);
router.post('/login', login);

// Password reset routes
router.post('/forgot-password', passwordController.forgotPassword);
router.put('/reset-password/:resetToken', passwordController.resetPassword);

module.exports = router;