import mongoose, { Schema } from "mongoose";
import { KIOSK_SESSION_STATUSES, SUPERVISOR_WITNESS_METHODS, } from "../types/session.types.js";
const SupervisorWitnessSchema = new Schema({
    supervisorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    witnessedAt: { type: Date, default: Date.now, required: true },
    method: {
        type: String,
        enum: SUPERVISOR_WITNESS_METHODS,
        required: true,
        default: "pin",
    },
}, { _id: false });
const KioskSessionSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },
    deviceId: {
        type: Schema.Types.ObjectId,
        ref: "KioskDevice",
        required: true,
        index: true,
    },
    journeyId: {
        type: Schema.Types.ObjectId,
        ref: "KioskJourney",
        required: true,
        index: true,
    },
    journeyVersionId: {
        type: Schema.Types.ObjectId,
        ref: "KioskJourneyVersion",
    },
    versionNumber: {
        type: Number,
        required: true,
        default: 1,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },
    sessionToken: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        required: true,
        enum: KIOSK_SESSION_STATUSES,
        default: "active",
        index: true,
    },
    startedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    completedAt: {
        type: Date,
    },
    durationSeconds: {
        type: Number,
        default: 0,
        min: 0,
    },
    currentStepId: {
        type: String,
        trim: true,
        default: "",
    },
    completedStepIds: {
        type: [String],
        default: [],
    },
    ppeItemsVerified: {
        type: [String],
        default: [],
    },
    quizScore: {
        type: Number,
        min: 0,
        max: 100,
    },
    supervisorWitness: {
        type: SupervisorWitnessSchema,
    },
    verificationChecksum: {
        type: String,
        trim: true,
    },
    isOfflineSync: {
        type: Boolean,
        default: false,
    },
    clientSessionId: {
        type: String,
        trim: true,
        sparse: true,
        index: true,
    },
}, {
    timestamps: true,
});
// Compound indexes per ADR-001, ADR-007, and K-FND-003 requirements
KioskSessionSchema.index({ organizationId: 1, userId: 1, status: 1 });
KioskSessionSchema.index({ organizationId: 1, deviceId: 1, startedAt: -1 });
KioskSessionSchema.index({ organizationId: 1, journeyId: 1, status: 1 });
KioskSessionSchema.index({ sessionToken: 1 }, { unique: true, sparse: true });
KioskSessionSchema.index({ organizationId: 1, clientSessionId: 1 }, { unique: true, partialFilterExpression: { clientSessionId: { $type: "string" } } });
export const KioskSessionModel = mongoose.model("KioskSession", KioskSessionSchema);
export default KioskSessionModel;
