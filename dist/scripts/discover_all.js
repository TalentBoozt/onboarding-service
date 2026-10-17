import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const serverSrcDir = path.resolve(__dirname, "..");
function findModelFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findModelFiles(filePath));
        }
        else if (file.endsWith(".model.ts")) {
            results.push(filePath);
        }
    }
    return results;
}
async function main() {
    const files = findModelFiles(serverSrcDir);
    console.log(`=== FOUND ${files.length} MODEL FILES ===`);
    const codeModels = [];
    for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        // Look for Schema collection option or mongoose.model third param
        const schemaCollectionMatch = content.match(/new Schema(?:<[^>]+>)?\s*\(\s*\{[\s\S]*?\}\s*,\s*\{[^}]*collection\s*:\s*["']([^"']+)["']/);
        const modelMatch = content.match(/mongoose\.model(?:<[^>]+>)?\(\s*["']([^"']+)["'](?:\s*,\s*[^,\)]+)?(?:\s*,\s*["']([^"']+)["'])?/);
        const ttlMatch = content.match(/expireAfterSeconds\s*:\s*([0-9\s*+]+)/);
        let modelName = modelMatch ? modelMatch[1] : "Unknown";
        let collName = "";
        if (modelMatch && modelMatch[2]) {
            collName = modelMatch[2];
        }
        else if (schemaCollectionMatch) {
            collName = schemaCollectionMatch[1];
        }
        else if (modelMatch) {
            collName = mongoose.pluralize() ? (mongoose.pluralize()(modelName)) : modelName.toLowerCase() + "s";
        }
        codeModels.push({
            file: path.relative(path.resolve(__dirname, "../../.."), file),
            modelName,
            collectionName: collName,
            ttlIndex: ttlMatch ? ttlMatch[1].trim() : undefined,
        });
    }
    // Connect to database if MONGODB_URI is provided
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.log("No MONGODB_URI found in server/.env");
        return;
    }
    console.log("\n=== CONNECTING TO DATABASE (READ ONLY) ===");
    try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
        const db = mongoose.connection.db;
        if (!db) {
            console.log("No db handle available");
            return;
        }
        const dbName = mongoose.connection.name;
        console.log(`Connected to DB: ${dbName}`);
        const collections = await db.listCollections().toArray();
        console.log(`Total collections in DB: ${collections.length}`);
        const collStatsList = [];
        for (const c of collections) {
            const collName = c.name;
            const coll = db.collection(collName);
            let docCount = 0;
            let stats = {};
            try {
                docCount = await coll.estimatedDocumentCount();
            }
            catch (e) {
                try {
                    docCount = await coll.countDocuments();
                }
                catch (err) {
                    docCount = -1;
                }
            }
            let indexes = [];
            try {
                indexes = await coll.indexes();
            }
            catch (e) {
                indexes = [];
            }
            try {
                stats = await db.command({ collStats: collName });
            }
            catch (e) {
                stats = { error: e.message };
            }
            collStatsList.push({
                name: collName,
                docCount,
                size: stats.size || 0,
                storageSize: stats.storageSize || 0,
                totalIndexSize: stats.totalIndexSize || 0,
                avgObjSize: stats.avgObjSize || 0,
                indexesCount: indexes.length,
                indexes: indexes.map(idx => ({ name: idx.name, key: idx.key, expireAfterSeconds: idx.expireAfterSeconds })),
            });
        }
        // Sort by docCount descending
        collStatsList.sort((a, b) => b.docCount - a.docCount);
        console.log("\n=== COLLECTIONS IN DB (Sorted by docCount) ===");
        for (const s of collStatsList) {
            console.log(`${s.name.padEnd(35)} | Docs: ${s.docCount.toString().padStart(8)} | Size: ${(s.size / 1024 / 1024).toFixed(2).padStart(8)} MB | Storage: ${(s.storageSize / 1024 / 1024).toFixed(2).padStart(8)} MB | Indexes: ${s.indexesCount} (${(s.totalIndexSize / 1024 / 1024).toFixed(2)} MB)`);
        }
        const outputData = {
            dbName,
            totalCollections: collStatsList.length,
            collections: collStatsList,
            codeModels,
        };
        const outPath = path.resolve(__dirname, "../../../scratch/db_discovery.json");
        fs.writeFileSync(outPath, JSON.stringify(outputData, null, 2));
        console.log(`\nSaved discovery data to ${outPath}`);
        await mongoose.disconnect();
    }
    catch (err) {
        console.error("Database connection failed or error occurred:", err.message);
    }
}
main().catch(console.error);
