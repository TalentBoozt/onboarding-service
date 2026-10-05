import mongoose, { Schema } from "mongoose";
const EmergencyContactSchema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String }
}, { _id: false });
const KioskEmergencySchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Organization",
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ["fire", "gas_leak", "toxic_spill", "weather", "security_threat", "general"]
    },
    severity: {
        type: String,
        required: true,
        enum: ["warning", "critical", "evacuate"],
        default: "evacuate"
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    evacuationMapUrl: { type: String },
    primaryExit: { type: String, default: "North Emergency Stairwell A" },
    secondaryExit: { type: String, default: "East Ground Level Exit 2" },
    assemblyZone: { type: String, default: "Muster Point B - Main Parking Lot" },
    emergencyContacts: [EmergencyContactSchema],
    soundSiren: { type: Boolean, default: true },
    siteId: { type: String },
    deviceIds: [{ type: String }],
    isActive: { type: Boolean, required: true, default: true, index: true },
    triggeredBy: { type: String },
    clearedBy: { type: String },
    triggeredAt: { type: Date, required: true, default: Date.now },
    clearedAt: { type: Date }
}, {
    timestamps: true
});
// Compound index for active emergency lookups per organization
KioskEmergencySchema.index({ organizationId: 1, isActive: 1 });
export const KioskEmergencyModel = mongoose.model("KioskEmergency", KioskEmergencySchema);
export default KioskEmergencyModel;
