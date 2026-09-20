import mongoose, { Schema } from "mongoose";
const ContentBlockSchema = new Schema({
    type: {
        type: String,
        enum: ["text", "image", "video", "audio", "pdf", "document", "embed", "callout", "code"],
        required: true,
    },
    content: { type: String },
    uploadId: { type: Schema.Types.ObjectId },
    embedUrl: { type: String },
    order: { type: Number, required: true },
});
const AttachmentSchema = new Schema({
    title: { type: String, required: true },
    uploadId: { type: Schema.Types.ObjectId, required: true },
    downloadable: { type: Boolean, default: true },
});
const ArticleSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    summary: { type: String },
    content: {
        blocks: { type: [ContentBlockSchema], default: [] },
    },
    categoryId: { type: Schema.Types.ObjectId },
    tags: { type: [String], default: [] },
    visibility: {
        access: {
            type: String,
            enum: ["all", "department", "team", "custom"],
            default: "all",
        },
        departments: { type: [Schema.Types.ObjectId], ref: "Organization.departments" },
        teams: { type: [Schema.Types.ObjectId], ref: "Organization.teams" },
        users: { type: [Schema.Types.ObjectId], ref: "User" },
    },
    attachments: { type: [AttachmentSchema], default: [] },
    analytics: {
        views: { type: Number, default: 0 },
        uniqueViews: { type: Number, default: 0 },
        averageReadTimeSeconds: { type: Number, default: 0 },
        lastViewedAt: { type: Date },
    },
    publishing: {
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft",
        },
        publishedAt: { type: Date },
        version: { type: Number, default: 1 },
    },
    searchKeywords: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});
// Indexes
ArticleSchema.index({ organizationId: 1 });
ArticleSchema.index({ slug: 1 });
ArticleSchema.index({ categoryId: 1 });
ArticleSchema.index({ "publishing.status": 1 });
ArticleSchema.index({ createdAt: 1 });
// Compound indexes
ArticleSchema.index({ organizationId: 1, isDeleted: 1 });
ArticleSchema.index({ organizationId: 1, slug: 1 });
ArticleSchema.index({ organizationId: 1, categoryId: 1 });
ArticleSchema.index({ organizationId: 1, "publishing.status": 1 });
ArticleSchema.index({ organizationId: 1, createdAt: 1 });
// Text index for search
ArticleSchema.index({
    title: "text",
    summary: "text",
    "content.blocks.content": "text",
    tags: "text",
    searchKeywords: "text",
}, {
    weights: {
        title: 10,
        summary: 5,
        tags: 3,
        searchKeywords: 3,
        "content.blocks.content": 1,
    },
    name: "ArticleTextSearchIndex",
});
export const Article = mongoose.model("Article", ArticleSchema, "knowledgeBase");
export default Article;
