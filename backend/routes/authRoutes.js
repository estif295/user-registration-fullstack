// routes/authRoutes.js (update your existing file)
const express = require('express');
const router = express.Router();
const { register } = require('../controllers/authController');
const { validateEmailFormat, handleValidationErrors } = require('../middleware/validation');

// Registration route with validation
router.post(
    '/register',
    validateEmailFormat,
    handleValidationErrors,
    register
);

// Your other auth routes...

module.exports = router;