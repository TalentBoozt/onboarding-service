import mongoose, { Schema } from "mongoose";
const KnowledgeChunkSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization", index: true },
    resourceId: { type: Schema.Types.ObjectId, required: true, index: true },
    resourceType: {
        type: String,
        enum: ["article", "quick_answer", "policy", "guide", "document"],
        default: "article",
    },
    title: { type: String, required: true, trim: true },
    chunkIndex: { type: Number, required: true },
    heading: { type: String, trim: true },
    content: { type: String, required: true },
    tokens: { type: Number },
    embedding: { type: [Number], default: [] },
    visibility: {
        access: {
            type: String,
            enum: ["all", "department", "team", "custom"],
            default: "all",
        },
        departments: { type: [Schema.Types.ObjectId], default: [] },
        teams: { type: [Schema.Types.ObjectId], default: [] },
        users: { type: [Schema.Types.ObjectId], default: [] },
    },
    version: { type: Number, default: 1 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
}, {
    timestamps: true,
});
// Compound indexes for multi-tenant querying
KnowledgeChunkSchema.index({ organizationId: 1, status: 1 });
KnowledgeChunkSchema.index({ organizationId: 1, resourceId: 1 });
KnowledgeChunkSchema.index({ organizationId: 1, "visibility.access": 1 });
// Full text search index
KnowledgeChunkSchema.index({
    title: "text",
    heading: "text",
    content: "text",
}, {
    weights: {
        title: 10,
        heading: 5,
        content: 2,
    },
    name: "KnowledgeChunkTextSearchIndex",
});
export const KnowledgeChunk = mongoose.model("KnowledgeChunk", KnowledgeChunkSchema, "knowledgeChunks");
export default KnowledgeChunk;
