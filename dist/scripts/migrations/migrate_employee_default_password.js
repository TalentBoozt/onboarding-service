/**
 * Migration Script: Migrate Employee Default Temporary Password
 * From: "Welcome@2026!" -> To: "Password@123!"
 *
 * Scoped safely ONLY to unactivated accounts with security.mustChangePassword === true
 * and whose current password hash matches "Welcome@2026!".
 */
import mongoose from "mongoose";
import { dbConfig } from "../../config/index.js";
import { User } from "../../modules/auth/models/user.model.js";
import { hashPassword, verifyPassword } from "../../utils/crypto.js";
async function migrateEmployeeDefaultPasswords() {
    console.log("🚀 Starting Employee Default Password Migration...");
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(dbConfig.uri);
    console.log("✅ Connected to MongoDB.");
    const targetUsers = await User.find({
        "security.mustChangePassword": true,
        isDeleted: { $ne: true },
    }).select("_id auth profile employment security");
    console.log(`🔍 Discovered ${targetUsers.length} total user accounts with mustChangePassword = true.`);
    const oldDefaultPassword = "Welcome@2026!";
    const newDefaultPassword = "Password@123!";
    const newHash = await hashPassword(newDefaultPassword);
    let migratedCount = 0;
    let alreadyNewCount = 0;
    let skippedCustomCount = 0;
    for (const user of targetUsers) {
        if (!user.auth?.passwordHash) {
            skippedCustomCount++;
            continue;
        }
        const isOldDefault = await verifyPassword(oldDefaultPassword, user.auth.passwordHash);
        if (isOldDefault) {
            user.auth.passwordHash = newHash;
            await user.save();
            migratedCount++;
            console.log(`  -> [MIGRATED] User ID: ${user._id} | Email: ${user.auth.email || "N/A"} | EmpId: ${user.employment?.employeeId || "N/A"}`);
        }
        else {
            const isNewDefault = await verifyPassword(newDefaultPassword, user.auth.passwordHash);
            if (isNewDefault) {
                alreadyNewCount++;
            }
            else {
                skippedCustomCount++;
            }
        }
    }
    console.log("\n================ MIGRATION SUMMARY ================");
    console.log(`✅ Successfully Migrated to "${newDefaultPassword}": ${migratedCount}`);
    console.log(`ℹ️ Already on "${newDefaultPassword}": ${alreadyNewCount}`);
    console.log(`🔒 Skipped (Custom/Individual Temporary Passwords): ${skippedCustomCount}`);
    console.log("===================================================\n");
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB. Migration completed successfully.");
}
migrateEmployeeDefaultPasswords().catch((err) => {
    console.error("❌ Migration failed with error:", err);
    process.exit(1);
});
