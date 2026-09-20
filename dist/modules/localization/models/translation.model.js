import mongoose, { Schema } from "mongoose";
const TranslationSchema = new Schema({
    entityType: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    entityId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    field: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    language: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    value: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["DRAFT", "AI_GENERATED", "UNDER_REVIEW", "APPROVED", "OUTDATED"],
        default: "DRAFT",
    },
    sourceVersion: {
        type: Number,
        default: 1,
    },
    version: {
        type: Number,
        default: 1,
    },
    translatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
}, { timestamps: true });
// Primary uniqueness constraint: one translation per field per language per entity
TranslationSchema.index({ entityType: 1, entityId: 1, field: 1, language: 1 }, { unique: true, name: "translation_entity_field_lang_unique" });
// Admin list queries
TranslationSchema.index({ entityType: 1, status: 1 });
TranslationSchema.index({ entityId: 1, language: 1 });
TranslationSchema.index({ language: 1, status: 1 });
TranslationSchema.index({ entityType: 1, entityId: 1 });
export const Translation = mongoose.model("Translation", TranslationSchema, "i18nTranslations");
export default Translation;
