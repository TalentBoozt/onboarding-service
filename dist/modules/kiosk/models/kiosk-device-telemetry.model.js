import mongoose, { Schema } from "mongoose";
const KioskDeviceTelemetrySchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    deviceId: {
        type: Schema.Types.ObjectId,
        ref: "KioskDevice",
        required: true,
        index: true
    },
    hardwareGuid: {
        type: String,
        required: true,
        index: true
    },
    batteryLevel: { type: Number, min: 0, max: 100 },
    isCharging: { type: Boolean },
    storageUsedBytes: { type: Number, min: 0 },
    storageFreeBytes: { type: Number, min: 0 },
    storageTotalBytes: { type: Number, min: 0 },
    networkLatencyMs: { type: Number, min: 0 },
    screenResolution: { type: String },
    orientation: { type: String },
    appVersion: { type: String },
    contentVersion: { type: Number, default: 1 },
    ipAddress: { type: String },
    recordedAt: { type: Date, default: Date.now },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false,
    collection: "kiosk_device_telemetry"
});
// TTL index for automatic 30-day purging
KioskDeviceTelemetrySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
// Compound indexes for diagnostic inspection & fleet dashboards
KioskDeviceTelemetrySchema.index({ organizationId: 1, deviceId: 1, createdAt: -1 });
KioskDeviceTelemetrySchema.index({ hardwareGuid: 1, createdAt: -1 });
KioskDeviceTelemetrySchema.index({ organizationId: 1, createdAt: -1 });
export const KioskDeviceTelemetryModel = mongoose.model("KioskDeviceTelemetry", KioskDeviceTelemetrySchema);
export default KioskDeviceTelemetryModel;
