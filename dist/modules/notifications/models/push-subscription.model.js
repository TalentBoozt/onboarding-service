import mongoose, { Schema } from "mongoose";
const PushKeysSchema = new Schema({
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
}, { _id: false });
const PushSubscriptionSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    endpoint: { type: String, required: true },
    keys: { type: PushKeysSchema, required: true },
    userAgent: { type: String },
}, {
    timestamps: true,
});
PushSubscriptionSchema.index({ organizationId: 1, userId: 1 });
PushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
export const PushSubscription = mongoose.model("PushSubscription", PushSubscriptionSchema);
export default PushSubscription;
