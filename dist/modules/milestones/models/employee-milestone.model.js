import mongoose, { Schema } from "mongoose";
const QuestionAnswerSchema = new Schema({
    questionId: { type: Schema.Types.ObjectId, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
});
const EmployeeSelfCheckSchema = new Schema({
    completedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: Date.now },
    responses: { type: [QuestionAnswerSchema], default: [] },
    confidenceRating: { type: Number, min: 1, max: 5 },
    employeeRating: { type: Number, min: 1, max: 5 },
    comments: { type: String },
    reflectionNotes: { type: String },
});
const ManagerReviewSchema = new Schema({
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date, default: Date.now },
    approvalStatus: {
        type: String,
        enum: ["pending", "approved", "needs_action", "revision_requested"],
        default: "pending",
    },
    performanceRating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
});
const EmployeeMilestoneSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    templateId: { type: Schema.Types.ObjectId, required: true, ref: "MilestoneTemplate" },
    employeeId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    assignedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    milestoneTitle: { type: String, required: true },
    milestoneCode: { type: String },
    targetDay: { type: Number, enum: [30, 60, 90, 180], required: true },
    dueDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ["pending", "in_review", "pending_manager_review", "completed", "approved", "revision_requested", "overdue"],
        default: "pending",
    },
    employeeRating: { type: Number, min: 1, max: 5 },
    submittedAt: { type: Date },
    comments: { type: String },
    managerRating: { type: Number, min: 1, max: 5 },
    managerFeedback: { type: String },
    evaluatedAt: { type: Date },
    goalsProgress: [
        {
            goalTitle: { type: String, required: true },
            completed: { type: Boolean, default: false },
            completedAt: { type: Date },
        },
    ],
    employeeSelfCheck: { type: EmployeeSelfCheckSchema },
    managerReview: { type: ManagerReviewSchema },
    sla: {
        reviewDeadline: { type: Date },
        reminderSentCount: { type: Number, default: 0 },
        lastReminderSentAt: { type: Date },
        delegatedToUserId: { type: Schema.Types.ObjectId, ref: "User" },
        autoApprovalEligible: { type: Boolean, default: true },
        escalationState: {
            type: String,
            enum: ["normal", "reminded", "escalated", "auto_approved"],
            default: "normal",
        },
        blockersReported: { type: Boolean, default: false },
    },
    aiSummary: { type: String },
    approvedBy: { type: Schema.Types.Mixed },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});
EmployeeMilestoneSchema.index({ organizationId: 1, employeeId: 1, status: 1 });
EmployeeMilestoneSchema.index({ organizationId: 1, targetDay: 1 });
EmployeeMilestoneSchema.index({ organizationId: 1, milestoneCode: 1 });
EmployeeMilestoneSchema.index({ status: 1, "sla.reviewDeadline": 1 });
export const EmployeeMilestone = mongoose.model("EmployeeMilestone", EmployeeMilestoneSchema);
export const MilestonePlan = EmployeeMilestone;
export default EmployeeMilestone;
