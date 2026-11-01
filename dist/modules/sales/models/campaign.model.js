import mongoose, { Schema } from "mongoose";
const CampaignRecipientSchema = new Schema({
    contactId: { type: Schema.Types.ObjectId, ref: "SalesContact" },
    leadId: { type: Schema.Types.ObjectId, ref: "SalesLead" },
    recipientEmail: String,
    recipientPhone: String,
    recipientName: String,
    status: {
        type: String,
        enum: ["pending", "queued", "sent", "delivered", "read", "opened", "clicked", "bounced", "failed"],
        default: "pending",
    },
    providerMessageId: String,
    sentAt: Date,
    deliveredAt: Date,
    errorMessage: String,
});
const CampaignSchema = new Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    channel: { type: String, enum: ["email", "whatsapp"], required: true, index: true },
    status: {
        type: String,
        enum: ["draft", "validating", "scheduled", "queued", "sending", "completed", "paused", "cancelled", "failed"],
        default: "draft",
        index: true,
    },
    templateId: { type: Schema.Types.ObjectId, ref: "SalesCampaignTemplate" },
    subject: { type: String, trim: true },
    previewText: { type: String, trim: true },
    content: { type: String },
    whatsappTemplateName: { type: String, trim: true },
    whatsappLanguageCode: { type: String, default: "en" },
    whatsappParameters: { type: Map, of: String },
    audienceFilter: { type: Schema.Types.Mixed },
    scheduledAt: { type: Date, index: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stats: {
        totalRecipients: { type: Number, default: 0 },
        sentCount: { type: Number, default: 0 },
        deliveredCount: { type: Number, default: 0 },
        openedCount: { type: Number, default: 0 },
        clickedCount: { type: Number, default: 0 },
        bouncedCount: { type: Number, default: 0 },
        repliedCount: { type: Number, default: 0 },
        failedCount: { type: Number, default: 0 },
    },
    recipients: [CampaignRecipientSchema],
    tags: [{ type: String, trim: true, index: true }],
}, {
    timestamps: true,
});
CampaignSchema.index({ status: 1, scheduledAt: 1 });
export const Campaign = mongoose.model("SalesCampaign", CampaignSchema);
export default Campaign;
