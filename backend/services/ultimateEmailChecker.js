// backend/services/ultimateEmailChecker.js
const axios = require('axios');

/**
 * ULTIMATE FREE Email Checker
 * Uses Rapid Email Validator - No API key needed, no limits, forever free
 */
async function checkEmail(email) {
    try {
        console.log(`🔍 Checking email: ${email}`);
        
        // Free API - no authentication, no limits, no data storage
        const response = await axios.get(
            `https://rapid-email-verifier.fly.dev/api/validate?email=${encodeURIComponent(email)}`,
            { timeout: 10000 }
        );
        
        const data = response.data;
        console.log('✅ API Response:', data);
        
        // Extract validation results
        const isValid = data.status === 'VALID';
        const isGmail = email.toLowerCase().includes('@gmail.com');
        const isDisposable = data.validations?.is_disposable || false;
        const isRoleBased = data.validations?.is_role_based || false;
        const canonicalEmail = data.aliasOf || email; // Handles gmail aliases
        
        // Determine if it's a REAL Gmail account
        const isRealGmail = isValid && isGmail && !isDisposable;
        
        // For non-Gmail, just check if valid
        const canRegister = isValid && !isDisposable;
        
        return {
            success: true,
            email: email,
            canonicalEmail: canonicalEmail,
            isValid: isValid,
            isGmail: isGmail,
            isRealGmail: isRealGmail,
            isDisposable: isDisposable,
            isRoleBased: isRoleBased,
            canRegister: isRealGmail, // YOUR RULE: Only real Gmail accounts can register
            message: getMessage(isRealGmail, isGmail, isValid, isDisposable),
            details: data
        };
        
    } catch (error) {
        console.error('❌ Email checker error:', error.message);
        return {
            success: false,
            email: email,
            canRegister: false,
            message: 'Unable to verify email. Please try again.',
            error: error.message
        };
    }
}

/**
 * Helper function to generate user-friendly messages
 */
function getMessage(isRealGmail, isGmail, isValid, isDisposable) {
    if (!isValid) return '❌ Email address is not valid';
    if (isDisposable) return '❌ Disposable emails are not allowed';
    if (isGmail && !isRealGmail) return '❌ Not a valid Gmail account';
    if (isGmail && isRealGmail) return '✅ Valid Gmail account - you can register';
    return '✅ Email is valid';
}

module.exports = { checkEmail };