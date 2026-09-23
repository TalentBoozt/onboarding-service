import mongoose, { Schema } from "mongoose";
const WorkflowConditionSchema = new Schema({
    field: {
        type: String,
        enum: ["department", "role", "jobTitle", "location", "employmentStatus"],
        required: true,
    },
    operator: {
        type: String,
        enum: ["equals", "not_equals", "in", "contains"],
        required: true,
    },
    value: { type: Schema.Types.Mixed, required: true },
}, { _id: false });
const WorkflowActionSchema = new Schema({
    type: {
        type: String,
        enum: ["assign_journey", "create_task", "send_notification", "trigger_buddy", "assign_document", "trigger_webhook", "delay", "assign_milestone", "assign_checklist"],
        required: true,
    },
    params: {
        journeyId: { type: String },
        taskTitle: { type: String },
        taskDescription: { type: String },
        taskCategory: {
            type: String,
            enum: ["it_setup", "hr_paperwork", "equipment", "training", "general"],
            default: "general",
        },
        taskStage: {
            type: String,
            enum: ["preboarding", "day_1", "week_1", "month_1", "custom"],
            default: "day_1",
        },
        taskPriority: {
            type: String,
            enum: ["low", "normal", "high", "critical"],
            default: "normal",
        },
        taskAssigneeRole: {
            type: String,
            enum: ["employee", "manager", "hr", "it", "it_admin", "hr_admin", "buddy"],
            default: "employee",
        },
        relativeOffsetDays: { type: Number, default: 7 },
        checklistTemplateId: { type: String },
        notificationTitle: { type: String },
        notificationMessage: { type: String },
        notificationChannel: { type: String, enum: ["in_app", "email"], default: "in_app" },
        documentTemplateId: { type: String },
        buddyUserId: { type: String },
        webhookUrl: { type: String },
        delayMinutes: { type: Number, default: 0 },
        templateId: { type: String },
        targetDay: { type: Number },
    },
}, { _id: false });
const WorkflowRuleSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    triggerType: {
        type: String,
        enum: ["user_created", "journey_completed", "task_completed", "stage_entered", "checkin_due", "milestone_completed"],
        required: true,
    },
    conditions: [WorkflowConditionSchema],
    actions: [WorkflowActionSchema],
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0, index: true },
    version: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });
// Indexes
WorkflowRuleSchema.index({ organizationId: 1, triggerType: 1, isActive: 1 });
WorkflowRuleSchema.index({ organizationId: 1, isDeleted: 1 });
export const WorkflowRule = mongoose.model("WorkflowRule", WorkflowRuleSchema, "workflow_rules");
export default WorkflowRule;
