// services/googleChecker.js
const axios = require('axios');
require('dotenv').config();

/**
 * Check if an email has a Google/Gmail account
 * Uses RapidAPI Google-Checker service
 */
async function checkGoogleAccount(email) {
    try {
        // Make sure you have the API key
        const apiKey = process.env.RAPIDAPI_KEY;
        
        if (!apiKey) {
            console.error('❌ RAPIDAPI_KEY is missing in .env file');
            return {
                success: false,
                hasGoogleAccount: null,
                error: 'API key not configured',
                note: 'Please add RAPIDAPI_KEY to your .env file'
            };
        }

        console.log(`🔍 Checking Google account for: ${email}`);
        console.log('Using API Key:', apiKey.substring(0, 5) + '...'); // Log first 5 chars for debugging
        
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
            timeout: 10000 // 10 second timeout
        };

        const response = await axios.request(options);
        
        console.log('✅ Google Checker API response:', response.data);
        
        // The API returns { "live": true/false, "note": "" }
        // "live": true means the email has a Google account
        const hasGoogleAccount = response.data.live === true;
        
        return {
            success: true,
            hasGoogleAccount: hasGoogleAccount,
            note: response.data.note || '',
            raw: response.data
        };

    } catch (error) {
        console.error('❌ Google Checker API error:');
        
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            
            return {
                success: false,
                hasGoogleAccount: null,
                error: `API returned status ${error.response.status}`,
                details: error.response.data,
                note: 'Google check service error'
            };
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
            return {
                success: false,
                hasGoogleAccount: null,
                error: 'No response from API',
                note: 'Google check service timeout'
            };
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error setting up request:', error.message);
            return {
                success: false,
                hasGoogleAccount: null,
                error: error.message,
                note: 'Failed to check Google account'
            };
        }
    }
}

module.exports = { checkGoogleAccount };