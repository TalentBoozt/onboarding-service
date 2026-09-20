import mongoose, { Schema } from "mongoose";
const UploadSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    fileName: { type: String, required: true, trim: true },
    originalFileName: { type: String, required: true, trim: true },
    extension: { type: String, required: true, lowercase: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    type: {
        type: String,
        enum: ["video", "image", "audio", "document", "other"],
        required: true,
    },
    storage: {
        provider: { type: String, enum: ["cloudflare-r2"], default: "cloudflare-r2" },
        bucket: { type: String, required: true },
        objectKey: { type: String, required: true },
        publicUrl: { type: String },
    },
    metadata: {
        width: { type: Number },
        height: { type: Number },
        durationSeconds: { type: Number },
        pages: { type: Number },
    },
    thumbnail: {
        uploadId: { type: Schema.Types.ObjectId, ref: "Upload" },
    },
    ownership: {
        uploadedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
        uploadedAt: { type: Date, required: true, default: Date.now },
    },
    usage: {
        entityType: {
            type: String,
            enum: ["journey", "knowledge_base", "user_avatar", "certificate", "organization"],
        },
        entityId: { type: Schema.Types.ObjectId },
        usageCount: { type: Number, default: 0 },
    },
    security: {
        visibility: { type: String, enum: ["public", "private"], default: "private" },
        virusScanned: { type: Boolean, default: false },
        virusScanStatus: {
            type: String,
            enum: ["pending", "clean", "infected"],
            default: "pending",
        },
    },
    lifecycle: {
        status: { type: String, enum: ["active", "archived", "deleted"], default: "active" },
    },
}, {
    timestamps: true,
});
// Indexes
UploadSchema.index({ organizationId: 1 });
UploadSchema.index({ type: 1 });
UploadSchema.index({ createdAt: 1 });
UploadSchema.index({ "lifecycle.status": 1 });
// Compound indexes
UploadSchema.index({ organizationId: 1, type: 1 });
UploadSchema.index({ organizationId: 1, "lifecycle.status": 1 });
UploadSchema.index({ organizationId: 1, createdAt: 1 });
UploadSchema.index({ organizationId: 1, "usage.entityType": 1 });
export const Upload = mongoose.model("Upload", UploadSchema, "uploads");
export default Upload;
