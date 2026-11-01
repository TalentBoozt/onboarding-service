import SalesIntegrationService from "../services/sales-integration.service.js";
export class SalesIntegrationController {
    service;
    constructor(service = new SalesIntegrationService()) {
        this.service = service;
    }
    listIntegrations = async (request, reply) => {
        const integrations = await this.service.listIntegrations();
        return reply.status(200).send({
            success: true,
            data: integrations,
        });
    };
    getIntegration = async (request, reply) => {
        const { category, provider } = request.params;
        const integration = await this.service.getIntegration(category, provider);
        if (!integration) {
            return reply.status(200).send({
                success: true,
                data: {
                    category,
                    provider,
                    status: "not_configured",
                    enabled: false,
                    publicConfig: {},
                    maskedSecrets: {},
                    hasSecrets: false,
                },
            });
        }
        return reply.status(200).send({
            success: true,
            data: integration,
        });
    };
    saveIntegration = async (request, reply) => {
        const { category, provider } = request.params;
        const body = request.body || {};
        const updated = await this.service.saveIntegration(category, provider, body);
        return reply.status(200).send({
            success: true,
            message: `${provider.toUpperCase()} integration settings updated successfully.`,
            data: updated,
        });
    };
    testIntegration = async (request, reply) => {
        const { category, provider } = request.params;
        const body = request.body || {};
        const result = await this.service.testConnection(category, provider, body.secrets);
        return reply.status(200).send({
            success: result.success,
            data: result,
        });
    };
    deleteIntegration = async (request, reply) => {
        const { category, provider } = request.params;
        await this.service.deleteIntegration(category, provider);
        return reply.status(200).send({
            success: true,
            message: `${provider.toUpperCase()} integration reset successfully.`,
        });
    };
}
export default SalesIntegrationController;
