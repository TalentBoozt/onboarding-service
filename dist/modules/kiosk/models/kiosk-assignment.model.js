import mongoose, { Schema } from "mongoose";
import { ASSIGNMENT_TARGET_TYPES, } from "../types/assignment.types.js";
const KioskAssignmentSchedulingSchema = new Schema({
    enabled: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    startTimeUtc: { type: String, trim: true },
    endTimeUtc: { type: String, trim: true },
}, { _id: false });
const KioskDeviceAssignmentSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },
    targetType: {
        type: String,
        required: true,
        enum: ASSIGNMENT_TARGET_TYPES,
        trim: true,
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    journeyId: {
        type: Schema.Types.ObjectId,
        ref: "KioskJourney",
        required: true,
    },
    priority: {
        type: Number,
        default: 0,
        min: 0,
    },
    isMandatory: {
        type: Boolean,
        default: false,
    },
    scheduling: {
        type: KioskAssignmentSchedulingSchema,
        default: () => ({ enabled: false }),
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});
// Compound indexes per ADR-001, ADR-005, and performance specs
KioskDeviceAssignmentSchema.index({
    organizationId: 1,
    targetType: 1,
    targetId: 1,
    isActive: 1,
});
KioskDeviceAssignmentSchema.index({
    organizationId: 1,
    journeyId: 1,
});
KioskDeviceAssignmentSchema.index({
    organizationId: 1,
    targetId: 1,
});
export const KioskDeviceAssignmentModel = mongoose.model("KioskDeviceAssignment", KioskDeviceAssignmentSchema);
export default KioskDeviceAssignmentModel;
