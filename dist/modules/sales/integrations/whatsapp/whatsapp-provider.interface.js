/**
 * Utility: Normalize raw phone number strictly to E.164 standard (+[country][number])
 */
export function normalizeToE164(phone) {
    if (!phone || typeof phone !== 'string') {
        throw new Error('Phone number is required for E.164 normalization');
    }
    // Remove whitespace, dashes, dots, brackets, and invisible chars
    let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');
    // Handle leading 00 as international prefix
    if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.slice(2);
    }
    // If no leading +, ensure we prepend +
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    // Strict E.164 regex: + followed by 7 to 15 digits
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (!e164Regex.test(cleaned)) {
        throw new Error(`Invalid phone number format for E.164: "${phone}" (parsed as "${cleaned}")`);
    }
    return cleaned;
}
