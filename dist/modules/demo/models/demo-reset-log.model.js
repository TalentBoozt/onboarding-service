import { Schema } from "mongoose";
import { getDemoConnection } from "../database/demo-connection.js";
const DemoResetLogSchema = new Schema({
    performedBy: { type: String, required: true },
    actorRole: { type: String, default: "super_admin" },
    status: { type: String, enum: ["SUCCESS", "FAILED"], required: true },
    durationMs: { type: Number, default: 0 },
    stepsCompleted: { type: [String], default: [] },
    seedStats: {
        tenantsCreated: { type: Number, default: 0 },
        usersCreated: { type: Number, default: 0 },
        journeysCreated: { type: Number, default: 0 },
        tasksCreated: { type: Number, default: 0 },
        documentsCreated: { type: Number, default: 0 },
    },
    errorMessage: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });
DemoResetLogSchema.index({ createdAt: -1 });
export function getDemoResetLogModel() {
    const conn = getDemoConnection();
    if (conn.models.DemoResetLog) {
        return conn.models.DemoResetLog;
    }
    return conn.model("DemoResetLog", DemoResetLogSchema);
}
