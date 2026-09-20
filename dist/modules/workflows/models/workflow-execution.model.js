import mongoose, { Schema } from "mongoose";
const WorkflowStepResultSchema = new Schema({
    stepIndex: { type: Number, required: true },
    actionType: { type: String, required: true },
    status: {
        type: String,
        enum: ["success", "failed", "skipped", "delayed"],
        required: true,
    },
    resultMessage: { type: String },
    outputData: { type: Schema.Types.Mixed },
    executedAt: { type: Date, default: Date.now },
}, { _id: false });
const WorkflowExecutionLogSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    workflowRuleId: { type: Schema.Types.ObjectId, ref: "WorkflowRule", required: true },
    triggerEvent: { type: String, required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
        type: String,
        enum: ["success", "partial_failure", "failed", "pending_delay", "paused_delay"],
        default: "success",
    },
    conditionsEvaluated: { type: Boolean, default: true },
    stepResults: [WorkflowStepResultSchema],
    nextStepIndex: { type: Number },
    resumeAt: { type: Date },
    errorDetails: { type: String },
    executedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
}, { timestamps: true });
// Indexes
WorkflowExecutionLogSchema.index({ organizationId: 1, workflowRuleId: 1 });
WorkflowExecutionLogSchema.index({ organizationId: 1, targetUserId: 1 });
WorkflowExecutionLogSchema.index({ organizationId: 1, status: 1 });
export const WorkflowExecutionLog = mongoose.model("WorkflowExecutionLog", WorkflowExecutionLogSchema, "workflow_execution_logs");
export default WorkflowExecutionLog;
