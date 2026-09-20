import crypto from "crypto";
export class KioskSecurityService {
    // In-memory store for device pairing codes
    pairingCodes = new Map();
    /**
     * Generates an HMAC-SHA256 signature for a secure public kiosk playback URL.
     */
    generateSignature(journeyId, orgId, exp, secret) {
        const payload = `${journeyId}:${orgId}:${exp}`;
        return crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");
    }
    /**
     * Verifies the signature of a signed URL query payload and asserts expiration bounds.
     */
    verifySignature(journeyId, orgId, exp, sig, secret) {
        // 1. Check expiration (exp is Unix timestamp in seconds)
        const currentUnixTimestamp = Math.floor(Date.now() / 1000);
        if (currentUnixTimestamp > exp) {
            return false;
        }
        // 2. Generate expected signature and compare safely
        try {
            const expectedSig = this.generateSignature(journeyId, orgId, exp, secret);
            const sigBuf = Buffer.from(sig, "hex");
            const expBuf = Buffer.from(expectedSig, "hex");
            if (sigBuf.length !== expBuf.length || sigBuf.length === 0) {
                return false;
            }
            return crypto.timingSafeEqual(sigBuf, expBuf);
        }
        catch {
            return false;
        }
    }
    /**
     * Generates a secure, 6-digit numeric pairing code for a physical device registration stream.
     * Codes expire after ttlMs (default 15 minutes / 900000 ms).
     */
    generatePairingCode(orgId, deviceId, ttlMs = 900000) {
        // Generate a 6-digit random code string
        let code;
        do {
            code = Math.floor(100000 + Math.random() * 900000).toString();
        } while (this.pairingCodes.has(code)); // Ensure uniqueness
        this.pairingCodes.set(code, {
            orgId,
            deviceId,
            expiresAt: Date.now() + ttlMs
        });
        return code;
    }
    /**
     * Validates a device registration code, removing it from the store upon lookup (single-use guarantee).
     */
    verifyPairingCode(code) {
        const data = this.pairingCodes.get(code);
        if (!data) {
            return null;
        }
        // Always delete after single-use validation lookup to prevent replay attacks
        this.pairingCodes.delete(code);
        if (Date.now() > data.expiresAt) {
            return null;
        }
        return data;
    }
    /**
     * Utility for testing: clears pairing codes
     */
    clearPairingCodes() {
        this.pairingCodes.clear();
    }
}
export default KioskSecurityService;
