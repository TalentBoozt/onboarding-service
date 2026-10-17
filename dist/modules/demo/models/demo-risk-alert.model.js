import { Schema } from "mongoose";
import { getDemoConnection } from "../database/demo-connection.js";
const DemoRiskAlertSchema = new Schema({
    demoTenantId: { type: Schema.Types.ObjectId, ref: "DemoTenant" },
    demoUserId: { type: Schema.Types.ObjectId, ref: "DemoUser" },
    sessionId: { type: String },
    alertType: {
        type: String,
        enum: ["CONCURRENT_SESSIONS", "RAPID_IP_CHANGE", "CONCURRENT_SESSION_ANOMALY", "RESTRICTED_ACCESS_ATTEMPT", "EXCESSIVE_REQUESTS", "HONEYPOT_TRIGGERED"],
        required: true,
    },
    severity: {
        type: String,
        enum: ["MEDIUM", "HIGH", "CRITICAL"],
        default: "MEDIUM",
    },
    status: {
        type: String,
        enum: ["OPEN", "REVIEWED", "RESOLVED", "DISMISSED"],
        default: "OPEN",
    },
    signals: { type: [String], default: [] },
    details: { type: Schema.Types.Mixed, default: {} },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String },
}, { timestamps: true });
DemoRiskAlertSchema.index({ status: 1, severity: 1, createdAt: -1 });
export function getDemoRiskAlertModel() {
    const conn = getDemoConnection();
    if (conn.models.DemoRiskAlert) {
        return conn.models.DemoRiskAlert;
    }
    return conn.model("DemoRiskAlert", DemoRiskAlertSchema);
}
