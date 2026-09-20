import mongoose, { Schema } from "mongoose";
const DocumentTemplateSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    category: {
        type: String,
        enum: ["nda", "code_of_conduct", "offer_letter", "handbook", "direct_deposit", "custom"],
        default: "custom",
    },
    content: { type: String, required: true },
    signatureRequired: { type: Boolean, default: true },
    isMandatory: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    audience: {
        departmentNames: { type: [String], default: [] },
        jobTitleNames: { type: [String], default: [] },
        locations: { type: [String], default: [] },
        autoAssignNewHires: { type: Boolean, default: false },
    },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, {
    timestamps: true,
});
DocumentTemplateSchema.index({ organizationId: 1, isDeleted: 1 });
DocumentTemplateSchema.index({ organizationId: 1, category: 1 });
export const DocumentTemplate = mongoose.model("DocumentTemplate", DocumentTemplateSchema);
export default DocumentTemplate;
