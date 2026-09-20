import mongoose, { Schema } from "mongoose";
const QuickLinkSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    icon: { type: String, default: "Link" },
    order: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});
// Indexes
QuickLinkSchema.index({ organizationId: 1 });
QuickLinkSchema.index({ organizationId: 1, isDeleted: 1 });
export const QuickLink = mongoose.model("QuickLink", QuickLinkSchema, "quickLinks");
export default QuickLink;
