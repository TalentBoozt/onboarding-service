import mongoose, { Schema } from "mongoose";
const SystemJobSchema = new Schema({
    organizationId: { type: Schema.Types.Mixed, required: true },
    name: { type: String, required: true, trim: true },
    data: { type: Schema.Types.Mixed, default: {} },
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending",
        index: true,
    },
    attempts: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    backoffDelayMs: { type: Number, default: 1000 },
    idempotencyKey: { type: String, trim: true },
    lastError: { type: String },
    lockedAt: { type: Date },
    availableAt: { type: Date, default: Date.now, index: true },
    completedAt: { type: Date },
}, { timestamps: true });
// Compound index for queue polling
SystemJobSchema.index({ status: 1, availableAt: 1, lockedAt: 1 });
// Idempotency uniqueness index per organization
SystemJobSchema.index({ organizationId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
export const SystemJob = mongoose.model("SystemJob", SystemJobSchema, "system_jobs");
export default SystemJob;
