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
    password: {
        type: String,
        required: true
    },
    hasGoogleAccount: {
        type: Boolean,
        default: false
    },
    googleVerifiedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Remove any middleware that might be causing the error
// If you have any pre-save hooks, make sure they have the correct signature

// Example of CORRECT pre-save hook (if you need one):
// userSchema.pre('save', function(next) {
//     // 'this' refers to the document
//     console.log('Saving user:', this.email);
//     next(); // Must call next()
// });

const User = mongoose.model('User', userSchema);

module.exports = User;