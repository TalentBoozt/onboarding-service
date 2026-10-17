import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
export async function backfillNotificationExpiresAt(batchSize = 1000, dryRun = false) {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri)
        throw new Error("Missing MONGODB_URI");
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    const coll = db.collection("notifications");
    const filter = { expiresAt: { $exists: false } };
    const totalNeedingBackfill = await coll.countDocuments(filter);
    console.log(`Found ${totalNeedingBackfill} notification documents without 'expiresAt'.`);
    if (totalNeedingBackfill === 0 || dryRun) {
        if (dryRun)
            console.log("DRY-RUN mode: No documents were updated.");
        await mongoose.disconnect();
        return totalNeedingBackfill;
    }
    let processed = 0;
    while (true) {
        const docs = await coll.find(filter).limit(batchSize).project({ _id: 1, createdAt: 1, isRead: 1, readAt: 1, priority: 1 }).toArray();
        if (docs.length === 0)
            break;
        const bulkOps = docs.map((doc) => {
            let days = 30;
            if (doc.priority === "critical")
                days = 180;
            else if (doc.priority === "high")
                days = 90;
            const baseDate = doc.isRead && doc.readAt ? new Date(doc.readAt) : new Date(doc.createdAt || Date.now());
            const expiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
            return {
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: { expiresAt } },
                },
            };
        });
        await coll.bulkWrite(bulkOps);
        processed += docs.length;
        console.log(`Updated ${processed} / ${totalNeedingBackfill} notifications with computed expiresAt...`);
        // Yield
        await new Promise((r) => setTimeout(r, 50));
    }
    console.log(`Successfully backfilled ${processed} notification documents.`);
    await mongoose.disconnect();
    return processed;
}
if (process.argv[1] && process.argv[1].endsWith("backfill_notification_expires_at.ts")) {
    const isDryRun = process.argv.includes("--dry-run");
    backfillNotificationExpiresAt(1000, isDryRun).catch(console.error);
}
