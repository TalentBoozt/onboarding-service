import { Journey } from "../models/journey.model.js";
import mongoose from "mongoose";
export class JourneyRepository {
    async findById(id) {
        return Journey.findOne({ _id: id, isDeleted: false })
            .populate("modules.lessons.contentBlocks.uploadId")
            .populate("modules.lessons.attachments.uploadId");
    }
    async findByIdAndOrg(id, orgId) {
        return Journey.findOne({ _id: id, organizationId: orgId, isDeleted: false })
            .populate("modules.lessons.contentBlocks.uploadId")
            .populate("modules.lessons.attachments.uploadId");
    }
    async find(filter, pagination) {
        const query = {
            organizationId: filter.organizationId,
            isDeleted: false,
        };
        if (filter.status) {
            query["publishing.status"] = filter.status;
        }
        if (filter.isPublic !== undefined) {
            query["audience.isPublic"] = filter.isPublic;
        }
        if (filter.category) {
            query.category = filter.category;
        }
        if (filter.tags && filter.tags.length > 0) {
            query.tags = { $in: filter.tags };
        }
        if (filter.search) {
            query.title = new RegExp(filter.search, "i");
        }
        const total = await Journey.countDocuments(query);
        const page = Math.max(1, pagination.page);
        const limit = Math.max(1, pagination.limit);
        const skip = (page - 1) * limit;
        const sortField = pagination.sortBy || "createdAt";
        const sortOrder = pagination.sortOrder === "asc" ? 1 : -1;
        const journeys = await Journey.find(query)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);
        return { journeys, total };
    }
    async create(journeyData) {
        const journey = new Journey(journeyData);
        return journey.save();
    }
    async update(id, updateData) {
        return Journey.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: updateData }, { new: true });
    }
    async softDelete(id, deletedBy) {
        return Journey.findOneAndUpdate({ _id: id, isDeleted: false }, {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                updatedBy: new mongoose.Types.ObjectId(deletedBy),
            },
        }, { new: true });
    }
    async duplicate(id, newTitle, newSlug, userId) {
        const original = await this.findById(id);
        if (!original)
            return null;
        const duplicateObj = original.toObject();
        delete duplicateObj._id;
        delete duplicateObj.createdAt;
        delete duplicateObj.updatedAt;
        duplicateObj.title = newTitle;
        duplicateObj.slug = newSlug;
        duplicateObj.publishing = {
            status: "draft",
            version: 1,
        };
        duplicateObj.analytics = {
            totalAssignments: 0,
            totalCompletions: 0,
            completionRate: 0,
            averageScore: 0,
            averageDurationMinutes: 0,
        };
        duplicateObj.createdBy = new mongoose.Types.ObjectId(userId);
        duplicateObj.updatedBy = undefined;
        // Reset module/lesson/question IDs to prevent collisions
        if (duplicateObj.modules) {
            for (const m of duplicateObj.modules) {
                m._id = new mongoose.Types.ObjectId();
                if (m.lessons) {
                    for (const l of m.lessons) {
                        l._id = new mongoose.Types.ObjectId();
                        if (l.contentBlocks) {
                            for (const cb of l.contentBlocks) {
                                cb._id = new mongoose.Types.ObjectId();
                            }
                        }
                        if (l.attachments) {
                            for (const att of l.attachments) {
                                att._id = new mongoose.Types.ObjectId();
                            }
                        }
                        if (l.quiz) {
                            l.quiz._id = new mongoose.Types.ObjectId();
                            if (l.quiz.questions) {
                                for (const q of l.quiz.questions) {
                                    q._id = new mongoose.Types.ObjectId();
                                    if (q.options) {
                                        for (const opt of q.options) {
                                            opt._id = new mongoose.Types.ObjectId();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return this.create(duplicateObj);
    }
}
export default JourneyRepository;
