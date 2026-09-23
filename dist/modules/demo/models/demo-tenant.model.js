import { Schema } from "mongoose";
import { getDemoConnection } from "../database/demo-connection.js";
const DemoTenantSchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    domain: { type: String, required: true },
    contactEmail: { type: String, required: true },
    status: {
        type: String,
        enum: ["ACTIVE", "EXPIRING", "EXPIRED", "SUSPENDED", "REVOKED", "RESETTING"],
        default: "ACTIVE",
    },
    expiresAt: { type: Date, required: true },
    entitlementPackage: {
        type: String,
        enum: ["STANDARD", "EXECUTIVE", "FULL_SUITE", "CUSTOM"],
        default: "STANDARD",
    },
    allowedFeatures: { type: [String], default: [] },
    riskLevel: {
        type: String,
        enum: ["NORMAL", "SUSPICIOUS", "HIGH_RISK", "BLOCKED"],
        default: "NORMAL",
    },
    sessionLimit: { type: Number, default: 1 },
}, { timestamps: true });
export function getDemoTenantModel() {
    const conn = getDemoConnection();
    if (conn.models.DemoTenant) {
        return conn.models.DemoTenant;
    }
    return conn.model("DemoTenant", DemoTenantSchema);
}
