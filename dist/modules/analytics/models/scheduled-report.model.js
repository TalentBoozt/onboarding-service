import mongoose, { Schema } from "mongoose";
const ScheduledReportSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    title: { type: String, required: true, trim: true },
    frequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "weekly" },
    recipients: { type: [String], required: true },
    format: { type: String, enum: ["csv", "json"], default: "csv" },
    status: { type: String, enum: ["active", "paused"], default: "active" },
    lastSentAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
}, {
    timestamps: true,
});
ScheduledReportSchema.index({ organizationId: 1, status: 1 });
export const ScheduledReport = mongoose.model("ScheduledReport", ScheduledReportSchema);
export default ScheduledReport;
