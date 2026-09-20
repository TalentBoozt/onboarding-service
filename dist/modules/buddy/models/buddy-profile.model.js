import mongoose, { Schema } from "mongoose";
const BuddyProfileSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", unique: true },
    isAvailable: { type: Boolean, default: true },
    maxMentees: { type: Number, default: 3 },
    currentMenteeCount: { type: Number, default: 0 },
    skills: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    department: { type: String },
    jobTitle: { type: String },
    bio: { type: String },
    notes: { type: String },
}, {
    timestamps: true,
});
BuddyProfileSchema.index({ organizationId: 1, isAvailable: 1 });
export const BuddyProfile = mongoose.model("BuddyProfile", BuddyProfileSchema);
export default BuddyProfile;
