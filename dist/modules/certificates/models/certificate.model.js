import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
export function generateCertificateSignature(certificateNumber, employeeId, organizationId, issueDate) {
    const dateStr = typeof issueDate === "string" ? issueDate : issueDate.toISOString();
    const raw = `${certificateNumber}:${employeeId}:${organizationId}:${dateStr}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
}
export function verifyCertificateSignature(certificateNumber, employeeId, organizationId, issueDate, signature) {
    return generateCertificateSignature(certificateNumber, employeeId, organizationId, issueDate) === signature;
}
const CertificateSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    assignmentId: {
        type: Schema.Types.ObjectId,
        ref: "EmployeeAssignment",
        index: true,
    },
    certificateNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
    },
    recipientName: {
        type: String,
        required: true,
        trim: true,
    },
    organizationName: {
        type: String,
        required: true,
        trim: true,
    },
    journeyTitle: {
        type: String,
        required: true,
        trim: true,
    },
    issueDate: {
        type: Date,
        default: Date.now,
    },
    completionDate: {
        type: Date,
        default: Date.now,
    },
    sha256Signature: {
        type: String,
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ["active", "revoked"],
        default: "active",
        index: true,
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
export const Certificate = mongoose.models.Certificate ||
    mongoose.model("Certificate", CertificateSchema);
