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
        unique: true,  // This creates the index - don't add another!
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        sparse: true,  // Only index when present
        unique: true    // This creates a sparse unique index
    },
    verificationTokenExpires: {
        type: Date
    },
    emailVerifiedAt: {
        type: Date
    },
    isRealGmail: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
}, {
    // Optional: Add this to automatically handle createdAt/updatedAt
    timestamps: true
});

// If you need additional indexes, add them HERE, but not for email
// Example: For fast queries by verificationToken (already indexed above)
// userSchema.index({ verificationToken: 1 }); // NOT NEEDED - already have unique:true

// Example: For sorting users by creation date (useful)
userSchema.index({ createdAt: -1 });

// Example: For finding unverified users
userSchema.index({ isVerified: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);
module.exports = User;