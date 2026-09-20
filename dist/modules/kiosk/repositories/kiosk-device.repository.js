import mongoose from "mongoose";
import { KioskDeviceModel } from "../models/kiosk-device.model.js";
export class KioskDeviceRepository {
    async findById(id) {
        return KioskDeviceModel.findById(id);
    }
    async findByFingerprint(deviceId) {
        return KioskDeviceModel.findOne({ deviceId });
    }
    async findByIdAndOrg(id, orgId) {
        return KioskDeviceModel.findOne({ _id: id, organizationId: orgId });
    }
    async find(filter, pagination) {
        const query = {
            organizationId: filter.organizationId
        };
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
        return KioskDeviceModel.findByIdAndUpdate(id, {
            $set: {
                status: "online",
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
        return KioskDeviceModel.findByIdAndUpdate(id, {
            $set: {
                currentJourneyId: journeyId ? new mongoose.Types.ObjectId(journeyId) : undefined
            }
        }, { new: true });
    }
}
export default KioskDeviceRepository;
