import mongoose, { Schema } from "mongoose";
const FeatureUsageRecordSchema = new Schema({
    featureKey: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
        index: true,
    },
    userRole: {
        type: String,
        required: true,
        default: "employee",
        trim: true,
    },
    actionName: {
        type: String,
        required: true,
        trim: true,
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
    },
}, {
    timestamps: false,
    collection: "feature_usage_records",
});
// 90-day TTL index for automated data hygiene & compliance retention
FeatureUsageRecordSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
// Compound indexes for rapid tenant and feature telemetry aggregation queries
FeatureUsageRecordSchema.index({ featureKey: 1, organizationId: 1, timestamp: -1 });
FeatureUsageRecordSchema.index({ organizationId: 1, timestamp: -1 });
FeatureUsageRecordSchema.index({ featureKey: 1, timestamp: -1 });
export const FeatureUsageRecord = mongoose.models.FeatureUsageRecord ||
    mongoose.model("FeatureUsageRecord", FeatureUsageRecordSchema);
export default FeatureUsageRecord;
