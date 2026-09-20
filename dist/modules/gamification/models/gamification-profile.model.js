import mongoose, { Schema } from "mongoose";
const BadgeUnlockedSchema = new Schema({
    badgeId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
}, { _id: false });
const PointHistorySchema = new Schema({
    action: { type: String, required: true },
    points: { type: Number, required: true },
    description: { type: String, required: true },
    referenceId: { type: String },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });
const GamificationProfileSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    points: { type: Number, required: true, default: 0 },
    level: { type: Number, required: true, default: 1 },
    currentStreak: { type: Number, required: true, default: 0 },
    longestStreak: { type: Number, required: true, default: 0 },
    lastActiveDate: { type: Date },
    unlockedBadges: { type: [BadgeUnlockedSchema], default: [] },
    pointHistory: { type: [PointHistorySchema], default: [] },
}, {
    timestamps: true,
});
GamificationProfileSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
GamificationProfileSchema.index({ organizationId: 1, points: -1 });
export const GamificationProfile = mongoose.model("GamificationProfile", GamificationProfileSchema);
export default GamificationProfile;
