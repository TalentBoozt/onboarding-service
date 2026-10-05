import mongoose, { Schema } from "mongoose";
const KioskWebhookSubscriptionSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Organization",
        index: true,
    },
    url: {
        type: String,
        required: true,
        trim: true,
    },
    secret: {
        type: String,
        required: true,
        trim: true,
    },
    topics: {
        type: [String],
        required: true,
        default: ["*"],
    },
    enabled: {
        type: Boolean,
        default: true,
        index: true,
    },
    name: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    headers: {
        type: Schema.Types.Mixed,
        default: {},
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
    failureCount: {
        type: Number,
        default: 0,
    },
    lastDeliveredAt: {
        type: Date,
    },
    lastFailureAt: {
        type: Date,
    },
    lastFailureError: {
        type: String,
    },
}, {
    timestamps: true,
});
KioskWebhookSubscriptionSchema.index({ organizationId: 1, enabled: 1 });
export const KioskWebhookSubscriptionModel = mongoose.models.KioskWebhookSubscription ||
    mongoose.model("KioskWebhookSubscription", KioskWebhookSubscriptionSchema, "kiosk_webhook_subscriptions");
export default KioskWebhookSubscriptionModel;
