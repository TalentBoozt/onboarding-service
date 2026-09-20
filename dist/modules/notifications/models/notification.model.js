import mongoose, { Schema } from "mongoose";
const NotificationSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    recipientUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    type: {
        type: String,
        enum: [
            "journey_assigned",
            "journey_due_soon",
            "journey_overdue",
            "journey_completed",
            "employee_invited",
            "announcement",
            "knowledge_update",
            "manager_alert",
            "system",
        ],
        required: true,
    },
    channel: {
        type: String,
        enum: ["in_app", "email", "push", "webhook"],
        default: "in_app",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium",
    },
    data: {
        journeyId: { type: Schema.Types.ObjectId },
        assignmentId: { type: Schema.Types.ObjectId },
        articleId: { type: Schema.Types.ObjectId },
        actorUserId: { type: Schema.Types.ObjectId },
        deepLink: { type: String },
    },
    status: {
        type: String,
        enum: ["pending", "queued", "sent", "failed", "cancelled"],
        default: "pending",
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    deliveredAt: { type: Date },
    failureReason: { type: String },
    retryCount: { type: Number, default: 0 },
    expiresAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
});
// Indexes
NotificationSchema.index({ organizationId: 1 });
NotificationSchema.index({ recipientUserId: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
// TTL index (automatically delete documents after expiresAt has passed)
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound indexes
NotificationSchema.index({ recipientUserId: 1, isRead: 1 });
NotificationSchema.index({ organizationId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, retryCount: 1 });
export const Notification = mongoose.model("Notification", NotificationSchema, "notifications");
export default Notification;
