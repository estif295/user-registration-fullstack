// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    normalizedEmail: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // Email validation results
    emailValidation: {
        validatedAt: Date,
        isDisposable: Boolean,
        isRoleBased: Boolean,
        hasGoogleAccount: Boolean,
        googleCheckAt: Date,
        qualityScore: Number,
        mxFound: Boolean
    },
    // For email verification
    verificationCode: String,
    verificationCodeExpires: Date,
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: Date
});

// Pre-save middleware to normalize Gmail addresses
userSchema.pre('save', function(next) {
    if (this.isModified('email')) {
        const [localPart, domain] = this.email.split('@');
        if (domain && domain.toLowerCase() === 'gmail.com') {
            const normalizedLocal = localPart
                .replace(/\./g, '')
                .split('+')[0];
            this.normalizedEmail = `${normalizedLocal}@gmail.com`;
        } else {
            this.normalizedEmail = this.email;
        }
    }
    next();
});

module.exports = mongoose.model('User', userSchema);