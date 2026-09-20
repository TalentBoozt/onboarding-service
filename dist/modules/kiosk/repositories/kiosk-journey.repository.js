import mongoose from "mongoose";
import { KioskJourneyModel } from "../models/kiosk-journey.model.js";
export class KioskJourneyRepository {
    async findById(id) {
        const isObjectId = typeof id === "string" ? mongoose.Types.ObjectId.isValid(id) && id.length === 24 : id instanceof mongoose.Types.ObjectId;
        const query = isObjectId ? { _id: id, isDeleted: false } : { journeyCode: id, isDeleted: false };
        return KioskJourneyModel.findOne(query);
    }
    async findByIdAndOrg(id, orgId) {
        const isObjectId = typeof id === "string" ? mongoose.Types.ObjectId.isValid(id) && id.length === 24 : id instanceof mongoose.Types.ObjectId;
        const isOrgObjectId = typeof orgId === "string" ? mongoose.Types.ObjectId.isValid(orgId) && orgId.length === 24 : orgId instanceof mongoose.Types.ObjectId;
        const orgQuery = isOrgObjectId ? orgId : (await mongoose.model("Organization").findOne({ slug: orgId }))?._id || orgId;
        const query = isObjectId
            ? { _id: id, organizationId: orgQuery, isDeleted: false }
            : { journeyCode: id, organizationId: orgQuery, isDeleted: false };
        return KioskJourneyModel.findOne(query);
    }
    async find(filter, pagination) {
        const query = {
            organizationId: filter.organizationId,
            isDeleted: false
        };
        if (filter.status) {
            query["publishing.status"] = filter.status;
        }
        if (filter.search) {
            query.title = new RegExp(filter.search, "i");
        }
        const total = await KioskJourneyModel.countDocuments(query);
        const page = Math.max(1, pagination.page);
        const limit = Math.max(1, pagination.limit);
        const skip = (page - 1) * limit;
        const sortField = pagination.sortBy || "createdAt";
        const sortOrder = pagination.sortOrder === "asc" ? 1 : -1;
        const journeys = await KioskJourneyModel.find(query)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);
        return { journeys, total };
    }
    async create(journeyData) {
        const journey = new KioskJourneyModel(journeyData);
        return journey.save();
    }
    async update(id, updateData, updatedBy) {
        return KioskJourneyModel.findOneAndUpdate({ _id: id, isDeleted: false }, {
            $set: {
                ...updateData,
                updatedBy: new mongoose.Types.ObjectId(updatedBy)
            }
        }, { new: true });
    }
    async softDelete(id, deletedBy) {
        return KioskJourneyModel.findOneAndUpdate({ _id: id, isDeleted: false }, {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                updatedBy: new mongoose.Types.ObjectId(deletedBy)
            }
        }, { new: true });
    }
    async publish(id, publishedBy) {
        const journey = await this.findById(id);
        if (!journey)
            return null;
        const currentVersion = journey.publishing.version;
        const nextVersion = journey.publishing.status === "published" ? currentVersion : currentVersion + 1;
        return KioskJourneyModel.findOneAndUpdate({ _id: id, isDeleted: false }, {
            $set: {
                "publishing.status": "published",
                "publishing.version": nextVersion,
                "publishing.publishedAt": new Date(),
                updatedBy: new mongoose.Types.ObjectId(publishedBy)
            }
        }, { new: true });
    }
}
export default KioskJourneyRepository;
