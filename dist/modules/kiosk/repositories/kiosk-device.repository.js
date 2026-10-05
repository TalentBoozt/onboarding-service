import mongoose from "mongoose";
import { KioskDeviceModel } from "../models/kiosk-device.model.js";
export class KioskDeviceRepository {
    async findById(id) {
        if (mongoose.Types.ObjectId.isValid(id.toString())) {
            const byId = await KioskDeviceModel.findById(id);
            if (byId)
                return byId;
        }
        return KioskDeviceModel.findOne({
            $or: [{ deviceId: id.toString() }, { hardwareGuid: id.toString() }]
        });
    }
    async findByFingerprint(deviceId) {
        return KioskDeviceModel.findOne({
            $or: [{ deviceId }, { hardwareGuid: deviceId }]
        });
    }
    async findByIdAndOrg(id, orgId) {
        const isObjectId = typeof id === "object" || (mongoose.Types.ObjectId.isValid(id.toString()) && id.toString().length === 24);
        const orgObjId = typeof orgId === "object" || (mongoose.Types.ObjectId.isValid(orgId.toString()) && orgId.toString().length === 24)
            ? new mongoose.Types.ObjectId(orgId.toString())
            : orgId;
        const query = {
            $or: [
                ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(id.toString()) }] : []),
                { deviceId: id.toString() }
            ],
            organizationId: orgObjId,
            isDeleted: { $ne: true }
        };
        return KioskDeviceModel.findOne(query);
    }
    async find(filter, pagination) {
        const orgId = filter.organizationId
            ? (typeof filter.organizationId === "object" || (mongoose.Types.ObjectId.isValid(filter.organizationId.toString()) && filter.organizationId.toString().length === 24)
                ? new mongoose.Types.ObjectId(filter.organizationId.toString())
                : filter.organizationId)
            : undefined;
        const query = {
            isDeleted: { $ne: true }
        };
        if (orgId) {
            query.organizationId = orgId;
        }
        if (filter.status) {
            query.status = filter.status;
        }
        const total = await KioskDeviceModel.countDocuments(query);
        const page = Math.max(1, pagination.page);
        const limit = Math.max(1, pagination.limit);
        const skip = (page - 1) * limit;
        const sortField = pagination.sortBy || "lastSeen";
        const sortOrder = pagination.sortOrder === "asc" ? 1 : -1;
        const devices = await KioskDeviceModel.find(query)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);
        return { devices, total };
    }
    async register(deviceData) {
        if (!deviceData.hardwareGuid && deviceData.deviceId) {
            deviceData.hardwareGuid = deviceData.deviceId;
        }
        if (deviceData.deviceId) {
            const existing = await KioskDeviceModel.findOne({ deviceId: deviceData.deviceId });
            if (existing) {
                const updated = await KioskDeviceModel.findByIdAndUpdate(existing._id, { $set: deviceData }, { new: true });
                return updated;
            }
        }
        const device = new KioskDeviceModel(deviceData);
        return device.save();
    }
    async heartbeat(id, contentVersion, telemetry) {
        const existing = await KioskDeviceModel.findById(id).select("status");
        const newStatus = existing?.status === "maintenance" ? "maintenance" : "online";
        return KioskDeviceModel.findByIdAndUpdate(id, {
            $set: {
                status: newStatus,
                lastSeen: new Date(),
                lastHeartbeatAt: new Date(),
                currentContentVersion: contentVersion,
                telemetry
            }
        }, { new: true });
    }
    async updateStatus(id, status) {
        return KioskDeviceModel.findByIdAndUpdate(id, {
            $set: { status }
        }, { new: true });
    }
    async pairJourney(id, journeyId) {
        const update = journeyId
            ? { $set: { currentJourneyId: new mongoose.Types.ObjectId(journeyId) } }
            : { $unset: { currentJourneyId: 1 } };
        return KioskDeviceModel.findByIdAndUpdate(id, update, { new: true });
    }
    async revoke(idOrDeviceId, orgId, userId) {
        const isObjectId = typeof idOrDeviceId === "object" || (mongoose.Types.ObjectId.isValid(idOrDeviceId) && idOrDeviceId.length === 24);
        const query = {
            $or: [
                ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(idOrDeviceId.toString()) }] : []),
                { deviceId: idOrDeviceId.toString() }
            ],
            organizationId: new mongoose.Types.ObjectId(orgId.toString())
        };
        const update = {
            $set: {
                status: "decommissioned",
                paired: false,
                tokenRef: "",
                isDeleted: true,
                deletedAt: new Date(),
                ...(userId && mongoose.Types.ObjectId.isValid(userId) ? { deletedBy: new mongoose.Types.ObjectId(userId) } : {})
            }
        };
        return KioskDeviceModel.findOneAndUpdate(query, update, { new: true });
    }
}
export default KioskDeviceRepository;
