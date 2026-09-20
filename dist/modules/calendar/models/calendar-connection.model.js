import mongoose, { Schema } from "mongoose";
const CalendarConnectionSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", unique: true },
    provider: { type: String, enum: ["google", "outlook", "ical"], default: "ical" },
    syncStatus: { type: String, enum: ["connected", "error", "disconnected"], default: "connected" },
    timezone: { type: String, default: "UTC" },
    icalToken: { type: String, required: true, unique: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    calendarId: { type: String },
    lastSyncedAt: { type: Date },
}, {
    timestamps: true,
});
CalendarConnectionSchema.index({ organizationId: 1, userId: 1 });
export const CalendarConnection = mongoose.model("CalendarConnection", CalendarConnectionSchema);
export default CalendarConnection;
