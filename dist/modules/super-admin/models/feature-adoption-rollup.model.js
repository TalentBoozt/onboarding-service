import mongoose, { Schema } from "mongoose";
const FeatureAdoptionRollupSchema = new Schema({
    featureKey: {
        type: String,
        required: true,
        index: true,
        trim: true,
    },
    period: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "daily",
        required: true,
    },
    date: {
        type: Date,
        required: true,
        index: true,
    },
    totalEvents: {
        type: Number,
        default: 0,
    },
    uniqueOrganizations: {
        type: Number,
        default: 0,
    },
    uniqueUsers: {
        type: Number,
        default: 0,
    },
    organizationsEligible: {
        type: Number,
        default: 0,
    },
    organizationAdoptionPct: {
        type: Number,
        default: 0,
    },
    usersEligible: {
        type: Number,
        default: 0,
    },
    userAdoptionPct: {
        type: Number,
        default: 0,
    },
    roleBreakdown: [
        {
            role: { type: String, required: true },
            uniqueUsers: { type: Number, default: 0 },
            eventCount: { type: Number, default: 0 },
        },
    ],
}, {
    timestamps: true,
    collection: "feature_adoption_rollups",
});
FeatureAdoptionRollupSchema.index({ featureKey: 1, period: 1, date: -1 });
export const FeatureAdoptionDailyRollup = mongoose.models.FeatureAdoptionDailyRollup ||
    mongoose.model("FeatureAdoptionDailyRollup", FeatureAdoptionRollupSchema);
export const FeatureAdoptionRollup = FeatureAdoptionDailyRollup;
export default FeatureAdoptionDailyRollup;
