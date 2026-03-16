// routes/verifyRoutes.js
const express = require('express');
const router = express.Router();
const { verifyEmail } = require('../controllers/authController');

// Email verification endpoint
router.get('/verify-email', verifyEmail);

module.exports = router;