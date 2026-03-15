// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// POST register
router.post("/register", registerUser);

// POST login
router.post("/login", loginUser);

module.exports = router;