import mongoose, { Schema } from "mongoose";
import { KIOSK_DEVICE_STATUSES } from "../constants/device.constants.js";
const KioskTelemetrySchema = new Schema({
    batteryLevel: { type: Number, min: 0, max: 1 },
    isCharging: { type: Boolean },
    storageUsedBytes: { type: Number },
    storageFreeBytes: { type: Number },
    appVersion: { type: String },
    networkLatencyMs: { type: Number }
}, { _id: false });
const KioskDeviceSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    deviceId: { type: String, required: true, trim: true },
    hardwareGuid: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: KIOSK_DEVICE_STATUSES,
        default: "offline"
    },
    paired: { type: Boolean, default: true },
    tokenRef: { type: String },
    lastSeen: { type: Date, required: true, default: Date.now },
    lastHeartbeatAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    macAddress: { type: String },
    pairedAt: { type: Date },
    currentJourneyId: { type: Schema.Types.ObjectId, ref: "KioskJourney" },
    currentContentVersion: { type: Number, required: true, default: 0 },
    telemetry: { type: KioskTelemetrySchema, required: true, default: {} }
}, {
    timestamps: true
});
// Indexes
KioskDeviceSchema.index({ deviceId: 1 }, { unique: true });
KioskDeviceSchema.index({ organizationId: 1 });
KioskDeviceSchema.index({ status: 1 });
KioskDeviceSchema.index({ lastSeen: -1 });
// Compound indexes
KioskDeviceSchema.index({ organizationId: 1, status: 1 });
KioskDeviceSchema.index({ organizationId: 1, currentJourneyId: 1 });
export const KioskDeviceModel = mongoose.model("KioskDevice", KioskDeviceSchema);
export default KioskDeviceModel;
