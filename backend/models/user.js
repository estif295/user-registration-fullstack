// models/user.js (update your existing file)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // New fields for email validation
    emailValidation: {
        validatedAt: Date,
        isDisposable: Boolean,
        isRoleBased: Boolean,
        hasGoogleAccount: Boolean,
        googleCheckAt: Date,
        qualityScore: Number
    },
    verificationCode: String,
    verificationCodeExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to normalize email
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