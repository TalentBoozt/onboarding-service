import { Article } from "../models/article.model.js";
import mongoose from "mongoose";
export class KnowledgeBaseRepository {
    buildVisibilityFilter(user) {
        // Owners and Admins bypass visibility restrictions
        if (user.role === "owner" || user.role === "admin") {
            return {};
        }
        const conditions = [{ "visibility.access": "all" }];
        if (user.departmentId) {
            conditions.push({
                "visibility.access": "department",
                "visibility.departments": new mongoose.Types.ObjectId(user.departmentId),
            });
        }
        if (user.teamId) {
            conditions.push({
                "visibility.access": "team",
                "visibility.teams": new mongoose.Types.ObjectId(user.teamId),
            });
        }
        conditions.push({
            "visibility.access": "custom",
            "visibility.users": new mongoose.Types.ObjectId(user.userId),
        });
        return { $or: conditions };
    }
    async findById(id) {
        return Article.findOne({ _id: id, isDeleted: false });
    }
    async findByIdAndOrg(id, orgId, userContext) {
        const query = {
            _id: id,
            organizationId: orgId,
            isDeleted: false,
        };
        if (userContext) {
            const visibilityFilter = this.buildVisibilityFilter(userContext);
            Object.assign(query, visibilityFilter);
            if (userContext.role === "employee" || userContext.role === "manager") {
                query["publishing.status"] = "published";
            }
        }
        return Article.findOne(query);
    }
    async find(filter, userContext, pagination) {
        const query = {
            organizationId: filter.organizationId,
            isDeleted: false,
        };
        if (userContext.role === "employee" || userContext.role === "manager") {
            query["publishing.status"] = "published";
        }
        else if (filter.status) {
            query["publishing.status"] = filter.status;
        }
        if (filter.categoryId) {
            query.categoryId = new mongoose.Types.ObjectId(filter.categoryId);
        }
        if (filter.tags && filter.tags.length > 0) {
            query.tags = { $in: filter.tags };
        }
        // Apply visibility filter
        const visibilityFilter = this.buildVisibilityFilter(userContext);
        Object.assign(query, visibilityFilter);
        // Apply real-time search if query exists
        if (filter.search && filter.search.trim()) {
            const escaped = filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = new RegExp(escaped, "i");
            const searchConditions = [
                { title: searchRegex },
                { summary: searchRegex },
                { tags: searchRegex },
                { "content.blocks.content": searchRegex },
                { searchKeywords: searchRegex },
            ];
            if (query.$or) {
                query.$and = [
                    { $or: query.$or },
                    { $or: searchConditions },
                ];
                delete query.$or;
            }
            else {
                query.$or = searchConditions;
            }
        }
        const total = await Article.countDocuments(query);
        const page = Math.max(1, pagination.page);
        const limit = Math.max(1, pagination.limit);
        const skip = (page - 1) * limit;
        const sortField = pagination.sortBy || "createdAt";
        const sortOrder = pagination.sortOrder === "asc" ? 1 : -1;
        const sortOption = { [sortField]: sortOrder };
        const articles = await Article.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);
        return { articles, total };
    }
    async create(articleData) {
        const article = new Article(articleData);
        return article.save();
    }
    async update(id, updateData) {
        return Article.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: updateData }, { new: true });
    }
    async softDelete(id, deletedBy) {
        return Article.findOneAndUpdate({ _id: id, isDeleted: false }, {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                updatedBy: new mongoose.Types.ObjectId(deletedBy),
            },
        }, { new: true });
    }
    async incrementViews(id) {
        await Article.updateOne({ _id: id }, {
            $inc: { "analytics.views": 1 },
            $set: { "analytics.lastViewedAt": new Date() },
        });
    }
}
export default KnowledgeBaseRepository;
