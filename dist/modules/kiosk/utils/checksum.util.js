import crypto from "crypto";
/**
 * Recursively serializes any JavaScript value into a deterministic canonical JSON string
 * with object keys sorted alphabetically.
 */
export function canonicalizeJson(obj) {
    if (obj === null || typeof obj !== "object") {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return "[" + obj.map((item) => canonicalizeJson(item)).join(",") + "]";
    }
    const record = obj;
    const sortedKeys = Object.keys(record).sort();
    const parts = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalizeJson(record[key])}`);
    return "{" + parts.join(",") + "}";
}
/**
 * Computes a deterministic SHA-256 hex checksum over canonicalized steps.
 */
export function computeCanonicalStepsChecksum(steps) {
    const normalized = JSON.parse(JSON.stringify(steps ?? []));
    const canonicalString = canonicalizeJson(normalized);
    return crypto.createHash("sha256").update(canonicalString).digest("hex");
}
