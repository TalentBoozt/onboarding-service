import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const rawDiscoveryPath = path.resolve(__dirname, "../../../scratch/db_discovery.json");
const rawDiscovery = JSON.parse(fs.readFileSync(rawDiscoveryPath, "utf8"));
async function runDetailedAnalysis() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const detailedCollections = [];
    for (const collInfo of rawDiscovery.collections) {
        const collName = collInfo.name;
        const coll = db.collection(collName);
        // Sample 1 doc safely to examine fields
        const sampleDoc = await coll.findOne({});
        const sampleKeys = sampleDoc ? Object.keys(sampleDoc) : [];
        // Has orgId?
        const hasOrgId = sampleDoc ? ("organizationId" in sampleDoc || "organization" in sampleDoc) : false;
        const hasTimestamps = sampleDoc ? ("createdAt" in sampleDoc || "updatedAt" in sampleDoc) : false;
        const hasDeletedAt = sampleDoc ? ("deletedAt" in sampleDoc || "isDeleted" in sampleDoc) : false;
        const hasExpiresAt = sampleDoc ? ("expiresAt" in sampleDoc || "expireAt" in sampleDoc) : false;
        // Check codeModels for match
        const matchingCode = rawDiscovery.codeModels.filter((m) => m.collectionName === collName ||
            m.collectionName.toLowerCase() === collName.toLowerCase() ||
            collName.toLowerCase().includes(m.modelName.toLowerCase()));
        // Look for existing TTL index in collInfo.indexes
        const ttlIndex = collInfo.indexes.find((idx) => idx.expireAfterSeconds !== undefined);
        detailedCollections.push({
            collectionName: collName,
            docCount: collInfo.docCount,
            sizeBytes: collInfo.size,
            storageSizeBytes: collInfo.storageSize,
            totalIndexSizeBytes: collInfo.totalIndexSize,
            avgObjSizeBytes: collInfo.avgObjSize,
            indexesCount: collInfo.indexesCount,
            indexes: collInfo.indexes,
            ttlIndex: ttlIndex ? { name: ttlIndex.name, key: ttlIndex.key, expireAfterSeconds: ttlIndex.expireAfterSeconds } : null,
            sampleKeys,
            hasOrgId,
            hasTimestamps,
            hasDeletedAt,
            hasExpiresAt,
            codeModel: matchingCode[0] || null,
        });
    }
    // Write out comprehensive raw analysis
    const outPath = path.resolve(__dirname, "../../../scratch/detailed_collections.json");
    fs.writeFileSync(outPath, JSON.stringify(detailedCollections, null, 2));
    console.log(`Saved detailed analysis for ${detailedCollections.length} collections to ${outPath}`);
    await mongoose.disconnect();
}
runDetailedAnalysis().catch(console.error);
