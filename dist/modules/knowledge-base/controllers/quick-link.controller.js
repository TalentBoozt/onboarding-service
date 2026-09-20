import mongoose from "mongoose";
export class QuickLinkController {
    service;
    constructor(service) {
        this.service = service;
    }
    getQuickLinks = async (request, reply) => {
        const user = request.user;
        let orgId = user?.organizationId;
        if (!orgId) {
            const org = await mongoose.model("Organization").findOne({ isDeleted: false });
            orgId = org?._id;
        }
        const links = await this.service.getQuickLinks(orgId);
        return reply.status(200).send({
            success: true,
            message: "Quick links retrieved successfully",
            data: links,
        });
    };
    createQuickLink = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const link = await this.service.createQuickLink(user.organizationId, body);
        return reply.status(201).send({
            success: true,
            message: "Quick link created successfully",
            data: link,
        });
    };
    updateQuickLink = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const link = await this.service.updateQuickLink(params.id, user.organizationId, body);
        return reply.status(200).send({
            success: true,
            message: "Quick link updated successfully",
            data: link,
        });
    };
    deleteQuickLink = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        await this.service.deleteQuickLink(params.id, user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Quick link deleted successfully",
            data: null,
        });
    };
}
export default QuickLinkController;
