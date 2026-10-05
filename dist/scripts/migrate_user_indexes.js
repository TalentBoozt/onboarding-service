import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../modules/auth/models/user.model.js';
dotenv.config();
async function runMigration() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talnova';
    console.log(`Connecting to MongoDB at ${uri}...`);
    await mongoose.connect(uri);
    const userCollection = mongoose.connection.collection('users');
    const existingIndexes = await userCollection.indexes();
    console.log(`Initial index count: ${existingIndexes.length}`);
    // Drop legacy non-partial / non-sparse indexes that block null/missing emails
    const legacyIndexesToDrop = ['auth.email_1', 'organizationId_1_auth.email_1'];
    for (const idxName of legacyIndexesToDrop) {
        const found = existingIndexes.find(i => i.name === idxName);
        if (found) {
            console.log(`Dropping legacy index: ${idxName}...`);
            await userCollection.dropIndex(idxName);
            console.log(`Successfully dropped ${idxName}`);
        }
    }
    // Sync new indexes from Mongoose schema
    console.log('Syncing newly defined partial & sparse compound indexes...');
    await User.syncIndexes();
    const updatedIndexes = await userCollection.indexes();
    console.log('Updated users collection indexes:');
    for (const idx of updatedIndexes) {
        console.log(` - ${idx.name}: ${JSON.stringify(idx.key)} (partial: ${Boolean(idx.partialFilterExpression)}, unique: ${Boolean(idx.unique)})`);
    }
    // Verification Step: Test inserting users without email addresses
    console.log('\n--- VERIFICATION STEP: Multi-Identifier Validation & Auto-Provisioning ---');
    const testOrgId = new mongoose.Types.ObjectId();
    // Test User A: Worker with Employee ID only (no email)
    const workerA = new User({
        organizationId: testOrgId,
        auth: {
            passwordHash: 'dummyHash123',
        },
        profile: {
            firstName: 'Ground',
            lastName: 'WorkerA',
        },
        employment: {
            employeeId: 'EMP-GROUND-001',
            employmentType: 'full_time',
            status: 'active',
        },
    });
    await workerA.save();
    console.log(`Worker A saved successfully! ID: ${workerA._id}, employeeId: ${workerA.employment.employeeId}, email: ${workerA.auth?.email ?? 'none'}`);
    // Test User B: Worker with Phone only (no email, no employeeId -> should auto-generate EMP-XXXXXX)
    const workerB = new User({
        organizationId: testOrgId,
        auth: {
            passwordHash: 'dummyHash456',
        },
        profile: {
            firstName: 'Ground',
            lastName: 'WorkerB',
            phone: '+15550199283',
        },
    });
    await workerB.save();
    console.log(`Worker B saved successfully! ID: ${workerB._id}, employeeId: ${workerB.employment.employeeId}, phone: ${workerB.profile.phone}, email: ${workerB.auth?.email ?? 'none'}`);
    if (!workerB.employment.employeeId || !workerB.employment.employeeId.startsWith('EMP-')) {
        throw new Error('Worker B did not receive an auto-generated EMP-XXXXXX employeeId!');
    }
    console.log('Auto-generation of fallback Employee ID verified!');
    // Clean up test documents
    await User.deleteMany({ organizationId: testOrgId });
    console.log('Verification test records cleaned up successfully.');
    await mongoose.disconnect();
    console.log('Migration completed successfully!');
}
runMigration().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
