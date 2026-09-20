import Organization from "../../modules/organizations/models/organization.model.js";
/**
 * TenantStatusCache
 * Singleton in-memory cache of suspended tenant organization IDs.
 * Provides < 5ms validation during Fastify request authentication
 * to prevent unauthorized JWT token access for quarantined or suspended tenants.
 */
export class TenantStatusCache {
    static suspendedOrgIds = new Set();
    static initialized = false;
    /**
     * Hydrates the cache with all currently suspended organizations.
     * Can be called during server boot or database connection initialization.
     */
    static async init() {
        try {
            const suspendedOrgs = await Organization.find({ status: "Suspended", isDeleted: false }, { _id: 1 }).lean();
            this.suspendedOrgIds.clear();
            for (const org of suspendedOrgs) {
                this.suspendedOrgIds.add(org._id.toString());
            }
            this.initialized = true;
        }
        catch (err) {
            console.warn("⚠️ TenantStatusCache.init warning:", err?.message || err);
        }
    }
    /**
     * Checks whether an organization is currently suspended.
     * O(1) in-memory lookup.
     */
    static isSuspended(orgId) {
        if (!orgId)
            return false;
        return this.suspendedOrgIds.has(orgId.toString());
    }
    /**
     * Adds an organization ID to the suspended cache.
     */
    static addSuspended(orgId) {
        if (orgId) {
            this.suspendedOrgIds.add(orgId.toString());
        }
    }
    /**
     * Removes an organization ID from the suspended cache upon activation.
     */
    static removeSuspended(orgId) {
        if (orgId) {
            this.suspendedOrgIds.delete(orgId.toString());
        }
    }
    /**
     * Clears the entire cache (primarily for tests or resets).
     */
    static clear() {
        this.suspendedOrgIds.clear();
        this.initialized = false;
    }
    /**
     * Returns count of currently cached suspended organizations.
     */
    static getSuspendedCount() {
        return this.suspendedOrgIds.size;
    }
    /**
     * Returns whether cache has been initialized from database.
     */
    static isInitialized() {
        return this.initialized;
    }
}
export default TenantStatusCache;
