import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const TTL_PLANS = [
    {
        collectionName: "system_jobs",
        indexKey: { completedAt: 1 },
        indexOptions: {
            name: "system_jobs_completedAt_ttl",
            expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
            partialFilterExpression: { status: "completed" },
        },
    },
    {
        collectionName: "outbox_events",
        indexKey: { publishedAt: 1 },
        indexOptions: {
            name: "outbox_events_published_ttl",
            expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
            partialFilterExpression: { status: "published" },
        },
    },
    {
        collectionName: "alerts",
        indexKey: { resolvedAt: 1 },
        indexOptions: {
            name: "alerts_resolvedAt_ttl",
            expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
            partialFilterExpression: { status: { $in: ["resolved", "dismissed"] } },
        },
    },
    {
        collectionName: "workflow_execution_logs",
        indexKey: { createdAt: 1 },
        indexOptions: {
            name: "workflow_execution_logs_createdAt_ttl",
            expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
        },
    },
    {
        collectionName: "hriswebhooklogs",
        indexKey: { createdAt: 1 },
        indexOptions: {
            name: "hriswebhooklogs_createdAt_ttl",
            expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
        },
    },
    {
        collectionName: "synclogs",
        indexKey: { createdAt: 1 },
        indexOptions: {
            name: "synclogs_createdAt_ttl",
            expireAfterSeconds: 60 * 24 * 60 * 60, // 60 days
        },
    },
];
export async function applyRetentionTTLIndexes(dryRun = false) {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri)
        throw new Error("Missing MONGODB_URI");
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    if (!db)
        throw new Error("No database handle");
    console.log(`Connected to database: ${mongoose.connection.name}`);
    console.log(`Mode: ${dryRun ? "DRY-RUN (No changes applied)" : "EXECUTION"}\n`);
    for (const plan of TTL_PLANS) {
        const coll = db.collection(plan.collectionName);
        const existingIndexes = await coll.indexes();
        const alreadyExists = existingIndexes.some((idx) => idx.name === plan.indexOptions.name ||
            (idx.expireAfterSeconds !== undefined && JSON.stringify(idx.key) === JSON.stringify(plan.indexKey)));
        if (alreadyExists) {
            console.log(`[SKIP] Collection '${plan.collectionName}': TTL index '${plan.indexOptions.name}' already exists.`);
            continue;
        }
        if (dryRun) {
            console.log(`[PLAN] Would create TTL index on '${plan.collectionName}':`, plan.indexOptions);
        }
        else {
            console.log(`[APPLY] Creating TTL index on '${plan.collectionName}'...`);
            await coll.createIndex(plan.indexKey, plan.indexOptions);
            console.log(`[DONE] Created TTL index '${plan.indexOptions.name}' on '${plan.collectionName}'.`);
        }
    }
    await mongoose.disconnect();
    console.log("\nMigration completed.");
}
// Support CLI execution
if (process.argv[1] && process.argv[1].endsWith("apply_retention_ttl_indexes.ts")) {
    const isDryRun = process.argv.includes("--dry-run");
    applyRetentionTTLIndexes(isDryRun).catch(console.error);
}
