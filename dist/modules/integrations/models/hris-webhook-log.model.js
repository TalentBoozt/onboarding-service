import mongoose, { Schema } from "mongoose";
const HRISWebhookLogSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    integrationId: { type: Schema.Types.ObjectId, required: true, ref: "HRISIntegration" },
    provider: { type: String, required: true, lowercase: true, trim: true },
    eventId: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, trim: true },
    payload: { type: Schema.Types.Mixed, required: true },
    signature: { type: String },
    status: {
        type: String,
        enum: ["received", "processed", "failed", "duplicate"],
        default: "received",
    },
    error: { type: String },
    processedAt: { type: Date },
}, {
    timestamps: true,
});
HRISWebhookLogSchema.index({ organizationId: 1, provider: 1, eventId: 1 }, { unique: true });
HRISWebhookLogSchema.index({ organizationId: 1, status: 1 });
export const HRISWebhookLog = mongoose.models.HRISWebhookLog ||
    mongoose.model("HRISWebhookLog", HRISWebhookLogSchema);
export default HRISWebhookLog;
