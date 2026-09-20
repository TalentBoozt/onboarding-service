import mongoose, { Schema } from "mongoose";
const OrganizationIntegrationSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Organization",
        index: true,
    },
    type: {
        type: String,
        enum: ["ai", "email"],
        required: true,
    },
    provider: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["not_configured", "configured", "valid", "invalid", "disabled"],
        default: "not_configured",
    },
    encryptedConfig: {
        type: String,
        default: "",
    },
    publicConfig: {
        type: Schema.Types.Mixed,
        default: {},
    },
    lastValidatedAt: {
        type: Date,
    },
    validationError: {
        type: String,
        default: "",
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
}, {
    timestamps: true,
});
// Unique compound index: only 1 AI integration and 1 Email integration per organization
OrganizationIntegrationSchema.index({ organizationId: 1, type: 1 }, { unique: true });
export const OrganizationIntegration = mongoose.models.OrganizationIntegration ||
    mongoose.model("OrganizationIntegration", OrganizationIntegrationSchema, "organization_integrations");
export default OrganizationIntegration;
