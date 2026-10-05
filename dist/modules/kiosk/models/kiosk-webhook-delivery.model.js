import mongoose, { Schema } from "mongoose";
const KioskWebhookDeliverySchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Organization",
        index: true,
    },
    subscriptionId: {
        type: Schema.Types.ObjectId,
        ref: "KioskWebhookSubscription",
        index: true,
    },
    url: {
        type: String,
        required: true,
    },
    topic: {
        type: String,
        required: true,
        index: true,
    },
    eventId: {
        type: String,
        required: true,
        index: true,
    },
    payload: {
        type: Schema.Types.Mixed,
        required: true,
    },
    signature: {
        type: String,
        required: true,
    },
    statusCode: {
        type: Number,
    },
    responseBody: {
        type: String,
    },
    status: {
        type: String,
        enum: ["success", "failed"],
        required: true,
        index: true,
    },
    durationMs: {
        type: Number,
    },
    error: {
        type: String,
    },
    attempts: {
        type: Number,
        default: 1,
    },
}, {
    timestamps: true,
});
KioskWebhookDeliverySchema.index({ organizationId: 1, createdAt: -1 });
export const KioskWebhookDeliveryModel = mongoose.models.KioskWebhookDelivery ||
    mongoose.model("KioskWebhookDelivery", KioskWebhookDeliverySchema, "kiosk_webhook_deliveries");
export default KioskWebhookDeliveryModel;
