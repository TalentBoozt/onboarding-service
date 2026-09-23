import { Schema } from "mongoose";
import { getDemoConnection } from "../database/demo-connection.js";
const DemoSessionSchema = new Schema({
    sessionId: { type: String, required: true, unique: true },
    demoUserId: { type: Schema.Types.ObjectId, ref: "DemoUser", required: true },
    demoTenantId: { type: Schema.Types.ObjectId, ref: "DemoTenant", required: true },
    tokenVersion: { type: Number, default: 1 },
    ipAddress: { type: String },
    deviceInfo: { type: String },
    userAgent: { type: String },
    isValid: { type: Boolean, default: true },
    riskStatus: {
        type: String,
        enum: ["NORMAL", "SUSPICIOUS", "HIGH_RISK", "BLOCKED"],
        default: "NORMAL",
    },
    suspiciousReason: { type: String },
    lastActivityAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });
DemoSessionSchema.index({ demoUserId: 1, isValid: 1 });
DemoSessionSchema.index({ demoTenantId: 1, isValid: 1 });
DemoSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export function getDemoSessionModel() {
    const conn = getDemoConnection();
    if (conn.models.DemoSession) {
        return conn.models.DemoSession;
    }
    return conn.model("DemoSession", DemoSessionSchema);
}
