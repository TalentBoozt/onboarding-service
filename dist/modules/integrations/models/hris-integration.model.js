import mongoose, { Schema } from "mongoose";
const FieldMappingSchema = new Schema({
    externalField: { type: String, required: true },
    internalField: { type: String, required: true },
}, { _id: false });
const HRISIntegrationSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    provider: {
        type: String,
        enum: ["bamboohr", "workday", "rippling", "personio", "custom_webhook"],
        required: true,
    },
    name: { type: String, required: true },
    status: { type: String, enum: ["active", "disabled", "error"], default: "active" },
    apiKey: { type: String },
    apiSecret: { type: String },
    webhookSecret: { type: String },
    subdomain: { type: String },
    baseUrl: { type: String },
    fieldMappings: {
        type: [FieldMappingSchema],
        default: [
            { externalField: "work_email", internalField: "email" },
            { externalField: "first_name", internalField: "firstName" },
            { externalField: "last_name", internalField: "lastName" },
            { externalField: "department", internalField: "department" },
            { externalField: "job_title", internalField: "jobTitle" },
        ],
    },
    conflictPolicy: { type: String, enum: ["hris_wins", "local_wins"], default: "hris_wins" },
    autoProvisionJourneys: { type: Boolean, default: true },
    syncFrequencyMinutes: { type: Number, default: 60 },
    lastSyncedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
}, {
    timestamps: true,
});
HRISIntegrationSchema.index({ organizationId: 1, provider: 1 });
export const HRISIntegration = mongoose.models.HRISIntegration ||
    mongoose.model("HRISIntegration", HRISIntegrationSchema, "hrisintegrations");
export const Integration = mongoose.models.Integration ||
    mongoose.model("Integration", HRISIntegrationSchema, "hrisintegrations");
export default HRISIntegration;
