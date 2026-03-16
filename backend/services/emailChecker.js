// backend/services/emailChecker.js
const axios = require('axios');

class EmailChecker {
    async checkEmail(email) {
        try {
            console.log(`🔍 Checking if ${email} is REAL...`);
            
            // Use Trumailo - free, no API key needed
            const response = await axios.get(
                `https://api.trumailo.com/v2/validate?email=${encodeURIComponent(email)}`,
                { timeout: 5000 }
            );
            
            const data = response.data;
            const exists = data.deliverable === true;
            const isGmail = email.toLowerCase().includes('@gmail.com');
            
            return {
                success: true,
                exists: exists,
                isRealGmail: exists && isGmail,
                message: exists ? 
                    (isGmail ? '✅ REAL Gmail' : '✅ Valid email') : 
                    '❌ Email does not exist'
            };
            
        } catch (error) {
            console.log('⚠️ Using fallback validation');
            // Fallback: basic validation
            return {
                success: true,
                exists: email.includes('@') && email.includes('.'),
                isRealGmail: email.toLowerCase().includes('@gmail.com'),
                message: '⚠️ Using basic validation'
            };
        }
    }
}

module.exports = new EmailChecker();