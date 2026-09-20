import mongoose from "mongoose";
export class KnowledgeBaseController {
    service;
    constructor(service) {
        this.service = service;
    }
    extractUserContext(request) {
        const user = request.user;
        if (!user) {
            return {
                userId: new mongoose.Types.ObjectId(),
                role: "employee",
            };
        }
        return {
            userId: user.userId,
            role: user.role,
            departmentId: user.departmentId,
            teamId: user.teamId,
        };
    }
    getArticle = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const userContext = this.extractUserContext(request);
        let orgId = user?.organizationId;
        if (!orgId) {
            const org = await mongoose.model("Organization").findOne({ isDeleted: false });
            orgId = org?._id;
        }
        const article = await this.service.getArticle(params.id, orgId, userContext);
        return reply.status(200).send({
            success: true,
            message: "Article retrieved successfully",
            data: article,
        });
    };
    listArticles = async (request, reply) => {
        const user = request.user;
        const query = request.query;
        const userContext = this.extractUserContext(request);
        let orgId = user?.organizationId;
        if (!orgId) {
            const org = await mongoose.model("Organization").findOne({ isDeleted: false });
            orgId = org?._id;
        }
        const filter = {
            organizationId: orgId,
            status: query.status,
            categoryId: query.categoryId,
            tags: query.tags ? (Array.isArray(query.tags) ? query.tags : [query.tags]) : undefined,
            search: query.search,
        };
        const pagination = {
            page: query.page ? parseInt(query.page, 10) : 1,
            limit: query.limit ? parseInt(query.limit, 10) : 20,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        };
        const result = await this.service.listArticles(filter, userContext, pagination);
        return reply.status(200).send({
            success: true,
            message: "Articles retrieved successfully",
            data: result.articles,
            meta: {
                total: result.total,
                page: pagination.page,
                limit: pagination.limit,
            },
        });
    };
    createArticle = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const article = await this.service.createArticle(user.organizationId, body, user.userId);
        return reply.status(201).send({
            success: true,
            message: "Article created successfully",
            data: article,
        });
    };
    updateArticle = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const userContext = this.extractUserContext(request);
        const article = await this.service.updateArticle(params.id, user.organizationId, request.body, user.userId, userContext);
        return reply.status(200).send({
            success: true,
            message: "Article updated successfully",
            data: article,
        });
    };
    deleteArticle = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const userContext = this.extractUserContext(request);
        await this.service.deleteArticle(params.id, user.organizationId, user.userId, userContext);
        return reply.status(200).send({
            success: true,
            message: "Article deleted successfully",
            data: null,
        });
    };
    publishArticle = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const userContext = this.extractUserContext(request);
        const article = await this.service.publishArticle(params.id, user.organizationId, user.userId, userContext);
        return reply.status(200).send({
            success: true,
            message: "Article published successfully",
            data: article,
        });
    };
    archiveArticle = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const userContext = this.extractUserContext(request);
        const article = await this.service.archiveArticle(params.id, user.organizationId, user.userId, userContext);
        return reply.status(200).send({
            success: true,
            message: "Article archived successfully",
            data: article,
        });
    };
    getPopularArticles = async (request, reply) => {
        const user = request.user;
        const query = request.query;
        const userContext = this.extractUserContext(request);
        let orgId = user?.organizationId;
        if (!orgId) {
            const org = await mongoose.model("Organization").findOne({ isDeleted: false });
            orgId = org?._id;
        }
        const limit = query.limit ? parseInt(query.limit, 10) : 5;
        const articles = await this.service.getPopularArticles(orgId, userContext, limit);
        return reply.status(200).send({
            success: true,
            message: "Popular articles retrieved successfully",
            data: articles,
        });
    };
}
export default KnowledgeBaseController;
