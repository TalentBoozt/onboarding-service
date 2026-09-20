import mongoose, { Schema } from "mongoose";
const MilestoneGoalSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
});
const CheckinQuestionSchema = new Schema({
    question: { type: String, required: true },
    type: { type: String, enum: ["text", "rating", "boolean"], default: "text" },
    required: { type: Boolean, default: true },
});
const MilestoneTemplateSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    targetDay: { type: Number, enum: [30, 60, 90, 180], required: true },
    goals: { type: [MilestoneGoalSchema], default: [] },
    checkinQuestions: { type: [CheckinQuestionSchema], default: [] },
    audience: {
        departmentNames: { type: [String], default: [] },
        jobTitleNames: { type: [String], default: [] },
        autoAssignNewHires: { type: Boolean, default: true },
    },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    autoApprovalEnabled: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, {
    timestamps: true,
});
MilestoneTemplateSchema.index({ organizationId: 1, targetDay: 1, isDeleted: 1 });
export const MilestoneTemplate = mongoose.model("MilestoneTemplate", MilestoneTemplateSchema);
export default MilestoneTemplate;
