// services/realEmailChecker.js
const axios = require('axios');

class RealEmailChecker {
    constructor(bloomboxUrl = 'http://localhost:8080') {
        this.url = bloomboxUrl;
        this.cache = new Map(); // Cache results for 24 hours
    }

    async checkEmail(email) {
        // Check cache first
        const cached = this.cache.get(email);
        if (cached && (Date.now() - cached.timestamp < 86400000)) {
            console.log(`📦 Cache hit for ${email}`);
            return cached.result;
        }

        try {
            console.log(`🔍 Checking if ${email} is REAL...`);
            
            // Call Bloombox for SMTP verification
            const response = await axios.post(`${this.url}/validate`, {
                email: email,
                validators: ['syntax', 'mx', 'smtp', 'disposable']
            });

            const data = response.data;
            
            // SMTP valid = true means email EXISTS on the mail server!
            const exists = data.results?.smtp?.valid === true;
            const isGmail = email.toLowerCase().includes('@gmail.com');
            const isDisposable = data.results?.disposable?.valid === true;
            
            const result = {
                success: true,
                email: email,
                exists: exists,
                isRealGmail: exists && isGmail && !isDisposable,
                isGmail: isGmail,
                isDisposable: isDisposable,
                message: this.getMessage(exists, isGmail, isDisposable),
                details: data
            };

            // Cache the result
            this.cache.set(email, { result, timestamp: Date.now() });
            
            console.log(`✅ Result for ${email}:`, result.message);
            return result;

        } catch (error) {
            console.error('❌ Email checker error:', error.message);
            return {
                success: false,
                exists: false,
                isRealGmail: false,
                message: 'Unable to verify email. Please try again.'
            };
        }
    }

    getMessage(exists, isGmail, isDisposable) {
        if (!exists) return '❌ Email does not exist';
        if (isDisposable) return '❌ Disposable email not allowed';
        if (isGmail) return '✅ REAL Gmail account';
        return '✅ Valid email (not Gmail)';
    }

    async batchCheck(emails) {
        try {
            const response = await axios.post(`${this.url}/batch`, {
                emails: emails.slice(0, 100), // Max 100 per batch
                validators: ['syntax', 'mx', 'smtp', 'disposable']
            });
            return response.data;
        } catch (error) {
            console.error('Batch check error:', error);
            return { error: error.message };
        }
    }
}

module.exports = RealEmailChecker;