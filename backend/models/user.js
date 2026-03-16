// backend/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    originalEmail: {
        type: String,  // Store original email before canonicalization
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    verifiedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;