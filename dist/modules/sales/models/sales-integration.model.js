import mongoose, { Schema } from "mongoose";
const SalesIntegrationSchema = new Schema({
    category: {
        type: String,
        enum: ["email", "whatsapp", "ai", "webhook"],
        required: true,
        index: true,
    },
    provider: {
        type: String,
        enum: ["ses", "sendgrid", "smtp", "meta_whatsapp", "twilio_whatsapp", "openai", "gemini", "generic_webhook"],
        required: true,
        index: true,
    },
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ["not_configured", "configured", "valid", "invalid"],
        default: "not_configured",
        index: true,
    },
    publicConfig: { type: Schema.Types.Mixed, default: {} },
    encryptedSecrets: { type: Map, of: String, default: {} },
    lastValidatedAt: { type: Date },
    validationError: { type: String },
}, {
    timestamps: true,
});
SalesIntegrationSchema.index({ category: 1, provider: 1 }, { unique: true });
export const SalesIntegration = mongoose.model("SalesIntegration", SalesIntegrationSchema);
export default SalesIntegration;
