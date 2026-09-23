import { Schema } from "mongoose";
import { getDemoConnection } from "../database/demo-connection.js";
const DemoUserSchema = new Schema({
    demoTenantId: { type: Schema.Types.ObjectId, ref: "DemoTenant", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    fullName: { type: String, required: true },
    role: {
        type: String,
        enum: ["demo_admin", "demo_manager", "demo_employee"],
        default: "demo_employee",
    },
    passwordHash: { type: String, required: true },
    department: { type: String, default: "Engineering" },
    jobTitle: { type: String, default: "Software Engineer" },
    status: {
        type: String,
        enum: ["ACTIVE", "SUSPENDED", "REVOKED", "EXPIRED"],
        default: "ACTIVE",
    },
    expiresAt: { type: Date, required: true },
    lastLoginAt: { type: Date },
}, { timestamps: true });
DemoUserSchema.index({ demoTenantId: 1, email: 1 }, { unique: true });
export function getDemoUserModel() {
    const conn = getDemoConnection();
    if (conn.models.DemoUser) {
        return conn.models.DemoUser;
    }
    return conn.model("DemoUser", DemoUserSchema);
}
