import mongoose from "mongoose";
export class HRISIntegrationController {
    service;
    constructor(service) {
        this.service = service;
    }
    getIntegrations = async (request, reply) => {
        const user = request.user;
        const integrations = await this.service.getIntegrations(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "HRIS integrations retrieved successfully",
            data: integrations,
        });
    };
    createIntegration = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const integration = await this.service.createIntegration(user.organizationId, user.userId, body);
        return reply.status(201).send({
            success: true,
            message: "HRIS integration created successfully",
            data: integration,
        });
    };
    connectProvider = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const integration = await this.service.connectProvider(user.organizationId, user.userId, params.provider, body);
        return reply.status(200).send({
            success: true,
            message: `${params.provider} connected successfully`,
            data: integration,
        });
    };
    disconnectProvider = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        await this.service.disconnectProvider(user.organizationId, params.provider);
        return reply.status(200).send({
            success: true,
            message: `${params.provider} disconnected successfully`,
        });
    };
    updateIntegration = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const integration = await this.service.updateIntegration(user.organizationId, params.id, body);
        return reply.status(200).send({
            success: true,
            message: "HRIS integration updated successfully",
            data: integration,
        });
    };
    deleteIntegration = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        await this.service.deleteIntegration(user.organizationId, params.id);
        return reply.status(200).send({
            success: true,
            message: "HRIS integration deleted successfully",
        });
    };
    testConnection = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const result = await this.service.testConnection(user.organizationId, params.id);
        return reply.status(200).send({
            success: true,
            message: "HRIS connection test successful",
            data: result,
        });
    };
    triggerSync = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const identifier = params.idOrProvider || params.id || params.provider;
        const isObjectId = mongoose.Types.ObjectId.isValid(identifier) && identifier.length === 24;
        const result = isObjectId
            ? await this.service.triggerSync(user.organizationId, identifier, body?.records)
            : await this.service.syncProvider(user.organizationId, identifier, body?.records);
        return reply.status(200).send({
            success: true,
            status: "queued",
            syncId: result.syncLog._id.toString(),
            message: "HRIS employee lifecycle sync queued successfully",
            data: {
                status: "queued",
                syncId: result.syncLog._id.toString(),
                syncLog: result.syncLog,
                integration: result.integration,
            },
        });
    };
    getSyncLogs = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const logs = await this.service.getSyncLogs(user.organizationId, params.id);
        return reply.status(200).send({
            success: true,
            message: "Sync logs & DLQ events retrieved successfully",
            data: logs,
        });
    };
    rotateWebhookSecret = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const integration = await this.service.rotateWebhookSecret(user.organizationId, params.id);
        return reply.status(200).send({
            success: true,
            message: "Webhook secret rotated successfully",
            data: {
                webhookSecret: integration.webhookSecret,
            },
        });
    };
    retryDLQEvent = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const result = await this.service.retryDLQEvent(user.organizationId, params.id, params.eventId);
        return reply.status(200).send({
            success: true,
            message: "DLQ event reprocessed successfully",
            data: result,
        });
    };
    handleWebhook = async (request, reply) => {
        const params = request.params;
        const signature = (request.headers["x-signature"] ||
            request.headers["x-hub-signature"] ||
            request.headers["x-signature-sha256"] ||
            request.headers["x-bamboohr-signature"] ||
            request.headers["x-workday-signature"]);
        const body = request.body;
        const result = await this.service.processWebhookPayload(params.provider, signature || "", body);
        return reply.status(200).send({
            success: true,
            message: "Webhook event processed successfully",
            data: result,
        });
    };
}
