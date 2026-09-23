import { Schema } from "mongoose";
import { getDemoConnection } from "../database/demo-connection.js";
const DemoEmailLogSchema = new Schema({
    demoTenantId: { type: Schema.Types.ObjectId, ref: "DemoTenant" },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    htmlContent: { type: String, required: true },
    sourceEvent: { type: String, default: "notification" },
    sentAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: "sentAt", updatedAt: false } });
DemoEmailLogSchema.index({ demoTenantId: 1, sentAt: -1 });
export function getDemoEmailLogModel() {
    const conn = getDemoConnection();
    if (conn.models.DemoEmailLog) {
        return conn.models.DemoEmailLog;
    }
    return conn.model("DemoEmailLog", DemoEmailLogSchema);
}
