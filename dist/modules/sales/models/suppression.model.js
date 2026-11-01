import mongoose, { Schema } from "mongoose";
const SuppressionSchema = new Schema({
    identifier: { type: String, required: true, trim: true, lowercase: true, index: true },
    type: { type: String, enum: ["email", "phone"], required: true, index: true },
    reason: {
        type: String,
        enum: ["unsubscribe", "hard_bounce", "spam_complaint", "manual"],
        default: "unsubscribe",
        index: true,
    },
    source: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
});
SuppressionSchema.index({ identifier: 1, type: 1 }, { unique: true });
export const Suppression = mongoose.models["SalesSuppression"] ||
    mongoose.model("SalesSuppression", SuppressionSchema);
export default Suppression;
