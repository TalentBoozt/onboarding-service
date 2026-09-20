import mongoose, { Schema } from "mongoose";
const SessionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    tokenVersion: { type: Number, default: 1, required: true },
    deviceInfo: { type: String },
    ipAddress: { type: String },
    isValid: { type: Boolean, default: true, required: true },
    revokedReason: { type: String },
    lastActivityAt: { type: Date, default: Date.now, required: true },
    expiresAt: { type: Date, required: true },
}, {
    timestamps: true,
});
// TTL Index for automatic collection cleanup of expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1 });
SessionSchema.index({ organizationId: 1 });
SessionSchema.index({ organizationId: 1, isValid: 1 });
export const Session = mongoose.model("Session", SessionSchema);
export default Session;
