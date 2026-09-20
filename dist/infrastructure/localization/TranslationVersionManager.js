/**
 * TranslationVersionManager
 *
 * Responsible for all version lifecycle operations:
 * - Incrementing sourceVersion when English content changes
 * - Marking non-English translations as OUTDATED automatically
 * - Cache invalidation on version change
 *
 * Business rule: English is always the source of truth.
 * When English changes → non-English translations become OUTDATED.
 * OUTDATED translations are NOT deleted — editors can still see them.
 * Production falls back to English until a new translation is APPROVED.
 */
export class TranslationVersionManager {
    repository;
    cache;
    constructor(repository, cache) {
        this.repository = repository;
        this.cache = cache;
    }
    /**
     * Called when the English source value for an entity field changes.
     *
     * Actions:
     * 1. Mark all non-English translations for (entityType, entityId, field) as OUTDATED
     * 2. Invalidate cache for all affected language keys
     */
    async onSourceChanged(entityType, entityId, field, newSourceVersion) {
        const id = entityId.toString();
        // Mark non-English translations as OUTDATED
        await this.repository.markOutdated(entityType, id, field);
        // Invalidate cache for all languages on this entity/field
        const cachePrefix = `tr:${entityType}:${id}:${field}:`;
        await this.cache.deleteByPrefix(cachePrefix);
    }
    /**
     * Build the cache key for a specific translation lookup.
     * Format: tr:{entityType}:{entityId}:{field}:{language}
     */
    buildCacheKey(entityType, entityId, field, language) {
        return `tr:${entityType}:${entityId}:${field}:${language}`;
    }
    /**
     * Invalidate cache for a specific translation.
     */
    async invalidate(entityType, entityId, field, language) {
        const key = this.buildCacheKey(entityType, entityId, field, language);
        await this.cache.delete(key);
    }
    /**
     * Invalidate all cached translations for an entity.
     */
    async invalidateEntity(entityType, entityId) {
        await this.cache.deleteByPrefix(`tr:${entityType}:${entityId}:`);
    }
}
