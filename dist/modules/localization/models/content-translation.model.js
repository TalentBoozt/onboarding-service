import mongoose, { Schema } from "mongoose";
const ContentTranslationSchema = new Schema({
    contentId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Content",
        index: true,
    },
    language: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    title: { type: String, trim: true },
    body: { type: String },
    status: {
        type: String,
        enum: ["DRAFT", "AI_GENERATED", "UNDER_REVIEW", "APPROVED"],
        default: "DRAFT",
    },
    version: { type: Number, default: 1 },
    translatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
// Enforce one translation record per (content, language) pair
ContentTranslationSchema.index({ contentId: 1, language: 1 }, { unique: true });
// Speed up filtered lookups
ContentTranslationSchema.index({ language: 1, status: 1 });
export const ContentTranslation = mongoose.model("ContentTranslation", ContentTranslationSchema, "i18nContentTranslations");
export default ContentTranslation;
