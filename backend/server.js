// backend/server.js - UPDATED VERSION
// Load dotenv FIRST, before anything else!
require('dotenv').config();

// NOW check if env variables are loaded
console.log('🔍 Checking environment variables:');
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? '✅ Found' : '❌ Missing');
console.log('📧 EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Found' : '❌ Missing');
console.log('📧 EMAIL_USER value:', process.env.EMAIL_USER);
console.log('🔑 EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Initialize email service AFTER confirming env vars
console.log('📧 Initializing email service...');
const emailService = require('./services/emailService');

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'Server is running',
        emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});