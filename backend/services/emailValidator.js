// services/emailValidator.js
const axios = require('axios');

/**
 * Comprehensive email validation
 * Checks: format, domain, MX records, disposable, role-based, typos
 */
async function validateEmail(email) {
    try {
        // Primary validation using AbstractAPI (free tier available)
        const response = await axios.get(
            `https://emailvalidation.abstractapi.com/v1/`,
            {
                params: {
                    api_key: process.env.ABSTRACT_API_KEY || 'free',
                    email: email
                }
            }
        );
        
        const data = response.data;
        
        // Check for common typos in popular domains
        const domain = email.split('@')[1];
        const typoSuggestions = getTypoSuggestions(domain);
        
        return {
            valid: data.deliverability === "DELIVERABLE",
            quality_score: data.quality_score || 0,
            
            // Format checks
            format_valid: data.is_valid_format?.value || false,
            format_text: data.is_valid_format?.text || '',
            
            // Domain checks
            domain: data.domain || '',
            free_provider: data.is_free_email?.value || false,
            company_provider: data.is_company_email?.value || false,
            
            // Deliverability checks
            mx_found: data.is_mx_found?.value || false,
            smtp_check: data.is_smtp_valid?.value || false,
            
            // Risk checks
            disposable: data.is_disposable_email?.value || false,
            role_based: data.is_role_email?.value || false,
            catch_all: data.is_catchall_email?.value || false,
            
            // Typo detection
            typo_suggestions: typoSuggestions,
            did_you_mean: data.autocorrect || '',
            
            // Additional
            first_name: data.first_name || '',
            last_name: data.last_name || ''
        };
        
    } catch (error) {
        console.error('Email validation error:', error.message);
        
        // Fallback to basic validation
        return fallbackEmailValidation(email);
    }
}

/**
 * Detect common domain typos
 */
function getTypoSuggestions(domain) {
    const commonDomains = {
        'gmail.com': ['gmial.com', 'gmal.com', 'gamil.com', 'gmai.com'],
        'yahoo.com': ['yaho.com', 'yhoo.com', 'yahooo.com'],
        'hotmail.com': ['hotmil.com', 'hotmai.com', 'hotmal.com'],
        'outlook.com': ['outlok.com', 'outllok.com', 'outloook.com']
    };
    
    for (const [correct, typos] of Object.entries(commonDomains)) {
        if (typos.includes(domain)) {
            return `Did you mean ${correct}?`;
        }
    }
    return null;
}

/**
 * Fallback validation when API fails
 */
function fallbackEmailValidation(email) {
    const [localPart, domain] = email.split('@');
    
    return {
        valid: true,
        quality_score: 50,
        format_valid: true,
        domain: domain,
        free_provider: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain),
        mx_found: false,
        smtp_check: false,
        disposable: false,
        role_based: /^(info|support|sales|admin|contact|hello|help|team|no-reply|noreply)@/i.test(email),
        catch_all: false,
        typo_suggestions: null,
        note: 'Used fallback validation - API unavailable'
    };
}

/**
 * Normalize Gmail addresses (handle dots and + aliases)
 */
function normalizeGmail(email) {
    if (!email) return email;
    
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    
    const [localPart, domain] = parts;
    
    if (domain.toLowerCase() === 'gmail.com') {
        const normalizedLocal = localPart
            .replace(/\./g, '')
            .split('+')[0];
        return `${normalizedLocal}@gmail.com`;
    }
    
    return email;
}

module.exports = { validateEmail, normalizeGmail };