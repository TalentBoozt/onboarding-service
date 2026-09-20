import AppError from "../../../common/errors/app-error.js";
import mongoose from "mongoose";
export class QuickLinkService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getQuickLinks(orgId) {
        return this.repository.findByOrg(orgId);
    }
    async createQuickLink(orgId, data) {
        return this.repository.create({
            organizationId: new mongoose.Types.ObjectId(orgId),
            title: data.title,
            url: data.url,
            icon: data.icon || "Link",
            order: data.order ?? 0,
            isDeleted: false,
        });
    }
    async updateQuickLink(id, orgId, data) {
        const quickLink = await this.repository.findByIdAndOrg(id, orgId);
        if (!quickLink) {
            throw new AppError(404, "NOT_FOUND", "Quick link not found");
        }
        const updated = await this.repository.update(id, data);
        if (!updated) {
            throw new AppError(404, "NOT_FOUND", "Quick link not found");
        }
        return updated;
    }
    async deleteQuickLink(id, orgId) {
        const quickLink = await this.repository.findByIdAndOrg(id, orgId);
        if (!quickLink) {
            throw new AppError(404, "NOT_FOUND", "Quick link not found");
        }
        await this.repository.softDelete(id);
    }
}
export default QuickLinkService;
