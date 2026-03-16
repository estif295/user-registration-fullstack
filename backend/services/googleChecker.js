// backend/services/googleChecker.js
const axios = require('axios');
require('dotenv').config();

/**
 * Check if email has a REAL Google account
 * Uses RapidAPI Google-Checker service
 */
async function checkGoogleAccount(email) {
    try {
        const apiKey = process.env.RAPIDAPI_KEY;
        
        console.log('🔍 Using API Key:', apiKey ? '✅ Present' : '❌ Missing');
        console.log(`🔍 Checking Google account for: ${email}`);

        const options = {
            method: 'POST',
            url: 'https://google-checker2.p.rapidapi.com/check',
            headers: {
                'X-RapidAPI-Host': 'google-checker2.p.rapidapi.com',
                'X-RapidAPI-Key': apiKey,
                'Content-Type': 'application/json'
            },
            data: { 
                input: email 
            },
            timeout: 10000
        };

        const response = await axios.request(options);
        
        console.log('✅ Google API Response:', response.data);
        
        // IMPORTANT: 
        // live: true  = Email has REAL Google account → ALLOW
        // live: false = Email has NO Google account → BLOCK
        const hasGoogleAccount = response.data.live === true;
        
        return {
            success: true,
            hasGoogleAccount: hasGoogleAccount,
            live: response.data.live,
            note: response.data.note || '',
            message: hasGoogleAccount ? 
                '✅ Has Google account' : 
                '❌ No Google account'
        };

    } catch (error) {
        console.error('❌ Google Checker error:', error.message);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        
        return {
            success: false,
            hasGoogleAccount: null,
            error: error.message
        };
    }
}

module.exports = { checkGoogleAccount };