import { Schema } from "mongoose";
import { getDemoConnection } from "../database/demo-connection.js";
const DemoActivityLogSchema = new Schema({
    demoTenantId: { type: Schema.Types.ObjectId, ref: "DemoTenant" },
    demoUserId: { type: Schema.Types.ObjectId, ref: "DemoUser" },
    action: { type: String, required: true },
    category: {
        type: String,
        enum: ["AUTH", "NAVIGATION", "EXPORT", "SECURITY", "SETTINGS", "SYSTEM"],
        default: "NAVIGATION",
    },
    description: { type: String, required: true },
    endpoint: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
    severity: {
        type: String,
        enum: ["info", "warning", "critical"],
        default: "info",
    },
}, { timestamps: { createdAt: true, updatedAt: false } });
DemoActivityLogSchema.index({ demoTenantId: 1, createdAt: -1 });
DemoActivityLogSchema.index({ demoUserId: 1, createdAt: -1 });
DemoActivityLogSchema.index({ severity: 1, createdAt: -1 });
export function getDemoActivityLogModel() {
    const conn = getDemoConnection();
    if (conn.models.DemoActivityLog) {
        return conn.models.DemoActivityLog;
    }
    return conn.model("DemoActivityLog", DemoActivityLogSchema);
}
