// services/googleChecker.js
const axios = require('axios');

/**
 * Check if an email has a Google account
 * Uses RapidAPI Google-Checker service
 */
async function checkGoogleAccount(email) {
    try {
        // You'll need to sign up at RapidAPI for this
        const options = {
            method: 'POST',
            url: 'https://google-checker2.p.rapidapi.com/check',
            headers: {
                'X-RapidAPI-Host': 'google-checker2.p.rapidapi.com',
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'Content-Type': 'application/json'
            },
            data: { input: email }
        };

        const response = await axios.request(options);
        
        return {
            exists: response.data.live === true,
            message: response.data.message || '',
            confidence: response.data.confidence || 'medium'
        };
    } catch (error) {
        console.error('Google account check error:', error.message);
        
        // If API fails, we'll note it but not block registration
        return {
            exists: null,
            error: 'Unable to verify Google account status',
            message: 'Google check unavailable'
        };
    }
}

/**
 * Alternative method - check via account recovery (legitimate use only)
 * This is for educational purposes - use with caution
 */
async function checkViaRecovery(email) {
    // Note: This is NOT recommended for production
    // Google actively blocks automated requests
    return {
        exists: null,
        error: 'Method not recommended',
        message: 'Use official APIs only'
    };
}

module.exports = { checkGoogleAccount };