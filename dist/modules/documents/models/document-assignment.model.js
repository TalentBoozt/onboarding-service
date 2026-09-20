import mongoose, { Schema } from "mongoose";
const SignatureDataSchema = new Schema({
    type: { type: String, enum: ["draw", "type"], required: true },
    signatureDataUrl: { type: String },
    signerName: { type: String, required: true },
    signedAt: { type: Date, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    sha256Hash: { type: String, required: true },
    supervisorWitnessId: { type: Schema.Types.ObjectId, ref: "User" },
    kioskDeviceId: { type: Schema.Types.ObjectId, ref: "KioskDevice" },
    kioskSessionTokenRef: { type: String },
    notes: { type: String },
});
const DocumentAuditEntrySchema = new Schema({
    action: { type: String, enum: ["assigned", "viewed", "signed", "declined", "revoked"], required: true },
    performedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    timestamp: { type: Date, required: true, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
    details: { type: String },
});
const DocumentAssignmentSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    templateId: { type: Schema.Types.ObjectId, required: true, ref: "DocumentTemplate" },
    templateTitle: { type: String, required: true },
    templateVersion: { type: Number, required: true, default: 1 },
    employeeId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    assignedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    status: {
        type: String,
        enum: ["pending", "viewed", "signed", "declined", "expired", "revoked"],
        default: "pending",
    },
    assignedAt: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    signedAt: { type: Date },
    declinedAt: { type: Date },
    declineReason: { type: String },
    renderedContent: { type: String },
    signatureData: { type: SignatureDataSchema },
    complianceRetention: { type: Boolean, default: false },
    archivedAt: { type: Date },
    revokedAt: { type: Date },
    revokedReason: { type: String },
    auditTrail: { type: [DocumentAuditEntrySchema], default: [] },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});
DocumentAssignmentSchema.index({ organizationId: 1, employeeId: 1, status: 1 });
DocumentAssignmentSchema.index({ organizationId: 1, templateId: 1 });
export const DocumentAssignment = mongoose.model("DocumentAssignment", DocumentAssignmentSchema);
export default DocumentAssignment;
