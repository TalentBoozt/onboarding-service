import mongoose from "mongoose";
import User from "../modules/auth/models/user.model.js";
import Task from "../modules/tasks/models/task.model.js";
import Journey from "../modules/journeys/models/journey.model.js";
import AuditLog from "../modules/audit-logs/models/audit-log.model.js";
/**
 * High-concurrency compound indexes with organizationId as leading prefix.
 * Designed to support 10,000+ concurrent multi-tenant queries without table scans.
 */
export const MULTI_TENANT_INDEX_SPECS = [
    {
        modelName: "User",
        model: User,
        fields: { organizationId: 1, "employment.status": 1, "profile.lastName": 1 },
    },
    {
        modelName: "Task",
        model: Task,
        fields: { organizationId: 1, status: 1, dueDate: 1 },
    },
    {
        modelName: "Journey",
        model: Journey,
        fields: { organizationId: 1, "publishing.status": 1 },
    },
    {
        modelName: "AuditLog",
        model: AuditLog,
        fields: { organizationId: 1, createdAt: -1 },
    },
];
/**
 * Programmatically ensures all required compound multi-tenant indexes exist in MongoDB.
 */
export async function ensureMultiTenantIndexes(log = console) {
    if (mongoose.connection.readyState !== 1) {
        log.warn?.("⚠️ [Indexes] Cannot sync indexes: MongoDB connection is not ready.");
        return;
    }
    for (const spec of MULTI_TENANT_INDEX_SPECS) {
        try {
            const existingIndexes = await spec.model.collection.indexes();
            const targetKeys = Object.keys(spec.fields);
            const alreadyIndexed = existingIndexes.some((idx) => {
                const idxKeys = Object.keys(idx.key || {});
                return (idxKeys.length >= targetKeys.length &&
                    targetKeys.every((k) => idx.key[k] === spec.fields[k]));
            });
            if (!alreadyIndexed) {
                await spec.model.collection.createIndex(spec.fields, { background: true });
                log.info?.(`⚡ [Indexes] Created compound index on ${spec.modelName}: ${targetKeys.join(", ")}`);
            }
            else {
                log.info?.(`⚡ [Indexes] Verified compound index on ${spec.modelName}: ${targetKeys.join(", ")}`);
            }
        }
        catch (error) {
            log.warn?.(`⚠️ [Indexes] Index verification note for ${spec.modelName}: ${error.message}`);
        }
    }
}
export default ensureMultiTenantIndexes;
