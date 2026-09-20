import { Upload } from "../models/upload.model.js";
import mongoose from "mongoose";
export class UploadRepository {
    async findById(id) {
        return Upload.findOne({ _id: id, "lifecycle.status": { $ne: "deleted" } });
    }
    async findByIdAndOrg(id, orgId) {
        return Upload.findOne({
            _id: id,
            organizationId: orgId,
            "lifecycle.status": { $ne: "deleted" },
        });
    }
    async find(filter, pagination) {
        const query = {
            organizationId: filter.organizationId,
            "lifecycle.status": filter.status || { $ne: "deleted" },
        };
        if (filter.type) {
            query.type = filter.type;
        }
        if (filter.uploadedBy) {
            query["ownership.uploadedBy"] = new mongoose.Types.ObjectId(filter.uploadedBy);
        }
        const total = await Upload.countDocuments(query);
        const page = Math.max(1, pagination.page);
        const limit = Math.max(1, pagination.limit);
        const skip = (page - 1) * limit;
        const sortField = pagination.sortBy || "createdAt";
        const sortOrder = pagination.sortOrder === "asc" ? 1 : -1;
        const uploads = await Upload.find(query)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);
        return { uploads, total };
    }
    async create(uploadData) {
        const upload = new Upload(uploadData);
        return upload.save();
    }
    async update(id, updateData) {
        return Upload.findOneAndUpdate({ _id: id }, { $set: updateData }, { new: true });
    }
    async softDelete(id) {
        return Upload.findOneAndUpdate({ _id: id }, { $set: { "lifecycle.status": "deleted" } }, { new: true });
    }
    async incrementUsage(id, entityType, entityId) {
        return Upload.findOneAndUpdate({ _id: id }, {
            $inc: { "usage.usageCount": 1 },
            $set: {
                "usage.entityType": entityType,
                "usage.entityId": new mongoose.Types.ObjectId(entityId),
            },
        }, { new: true });
    }
}
export default UploadRepository;
