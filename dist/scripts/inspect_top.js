import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function inspectTop() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    console.log("=== INSPECTING notifications ===");
    const notifColl = db.collection("notifications");
    const totalNotifs = await notifColl.countDocuments();
    const notifsWithExpiresAt = await notifColl.countDocuments({ expiresAt: { $exists: true, $ne: null } });
    const notifsRead = await notifColl.countDocuments({ isRead: true });
    const notifsUnread = await notifColl.countDocuments({ isRead: false });
    console.log({ totalNotifs, notifsWithExpiresAt, notifsRead, notifsUnread });
    console.log("\n=== INSPECTING system_jobs ===");
    const jobsColl = db.collection("system_jobs");
    const totalJobs = await jobsColl.countDocuments();
    const jobsByStatus = await jobsColl.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();
    const oldestJob = await jobsColl.find({}).sort({ createdAt: 1 }).limit(1).project({ createdAt: 1, name: 1, status: 1 }).toArray();
    const newestJob = await jobsColl.find({}).sort({ createdAt: -1 }).limit(1).project({ createdAt: 1, name: 1, status: 1 }).toArray();
    console.log({ totalJobs, jobsByStatus, oldestJob, newestJob });
    console.log("\n=== INSPECTING auditLogs ===");
    const auditColl = db.collection("auditLogs");
    const totalAudit = await auditColl.countDocuments();
    const auditOldest = await auditColl.find({}).sort({ createdAt: 1 }).limit(1).project({ createdAt: 1, eventType: 1 }).toArray();
    console.log({ totalAudit, auditOldest });
    console.log("\n=== INSPECTING outbox_events ===");
    const outboxColl = db.collection("outbox_events");
    const totalOutbox = await outboxColl.countDocuments();
    const outboxByStatus = await outboxColl.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();
    console.log({ totalOutbox, outboxByStatus });
    console.log("\n=== INSPECTING kiosk_device_telemetry ===");
    const telemetryColl = db.collection("kiosk_device_telemetry");
    const totalTelemetry = await telemetryColl.countDocuments();
    const telemetryOldest = await telemetryColl.find({}).sort({ createdAt: 1 }).limit(1).project({ createdAt: 1, timestamp: 1 }).toArray();
    console.log({ totalTelemetry, telemetryOldest });
    await mongoose.disconnect();
}
inspectTop().catch(console.error);
