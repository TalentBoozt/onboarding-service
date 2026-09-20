import mongoose, { Schema } from "mongoose";
const BuddyChecklistItemSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    stage: {
        type: String,
        enum: ["preboarding", "day_1", "week_1", "month_1"],
        default: "day_1",
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
});
const BuddyCheckinLogSchema = new Schema({
    scheduledAt: { type: Date },
    completedAt: { type: Date, default: Date.now },
    notes: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    sentiment: {
        type: String,
        enum: ["positive", "neutral", "challenged"],
        default: "positive",
    },
});
const BuddyAssignmentSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    buddyUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    newHireUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    assignedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    assignedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ["active", "completed", "reassigned"],
        default: "active",
    },
    checklist: { type: [BuddyChecklistItemSchema], default: [] },
    checkins: { type: [BuddyCheckinLogSchema], default: [] },
    communicationLinks: {
        slackChannelUrl: { type: String },
        teamsUrl: { type: String },
        email: { type: String },
    },
    matchScore: { type: Number },
    matchCriteria: {
        departmentScore: { type: Number },
        locationScore: { type: Number },
        languageScore: { type: Number },
        capacityScore: { type: Number },
        skillScore: { type: Number },
    },
    coachingNudges: {
        week1SentAt: { type: Date },
        week2SentAt: { type: Date },
        week4SentAt: { type: Date },
    },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});
BuddyAssignmentSchema.index({ organizationId: 1, newHireUserId: 1 });
BuddyAssignmentSchema.index({ organizationId: 1, buddyUserId: 1 });
export const BuddyAssignment = mongoose.model("BuddyAssignment", BuddyAssignmentSchema);
export default BuddyAssignment;
