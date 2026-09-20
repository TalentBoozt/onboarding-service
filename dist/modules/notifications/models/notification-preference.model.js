import mongoose, { Schema } from "mongoose";
const NotificationPreferenceSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    channels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
    },
    categories: {
        journeyAssigned: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
        },
        journeyOverdue: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
        },
        complianceDue: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
        },
        announcements: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
        },
        reminders: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: true },
        },
    },
    quietHours: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String },
        endTime: { type: String },
        timezone: { type: String, default: "UTC" },
    },
    frequency: {
        type: String,
        enum: ["immediate", "daily_digest", "weekly_digest"],
        default: "immediate",
    },
}, { timestamps: true });
// Indexes
NotificationPreferenceSchema.index({ userId: 1 }, { unique: true });
NotificationPreferenceSchema.index({ organizationId: 1, userId: 1 });
export const NotificationPreference = mongoose.model("NotificationPreference", NotificationPreferenceSchema, "notificationpreferences");
export default NotificationPreference;
