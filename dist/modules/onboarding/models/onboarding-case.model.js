import mongoose, { Schema } from "mongoose";
const TransitionSchema = new Schema({
    from: { type: String, required: false },
    to: { type: String, required: true },
    at: { type: Date, required: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
    reason: { type: String },
}, { _id: false });
const OnboardingCaseSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    source: { type: String, enum: ["invite", "bulk_import", "sso", "hris", "manual", "rehire"], required: true },
    idempotencyKey: { type: String, required: true, trim: true },
    state: {
        type: String,
        enum: ["created", "resolving", "provisioning", "provisioning_failed", "ready", "active", "paused", "ready_for_handover", "handover_pending", "completed", "archived", "cancelled"],
        required: true,
        default: "created",
    },
    stateReason: { type: String },
    transitions: { type: [TransitionSchema], default: [] },
    resolvedPlan: {
        planId: { type: String },
        version: { type: Number },
        resolvedAt: { type: Date },
        reason: { type: String },
    },
    failure: {
        resourceKey: { type: String },
        message: { type: String },
        attempts: { type: Number },
        lastAttemptAt: { type: Date },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
// One external source event may create exactly one active case for a tenant.
OnboardingCaseSchema.index({ organizationId: 1, idempotencyKey: 1 }, { unique: true });
OnboardingCaseSchema.index({ organizationId: 1, employeeId: 1, state: 1 });
export const OnboardingCase = mongoose.model("OnboardingCase", OnboardingCaseSchema, "onboarding_cases");
export default OnboardingCase;
