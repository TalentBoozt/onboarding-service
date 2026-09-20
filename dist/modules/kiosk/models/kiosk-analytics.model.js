import mongoose, { Schema } from "mongoose";
const KioskSessionMetricsSchema = new Schema({
    launchesCount: { type: Number, required: true, min: 0 },
    completedCount: { type: Number, required: true, min: 0 },
    durationSeconds: { type: Number, required: true, min: 0 },
    abortedStepId: { type: String }
}, { _id: false });
const KioskUserInteractionSchema = new Schema({
    stepId: { type: String, required: true },
    elementClicked: { type: String, required: true },
    eventType: { type: String },
    timestamp: { type: Date, required: true, default: Date.now }
}, { _id: false });
const KioskAnalyticsSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    deviceId: { type: Schema.Types.ObjectId, ref: "KioskDevice" },
    journeyId: { type: Schema.Types.ObjectId, required: true, ref: "KioskJourney" },
    journeyVersion: { type: Number, required: true, min: 1 },
    languageUsed: { type: String, required: true },
    stepId: { type: String },
    eventType: { type: String },
    metrics: { type: KioskSessionMetricsSchema, required: true },
    interactions: { type: [KioskUserInteractionSchema], default: [] },
    dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }
}, {
    timestamps: true
});
// Indexes
KioskAnalyticsSchema.index({ organizationId: 1 });
KioskAnalyticsSchema.index({ journeyId: 1 });
KioskAnalyticsSchema.index({ deviceId: 1 });
KioskAnalyticsSchema.index({ dateKey: 1 });
// Compound indexes for aggregates & reports
KioskAnalyticsSchema.index({ organizationId: 1, journeyId: 1, dateKey: 1 });
KioskAnalyticsSchema.index({ organizationId: 1, dateKey: 1 });
export const KioskAnalyticsModel = mongoose.model("KioskAnalytics", KioskAnalyticsSchema);
export default KioskAnalyticsModel;
