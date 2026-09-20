import OrganizationIntegrationService from "../services/organization-integration.service.js";
export class OrganizationIntegrationController {
    service;
    constructor(service = new OrganizationIntegrationService()) {
        this.service = service;
    }
    getCapabilities = async (request, reply) => {
        const user = request.user;
        const capabilities = await this.service.getCapabilities(user.organizationId);
        return reply.status(200).send({
            success: true,
            data: capabilities,
        });
    };
    getIntegration = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        if (params.type !== "ai" && params.type !== "email") {
            return reply.status(400).send({
                success: false,
                message: "Invalid integration type. Must be 'ai' or 'email'.",
            });
        }
        const data = await this.service.getIntegration(user.organizationId, params.type);
        return reply.status(200).send({
            success: true,
            data,
        });
    };
    saveIntegration = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        if (params.type !== "ai" && params.type !== "email") {
            return reply.status(400).send({
                success: false,
                message: "Invalid integration type. Must be 'ai' or 'email'.",
            });
        }
        const data = await this.service.saveIntegration(user.organizationId, user.userId, params.type, body);
        return reply.status(200).send({
            success: true,
            message: `${params.type.toUpperCase()} integration saved successfully.`,
            data,
        });
    };
    testIntegration = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body || {};
        if (params.type !== "ai" && params.type !== "email") {
            return reply.status(400).send({
                success: false,
                message: "Invalid integration type. Must be 'ai' or 'email'.",
            });
        }
        const result = await this.service.testIntegration(user.organizationId, params.type, body);
        return reply.status(200).send({
            success: result.success,
            data: result,
        });
    };
    deleteIntegration = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        if (params.type !== "ai" && params.type !== "email") {
            return reply.status(400).send({
                success: false,
                message: "Invalid integration type. Must be 'ai' or 'email'.",
            });
        }
        const result = await this.service.deleteIntegration(user.organizationId, params.type);
        return reply.status(200).send({
            success: true,
            message: result.message,
        });
    };
}
export default OrganizationIntegrationController;
