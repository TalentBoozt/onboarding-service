import mongoose, { Schema } from "mongoose";
const AIInsightSchema = new Schema({
    targetType: { type: String, enum: ["lead", "deal", "campaign", "general"], required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, index: true },
    insightType: {
        type: String,
        enum: ["lead_summary", "lead_prioritization", "next_best_action", "deal_risk", "objection_analysis", "draft_outreach"],
        required: true,
        index: true,
    },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    recommendedAction: { type: String },
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
    evidence: [{ type: String }],
    confidence: { type: Number },
    requiresHumanApproval: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ["pending", "reviewed", "accepted", "dismissed"],
        default: "pending",
        index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    modelUsed: { type: String, required: true },
    promptVersion: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, {
    timestamps: true,
});
AIInsightSchema.index({ targetType: 1, targetId: 1, insightType: 1 });
export const AIInsight = mongoose.model("SalesAIInsight", AIInsightSchema);
export default AIInsight;
