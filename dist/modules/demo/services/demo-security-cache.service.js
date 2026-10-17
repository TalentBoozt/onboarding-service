/**
 * Demo In-Memory Security & Blacklist Cache
 * Tracks blacklisted IPs, suspicious bots, and honeypot triggers.
 */
class DemoSecurityCacheService {
    blacklist = new Map();
    defaultTtlMs = 60 * 60 * 1000; // 1 hour blacklist
    blacklistIp(ip, reason, ttlMs = this.defaultTtlMs) {
        if (!ip)
            return;
        const now = new Date();
        this.blacklist.set(ip, {
            ip,
            reason,
            blacklistedAt: now,
            expiresAt: new Date(now.getTime() + ttlMs),
        });
    }
    isIpBlacklisted(ip) {
        if (!ip)
            return false;
        const entry = this.blacklist.get(ip);
        if (!entry)
            return false;
        if (entry.expiresAt.getTime() < Date.now()) {
            this.blacklist.delete(ip);
            return false;
        }
        return true;
    }
    getBlacklistEntry(ip) {
        if (!ip)
            return undefined;
        if (this.isIpBlacklisted(ip)) {
            return this.blacklist.get(ip);
        }
        return undefined;
    }
    clear() {
        this.blacklist.clear();
    }
}
export const demoSecurityCache = new DemoSecurityCacheService();
export default demoSecurityCache;
