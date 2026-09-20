import { localeNegotiator } from "../infrastructure/localization/index.js";
/**
 * extractLocale middleware
 *
 * Attaches a resolved `request.locale` to every request on localizable routes.
 *
 * Priority order:
 *   1. ?lang= query parameter        (explicit override)
 *   2. Accept-Language request header (RFC 5646 / RFC 2616 §14.4 — q-value aware)
 *   3. Authenticated user's saved preference (from JWT payload)
 *   4. Default: "en"
 *
 * Unsupported locales silently fall back to "en" — never throws.
 * Register as a `preHandler` on routes that return localizable content.
 */
export async function extractLocale(request, _reply) {
    const query = request.query;
    const user = request.user;
    // Priority 1: explicit ?lang= query param
    if (query.lang) {
        request.locale = localeNegotiator.normalize(query.lang);
        return;
    }
    // Priority 2: Accept-Language header (RFC-compliant q-value negotiation)
    const acceptLanguage = request.headers["accept-language"];
    if (acceptLanguage) {
        const negotiated = localeNegotiator.negotiate(acceptLanguage);
        request.locale = negotiated;
        return;
    }
    // Priority 3: authenticated user's saved preference
    const userLang = user?.preferences?.language;
    if (userLang) {
        request.locale = localeNegotiator.normalize(userLang);
        return;
    }
    // Priority 4: default
    request.locale = "en";
}
