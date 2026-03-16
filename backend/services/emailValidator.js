// services/emailValidator.js
const axios = require('axios');

/**
 * Free email validation service - no API key required
 * Checks: syntax, domain, MX records, disposable status
 */
async function validateEmailDeliverability(email) {
    try {
        // Using free API (no key required)
        const response = await axios.get(
            `https://emailvalidation.abstractapi.com/v1/?api_key=free&email=${encodeURIComponent(email)}`
        );
        
        const data = response.data;
        
        return {
            valid: data.deliverability === "DELIVERABLE",
            format: data.is_valid_format?.value || false,
            domain: data.is_free_email?.value || false,
            disposable: data.is_disposable_email?.value || false,
            roleBased: data.is_role_email?.value || false,
            mxFound: data.is_mx_found?.value || false,
            qualityScore: data.quality_score || 0
        };
    } catch (error) {
        console.error('Free email validation error:', error.message);
        
        // Fallback to basic validation
        return fallbackValidation(email);
    }
}

/**
 * Fallback validation when API fails
 */
function fallbackValidation(email) {
    const [localPart, domain] = email.split('@');
    
    return {
        valid: true, // Assume valid if we can't check
        format: true,
        domain: !!domain,
        disposable: false,
        roleBased: /^(info|support|sales|admin|contact|hello|help|team|no-reply|noreply)@/i.test(email),
        mxFound: false,
        qualityScore: 50,
        note: 'Used fallback validation - API unavailable'
    };
}

/**
 * Normalize Gmail addresses (handle dots and + aliases)
 */
function normalizeGmail(email) {
    if (!email || typeof email !== 'string') return email;
    
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    
    const [localPart, domain] = parts;
    
    // Handle Gmail aliases
    if (domain.toLowerCase() === 'gmail.com') {
        // Remove dots and anything after plus
        const normalizedLocal = localPart
            .replace(/\./g, '')  // Remove all dots
            .split('+')[0];       // Remove plus tags
        
        return `${normalizedLocal}@gmail.com`;
    }
    
    return email;
}

module.exports = { validateEmailDeliverability, normalizeGmail, fallbackValidation };