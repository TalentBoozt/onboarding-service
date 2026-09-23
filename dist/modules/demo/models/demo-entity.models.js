import { Schema } from "mongoose";
import { getDemoConnection } from "../database/demo-connection.js";
const DemoJourneySchema = new Schema({
    demoTenantId: { type: Schema.Types.ObjectId, ref: "DemoTenant", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: "Engineering" },
    durationDays: { type: Number, default: 30 },
    status: { type: String, enum: ["published", "draft"], default: "published" },
    modulesCount: { type: Number, default: 5 },
}, { timestamps: true, strict: false });
const DemoTaskSchema = new Schema({
    demoTenantId: { type: Schema.Types.ObjectId, ref: "DemoTenant", required: true },
    demoUserId: { type: Schema.Types.ObjectId, ref: "DemoUser" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        default: "hr_compliance",
    },
    status: { type: String, default: "pending" },
    priority: { type: String, default: "normal" },
    stage: { type: String, default: "day_1" },
    dueDays: { type: Number, default: 7 },
}, { timestamps: true, strict: false });
const DemoDocumentSchema = new Schema({
    demoTenantId: { type: Schema.Types.ObjectId, ref: "DemoTenant", required: true },
    title: { type: String, required: true },
    documentType: {
        type: String,
        required: true,
    },
    status: { type: String, default: "pending_signature" },
    signedAt: { type: Date },
    signeeName: { type: String },
}, { timestamps: true, strict: false });
export function getDemoJourneyModel() {
    const conn = getDemoConnection();
    return conn.models.DemoJourney || conn.model("DemoJourney", DemoJourneySchema);
}
export function getDemoTaskModel() {
    const conn = getDemoConnection();
    return conn.models.DemoTask || conn.model("DemoTask", DemoTaskSchema);
}
export function getDemoDocumentModel() {
    const conn = getDemoConnection();
    return conn.models.DemoDocument || conn.model("DemoDocument", DemoDocumentSchema);
}
const DemoKBArticleSchema = new Schema({
    demoTenantId: { type: Schema.Types.ObjectId, ref: "DemoTenant", required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    category: { type: String, default: "General" },
    content: { type: String, required: true },
    readTimeMinutes: { type: Number, default: 3 },
}, { timestamps: true, strict: false });
export function getDemoKBArticleModel() {
    const conn = getDemoConnection();
    return conn.models.DemoKBArticle || conn.model("DemoKBArticle", DemoKBArticleSchema);
}
const DemoMilestoneSchema = new Schema({
    demoTenantId: { type: Schema.Types.ObjectId, ref: "DemoTenant", required: true },
    demoUserId: { type: Schema.Types.ObjectId, ref: "DemoUser" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    points: { type: Number, default: 100 },
    badgeIcon: { type: String, default: "award" },
    status: { type: String, default: "unlocked" },
    awardedAt: { type: Date, default: Date.now },
}, { timestamps: true, strict: false });
export function getDemoMilestoneModel() {
    const conn = getDemoConnection();
    return conn.models.DemoMilestone || conn.model("DemoMilestone", DemoMilestoneSchema);
}
