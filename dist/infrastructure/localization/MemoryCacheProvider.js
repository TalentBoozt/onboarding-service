/**
 * MemoryCacheProvider
 *
 * In-process Map-based cache with TTL expiry.
 * Default implementation of ICacheProvider.
 *
 * To migrate to Redis:
 *   1. Create RedisCacheProvider implements ICacheProvider
 *   2. Inject it instead of MemoryCacheProvider in LocalizationService
 *   3. No other code changes needed
 */
export class MemoryCacheProvider {
    store = new Map();
    async get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }
    async set(key, value, ttlMs) {
        this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    }
    async delete(key) {
        this.store.delete(key);
    }
    async deleteByPrefix(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }
    async clear() {
        this.store.clear();
    }
    /** Utility: total number of entries (including expired). Useful for health checks. */
    size() {
        return this.store.size;
    }
}
