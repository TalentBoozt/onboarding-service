import mongoose, { Schema } from "mongoose";
const KnowledgeGapSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization", index: true },
    question: { type: String, required: true, trim: true },
    normalizedQuestion: { type: String, required: true, trim: true, index: true },
    category: { type: String, default: "General Policy" },
    occurrenceCount: { type: Number, default: 1 },
    requestedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: {
        type: String,
        enum: ["unresolved", "resolved", "dismissed"],
        default: "unresolved",
        index: true,
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium",
    },
    resolutionResourceId: { type: Schema.Types.ObjectId, ref: "Article" },
    resolutionType: {
        type: String,
        enum: ["quick_answer", "article"],
    },
    resolutionNotes: { type: String },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
    lastAskedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});
// Compound indexes
KnowledgeGapSchema.index({ organizationId: 1, status: 1, occurrenceCount: -1 });
KnowledgeGapSchema.index({ organizationId: 1, normalizedQuestion: 1 });
export const KnowledgeGap = mongoose.model("KnowledgeGap", KnowledgeGapSchema, "knowledgeGaps");
export default KnowledgeGap;
