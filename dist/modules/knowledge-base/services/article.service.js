import AppError from "../../../common/errors/app-error.js";
import mongoose from "mongoose";
import KnowledgeIndexingService from "./knowledge-indexing.service.js";
export class KnowledgeBaseService {
    repository;
    indexingService;
    constructor(repository) {
        this.repository = repository;
        this.indexingService = new KnowledgeIndexingService();
    }
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "")
            .replace(/--+/g, "-");
    }
    generateKeywords(title, summary, tags) {
        const words = `${title} ${summary || ""} ${(tags || []).join(" ")}`
            .toLowerCase()
            .split(/[^a-z0-9]/)
            .filter((w) => w.length > 2);
        return Array.from(new Set(words));
    }
    async getArticle(id, orgId, userContext) {
        const article = await this.repository.findByIdAndOrg(id, orgId, userContext);
        if (!article) {
            throw new AppError(404, "NOT_FOUND", "Article not found or access denied");
        }
        // Trigger asynchronous view count increment
        this.repository.incrementViews(article._id).catch(() => undefined);
        return article;
    }
    async listArticles(filter, userContext, pagination) {
        return this.repository.find(filter, userContext, pagination);
    }
    async createArticle(orgId, articleData, userId) {
        const slug = this.slugify(articleData.title) + "-" + Math.random().toString(36).substring(2, 6);
        const searchKeywords = this.generateKeywords(articleData.title, articleData.summary, articleData.tags);
        // Convert visibility references to ObjectIds
        const visibility = {
            access: articleData.visibility?.access || "all",
            departments: articleData.visibility?.departments?.map((d) => new mongoose.Types.ObjectId(d)),
            teams: articleData.visibility?.teams?.map((t) => new mongoose.Types.ObjectId(t)),
            users: articleData.visibility?.users?.map((u) => new mongoose.Types.ObjectId(u)),
        };
        // Convert attachments
        const attachments = articleData.attachments?.map((a) => ({
            _id: new mongoose.Types.ObjectId(),
            title: a.title,
            uploadId: new mongoose.Types.ObjectId(a.uploadId),
            downloadable: a.downloadable ?? true,
        })) || [];
        const newArticle = {
            organizationId: new mongoose.Types.ObjectId(orgId),
            title: articleData.title,
            slug,
            summary: articleData.summary,
            content: {
                blocks: articleData.content?.blocks?.map((b, index) => ({
                    _id: new mongoose.Types.ObjectId(),
                    type: b.type,
                    content: b.content,
                    uploadId: b.uploadId ? new mongoose.Types.ObjectId(b.uploadId) : undefined,
                    embedUrl: b.embedUrl,
                    order: b.order ?? index,
                })) || [],
            },
            categoryId: articleData.categoryId ? new mongoose.Types.ObjectId(articleData.categoryId) : undefined,
            tags: articleData.tags || [],
            visibility,
            attachments,
            publishing: {
                status: articleData.status === "published" ? "published" : "draft",
                publishedAt: articleData.status === "published" ? new Date() : undefined,
                version: 1,
            },
            searchKeywords,
            createdBy: new mongoose.Types.ObjectId(userId),
            isDeleted: false,
        };
        const created = await this.repository.create(newArticle);
        if (created.publishing?.status === "published") {
            this.indexingService.indexArticle(created).catch(() => undefined);
        }
        return created;
    }
    async updateArticle(id, orgId, updateData, userId, userContext) {
        // Check ownership/permissions
        const article = await this.repository.findByIdAndOrg(id, orgId, userContext);
        if (!article) {
            throw new AppError(404, "NOT_FOUND", "Article not found or access denied");
        }
        if (updateData.title && updateData.title !== article.title) {
            updateData.slug = this.slugify(updateData.title) + "-" + Math.random().toString(36).substring(2, 6);
        }
        updateData.searchKeywords = this.generateKeywords(updateData.title || article.title, updateData.summary || article.summary, updateData.tags || article.tags);
        // Map visibility ObjectIds if provided
        if (updateData.visibility) {
            updateData.visibility = {
                access: updateData.visibility.access || "all",
                departments: updateData.visibility.departments?.map((d) => new mongoose.Types.ObjectId(d)),
                teams: updateData.visibility.teams?.map((t) => new mongoose.Types.ObjectId(t)),
                users: updateData.visibility.users?.map((u) => new mongoose.Types.ObjectId(u)),
            };
        }
        // Map content blocks
        if (updateData.content?.blocks) {
            updateData.content.blocks = updateData.content.blocks.map((b, index) => ({
                _id: b._id ? new mongoose.Types.ObjectId(b._id) : new mongoose.Types.ObjectId(),
                type: b.type,
                content: b.content,
                uploadId: b.uploadId ? new mongoose.Types.ObjectId(b.uploadId) : undefined,
                embedUrl: b.embedUrl,
                order: b.order ?? index,
            }));
        }
        // Map attachments
        if (updateData.attachments) {
            updateData.attachments = updateData.attachments.map((a) => ({
                _id: a._id ? new mongoose.Types.ObjectId(a._id) : new mongoose.Types.ObjectId(),
                title: a.title,
                uploadId: new mongoose.Types.ObjectId(a.uploadId),
                downloadable: a.downloadable ?? true,
            }));
        }
        updateData.updatedBy = new mongoose.Types.ObjectId(userId);
        const updated = await this.repository.update(id, updateData);
        if (updated) {
            if (updated.publishing?.status === "published") {
                this.indexingService.indexArticle(updated).catch(() => undefined);
            }
            else {
                this.indexingService.deindexArticle(orgId, id).catch(() => undefined);
            }
        }
        return updated;
    }
    async deleteArticle(id, orgId, userId, userContext) {
        await this.getArticle(id, orgId, userContext);
        const deleted = await this.repository.softDelete(id, userId);
        this.indexingService.deindexArticle(orgId, id).catch(() => undefined);
        return deleted;
    }
    async publishArticle(id, orgId, userId, userContext) {
        const article = await this.getArticle(id, orgId, userContext);
        const version = article.publishing.status === "published"
            ? article.publishing.version + 1
            : article.publishing.version;
        const publishing = {
            status: "published",
            publishedAt: new Date(),
            version,
        };
        const published = await this.repository.update(id, {
            publishing,
            updatedBy: new mongoose.Types.ObjectId(userId),
        });
        if (published) {
            this.indexingService.indexArticle(published).catch(() => undefined);
        }
        return published;
    }
    async archiveArticle(id, orgId, userId, userContext) {
        await this.getArticle(id, orgId, userContext);
        const publishing = {
            status: "archived",
            version: 1,
        };
        const archived = await this.repository.update(id, {
            publishing,
            updatedBy: new mongoose.Types.ObjectId(userId),
        });
        this.indexingService.deindexArticle(orgId, id).catch(() => undefined);
        return archived;
    }
    async getPopularArticles(orgId, userContext, limit = 5) {
        const filter = { organizationId: orgId, status: "published" };
        const pagination = {
            page: 1,
            limit,
            sortBy: "analytics.views",
            sortOrder: "desc",
        };
        const result = await this.repository.find(filter, userContext, pagination);
        return result.articles;
    }
}
export default KnowledgeBaseService;
