import { Redis as IORedis } from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";
import { config } from "../../config/index.js";
/**
 * SessionBlocklistCache
 * High-performance distributed session revocation blocklist.
 * Combines an in-memory TTL Map (<1ms lookup) with Upstash Redis / Redis EX persistence
 * to immediately invalidate sessions and rotated tokens across all API replicas.
 */
export class SessionBlocklistCache {
    static inMemoryBlockedSessions = new Map();
    static upstashClient = null;
    static ioredisClient = null;
    static cleanupTimer = null;
    static getUpstash() {
        const url = process.env.UPSTASH_REDIS_REST_URL || config.redis?.upstashRestUrl;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN || config.redis?.upstashRestToken;
        if (!url || !token)
            return null;
        if (!this.upstashClient) {
            try {
                this.upstashClient = new UpstashRedis({ url, token });
            }
            catch (err) {
                console.warn("⚠️ Failed to initialize SessionBlocklistCache Upstash client:", err.message);
                this.upstashClient = null;
            }
        }
        return this.upstashClient;
    }
    static getIORedis() {
        const redisUrl = process.env.REDIS_URL || config.redis?.url;
        if (!redisUrl)
            return null;
        if (!this.ioredisClient) {
            try {
                this.ioredisClient = new IORedis(redisUrl, {
                    lazyConnect: true,
                    enableOfflineQueue: false,
                    maxRetriesPerRequest: 3,
                    retryStrategy: (times) => {
                        if (times > 3)
                            return null;
                        return Math.min(times * 100, 2000);
                    },
                });
                this.ioredisClient.on("error", (err) => {
                    console.warn("⚠️ SessionBlocklistCache Redis warning:", err.message);
                });
            }
            catch (err) {
                console.warn("⚠️ Failed to initialize SessionBlocklistCache Redis client:", err.message);
                this.ioredisClient = null;
            }
        }
        return this.ioredisClient;
    }
    /**
     * Revokes a session immediately across the cluster.
     * TTL defaults to 900 seconds (15 minutes), matching access token lifetime.
     */
    static async revokeSession(sessionId, ttlSeconds = 900) {
        if (!sessionId)
            return;
        const key = sessionId.toString();
        const redisKey = `session:revoked:${key}`;
        // 1. Store in memory
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.inMemoryBlockedSessions.set(key, { expiresAt });
        // Schedule cleanup if not running
        if (!this.cleanupTimer) {
            this.cleanupTimer = setInterval(() => {
                const now = Date.now();
                for (const [sId, entry] of this.inMemoryBlockedSessions.entries()) {
                    if (entry.expiresAt <= now) {
                        this.inMemoryBlockedSessions.delete(sId);
                    }
                }
            }, 60000);
            if (this.cleanupTimer.unref) {
                this.cleanupTimer.unref();
            }
        }
        // 2. Store in Upstash Redis if available
        const upstash = this.getUpstash();
        if (upstash) {
            try {
                await upstash.set(redisKey, "revoked", { ex: ttlSeconds });
                return;
            }
            catch (err) {
                console.warn("⚠️ Could not write revoked session to Upstash Redis:", err.message);
            }
        }
        // 3. Store in ioredis if available
        const redis = this.getIORedis();
        if (redis) {
            try {
                if (redis.status === "wait") {
                    await redis.connect();
                }
                await redis.set(redisKey, "revoked", "EX", ttlSeconds);
            }
            catch (err) {
                console.warn("⚠️ Could not write revoked session to Redis:", err.message);
            }
        }
    }
    /**
     * Checks whether a session ID has been revoked or invalidated.
     */
    static async isSessionRevoked(sessionId) {
        if (!sessionId)
            return false;
        const key = sessionId.toString();
        const redisKey = `session:revoked:${key}`;
        // 1. Check local in-memory store (<1ms)
        const localEntry = this.inMemoryBlockedSessions.get(key);
        if (localEntry) {
            if (localEntry.expiresAt > Date.now()) {
                return true;
            }
            else {
                this.inMemoryBlockedSessions.delete(key);
            }
        }
        // 2. Check distributed Upstash Redis store
        const upstash = this.getUpstash();
        if (upstash) {
            try {
                const exists = await upstash.exists(redisKey);
                if (exists === 1) {
                    // Cache locally for faster subsequent lookups
                    this.inMemoryBlockedSessions.set(key, { expiresAt: Date.now() + 60000 });
                    return true;
                }
            }
            catch (err) {
                // Fall back to memory result on transient Upstash failure
            }
        }
        // 3. Check distributed ioredis store
        const redis = this.getIORedis();
        if (redis) {
            try {
                if (redis.status === "wait") {
                    await redis.connect();
                }
                const exists = await redis.exists(redisKey);
                if (exists === 1) {
                    // Cache locally for faster subsequent lookups
                    this.inMemoryBlockedSessions.set(key, { expiresAt: Date.now() + 60000 });
                    return true;
                }
            }
            catch (err) {
                // Fall back to memory result on transient Redis failure
            }
        }
        return false;
    }
    /**
     * Clears in-memory blocklist (primarily for tests)
     */
    static clear() {
        this.inMemoryBlockedSessions.clear();
    }
}
export default SessionBlocklistCache;
