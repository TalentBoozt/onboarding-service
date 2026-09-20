import mongoose, { Schema } from "mongoose";
const AuditLogSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: false, ref: "Organization" },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
    actorType: {
        type: String,
        enum: ["user", "system", "api", "scheduler"],
        required: true,
    },
    eventCategory: {
        type: String,
        enum: [
            "authentication",
            "user",
            "journey",
            "assignment",
            "content",
            "organization",
            "security",
            "system",
            "finance",
            "ai",
            "infrastructure",
            "admin",
            "feature_flag",
        ],
        required: true,
    },
    eventType: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId },
    action: {
        type: String,
        enum: [
            "create",
            "update",
            "delete",
            "assign",
            "complete",
            "archive",
            "restore",
            "login",
            "logout",
            "export",
            "status_change",
        ],
        required: true,
    },
    description: { type: String, required: true },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
    request: {
        ipAddress: { type: String },
        userAgent: { type: String },
        method: { type: String },
        endpoint: { type: String },
    },
    severity: {
        type: String,
        enum: ["info", "warning", "critical"],
        default: "info",
    },
}, {
    // Audit logs are immutable; no updatedAt needed. We set custom createdAt behavior.
    timestamps: { createdAt: true, updatedAt: false },
});
// Indexes
AuditLogSchema.index({ organizationId: 1 });
AuditLogSchema.index({ actorUserId: 1 });
AuditLogSchema.index({ eventCategory: 1 });
AuditLogSchema.index({ eventType: 1 });
AuditLogSchema.index({ resourceType: 1 });
AuditLogSchema.index({ resourceId: 1 });
AuditLogSchema.index({ severity: 1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 365 * 24 * 60 * 60 });
// Compound indexes
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ actorUserId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ eventCategory: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });
export const AuditLog = mongoose.model("AuditLog", AuditLogSchema, "auditLogs");
export default AuditLog;
