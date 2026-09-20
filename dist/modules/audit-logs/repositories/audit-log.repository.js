import { AuditLog } from "../models/audit-log.model.js";
import mongoose from "mongoose";
export class AuditLogRepository {
    async create(auditLogData) {
        const log = new AuditLog(auditLogData);
        return log.save();
    }
    async findById(id, orgId) {
        return AuditLog.findOne({ _id: id, organizationId: orgId });
    }
    async find(filter, pagination) {
        const query = {
            organizationId: new mongoose.Types.ObjectId(filter.organizationId),
        };
        if (filter.actorUserId) {
            query.actorUserId = new mongoose.Types.ObjectId(filter.actorUserId);
        }
        if (filter.eventCategory) {
            query.eventCategory = filter.eventCategory;
        }
        if (filter.eventType) {
            query.eventType = filter.eventType;
        }
        if (filter.resourceType) {
            query.resourceType = filter.resourceType;
        }
        if (filter.resourceId) {
            query.resourceId = new mongoose.Types.ObjectId(filter.resourceId);
        }
        if (filter.severity) {
            query.severity = filter.severity;
        }
        if (filter.startDate || filter.endDate) {
            query.createdAt = {};
            if (filter.startDate) {
                query.createdAt.$gte = filter.startDate;
            }
            if (filter.endDate) {
                query.createdAt.$lte = filter.endDate;
            }
        }
        const total = await AuditLog.countDocuments(query);
        const page = Math.max(1, pagination.page);
        const limit = Math.max(1, pagination.limit);
        const skip = (page - 1) * limit;
        const logs = await AuditLog.find(query)
            .populate("actorUserId", "profile")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return { logs, total };
    }
}
export default AuditLogRepository;
