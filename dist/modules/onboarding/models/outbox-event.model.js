import mongoose, { Schema } from "mongoose";
const OutboxEventSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    aggregateType: {
        type: String,
        enum: ["onboarding_case", "employee", "workflow", "hris_integration"],
        required: true,
    },
    aggregateId: { type: Schema.Types.ObjectId, required: true },
    eventName: { type: String, required: true },
    eventVersion: { type: Number, required: true, default: 1 },
    correlationId: { type: String, required: true },
    causationId: { type: String },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
        type: String,
        enum: ["pending", "processing", "published", "failed", "dead_letter"],
        default: "pending",
        index: true,
    },
    attempts: { type: Number, default: 0 },
    availableAt: { type: Date, default: Date.now, index: true },
    lockedAt: { type: Date },
    lastError: { type: String },
    publishedAt: { type: Date },
}, { timestamps: true });
OutboxEventSchema.index({ status: 1, availableAt: 1, lockedAt: 1 });
OutboxEventSchema.index({ aggregateId: 1, eventName: 1, correlationId: 1 }, { unique: true });
// TTL index to automatically purge published outbox events after 7 days
OutboxEventSchema.index({ publishedAt: 1 }, {
    name: "outbox_events_published_ttl",
    expireAfterSeconds: 7 * 24 * 60 * 60,
    partialFilterExpression: { status: "published" },
});
export const OutboxEvent = mongoose.model("OutboxEvent", OutboxEventSchema, "outbox_events");
export default OutboxEvent;
