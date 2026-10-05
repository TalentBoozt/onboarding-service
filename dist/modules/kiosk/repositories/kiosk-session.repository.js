import mongoose from "mongoose";
import { KioskSessionModel, } from "../models/kiosk-session.model.js";
export class KioskSessionRepository {
    /**
     * Insert a new session document with status 'active' and empty completedStepIds.
     */
    async createSession(data) {
        const sessionData = {
            status: "active",
            completedStepIds: [],
            ppeItemsVerified: [],
            durationSeconds: 0,
            startedAt: new Date(),
            ...data,
        };
        const session = new KioskSessionModel(sessionData);
        return session.save();
    }
    /**
     * Atomically advance step progress, add stepId to completed list (without duplicates),
     * and increment elapsed duration.
     */
    async updateStepProgress(sessionId, stepId, durationIncrement = 0, orgId, completedStepIds, durationSeconds) {
        const isObjectId = mongoose.Types.ObjectId.isValid(sessionId.toString());
        const query = isObjectId
            ? { _id: new mongoose.Types.ObjectId(sessionId.toString()) }
            : { sessionToken: sessionId.toString() };
        if (orgId) {
            query.organizationId = new mongoose.Types.ObjectId(orgId.toString());
        }
        const incValue = Math.max(0, Number(durationIncrement) || 0);
        const updateDoc = {};
        const setFields = {};
        if (stepId) {
            setFields.currentStepId = stepId;
        }
        if (typeof durationSeconds === "number" && durationSeconds >= 0) {
            setFields.durationSeconds = durationSeconds;
        }
        if (Object.keys(setFields).length > 0) {
            updateDoc.$set = setFields;
        }
        const stepsToAdd = [
            ...(completedStepIds || (stepId ? [stepId] : []))
        ];
        if (stepsToAdd.length > 0) {
            updateDoc.$addToSet = { completedStepIds: { $each: stepsToAdd } };
        }
        if (incValue > 0 && typeof durationSeconds !== "number") {
            updateDoc.$inc = { durationSeconds: incValue };
        }
        return KioskSessionModel.findOneAndUpdate(query, updateDoc, { new: true, runValidators: true });
    }
    /**
     * Atomically transition session status (e.g. to 'completed', 'awaiting_supervisor', 'aborted', 'timed_out').
     * If transitioning to 'completed', completedAt is automatically populated.
     */
    async transitionStatus(sessionId, newStatus, metadata, orgId) {
        const isObjectId = mongoose.Types.ObjectId.isValid(sessionId.toString());
        const query = isObjectId
            ? { _id: new mongoose.Types.ObjectId(sessionId.toString()) }
            : { sessionToken: sessionId.toString() };
        if (orgId) {
            query.organizationId = new mongoose.Types.ObjectId(orgId.toString());
        }
        const setFields = {
            status: newStatus,
        };
        if (newStatus === "completed") {
            setFields.completedAt = metadata?.completedAt || new Date();
        }
        if (metadata?.supervisorWitness) {
            setFields.supervisorWitness = metadata.supervisorWitness;
        }
        if (metadata?.verificationChecksum) {
            setFields.verificationChecksum = metadata.verificationChecksum;
        }
        if (typeof metadata?.quizScore === "number") {
            setFields.quizScore = metadata.quizScore;
        }
        if (metadata?.ppeItemsVerified) {
            setFields.ppeItemsVerified = metadata.ppeItemsVerified;
        }
        if (metadata?.completedStepIds && Array.isArray(metadata.completedStepIds)) {
            setFields.completedStepIds = metadata.completedStepIds;
        }
        if (typeof metadata?.durationSeconds === "number") {
            setFields.durationSeconds = metadata.durationSeconds;
        }
        const updateDoc = {
            $set: setFields,
        };
        if (metadata?.durationIncrement && Number(metadata.durationIncrement) > 0) {
            updateDoc.$inc = { durationSeconds: Number(metadata.durationIncrement) };
        }
        return KioskSessionModel.findOneAndUpdate(query, updateDoc, {
            new: true,
            runValidators: true,
        });
    }
    /**
     * Find a session by ID within a tenant organization.
     */
    async findByIdAndOrg(sessionId, orgId) {
        const orgObjectId = new mongoose.Types.ObjectId(orgId.toString());
        const isObjectId = mongoose.Types.ObjectId.isValid(sessionId.toString());
        if (isObjectId) {
            return KioskSessionModel.findOne({
                _id: new mongoose.Types.ObjectId(sessionId.toString()),
                organizationId: orgObjectId,
            });
        }
        // Fallback: search by sessionToken
        return KioskSessionModel.findOne({
            sessionToken: sessionId.toString(),
            organizationId: orgObjectId,
        });
    }
    /**
     * Fast lookup by ephemeral sessionToken (indexed sparse unique).
     */
    async findByToken(sessionToken) {
        return KioskSessionModel.findOne({ sessionToken });
    }
    /**
     * Find a session by ID or sessionToken.
     */
    async findById(sessionId) {
        const isObjectId = mongoose.Types.ObjectId.isValid(sessionId.toString());
        if (isObjectId) {
            return KioskSessionModel.findById(sessionId);
        }
        return KioskSessionModel.findOne({ sessionToken: sessionId.toString() });
    }
    /**
     * Find active sessions on a specific physical device.
     */
    async findActiveByDevice(deviceId, orgId) {
        return KioskSessionModel.find({
            organizationId: new mongoose.Types.ObjectId(orgId.toString()),
            deviceId: new mongoose.Types.ObjectId(deviceId.toString()),
            status: "active",
        }).sort({ startedAt: -1 });
    }
}
export default KioskSessionRepository;
