import mongoose, { Schema } from "mongoose";
const MeetingEventSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    category: {
        type: String,
        enum: ["manager_1on1", "buddy_coffee", "orientation", "training", "custom"],
        default: "custom",
    },
    organizerUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    attendeeUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, default: "UTC" },
    locationUrl: { type: String },
    status: {
        type: String,
        enum: ["scheduled", "completed", "cancelled"],
        default: "scheduled",
    },
    reminderMinutesBefore: { type: Number, default: 15 },
    externalEventId: { type: String },
    iCalUid: { type: String, required: true, unique: true },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});
MeetingEventSchema.index({ organizationId: 1, startTime: 1 });
MeetingEventSchema.index({ organizationId: 1, attendeeUserIds: 1 });
export const MeetingEvent = mongoose.model("MeetingEvent", MeetingEventSchema);
export const CalendarEvent = MeetingEvent;
export default MeetingEvent;
