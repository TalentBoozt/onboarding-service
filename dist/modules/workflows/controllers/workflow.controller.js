export class WorkflowController {
    service;
    constructor(service) {
        this.service = service;
    }
    listRules = async (request, reply) => {
        const user = request.user;
        const query = request.query;
        const rules = await this.service.listRules(user.organizationId, query.triggerType);
        return reply.status(200).send({
            success: true,
            message: "Workflow rules retrieved successfully",
            data: rules,
        });
    };
    getRule = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const rule = await this.service.getRule(params.id, user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Workflow rule retrieved successfully",
            data: rule,
        });
    };
    createRule = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const rule = await this.service.createRule(user.organizationId, user.userId, body);
        return reply.status(201).send({
            success: true,
            message: "Workflow rule created successfully",
            data: rule,
        });
    };
    updateRule = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const rule = await this.service.updateRule(params.id, user.organizationId, body);
        return reply.status(200).send({
            success: true,
            message: "Workflow rule updated successfully",
            data: rule,
        });
    };
    toggleActive = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const rule = await this.service.toggleRuleActive(params.id, user.organizationId, body.isActive);
        return reply.status(200).send({
            success: true,
            message: `Workflow rule ${body.isActive ? "enabled" : "disabled"} successfully`,
            data: rule,
        });
    };
    deleteRule = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        await this.service.deleteRule(params.id, user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Workflow rule deleted successfully",
            data: null,
        });
    };
    getExecutionLogs = async (request, reply) => {
        const user = request.user;
        const query = request.query;
        const pagination = {
            page: query.page ? parseInt(query.page, 10) : 1,
            limit: query.limit ? parseInt(query.limit, 10) : 50,
        };
        const result = await this.service.getExecutionLogs(user.organizationId, query.ruleId, pagination);
        return reply.status(200).send({
            success: true,
            message: "Workflow execution logs retrieved successfully",
            data: result.logs,
            meta: {
                total: result.total,
                page: pagination.page,
                limit: pagination.limit,
            },
        });
    };
    testRun = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const result = await this.service.triggerTestRun(params.id, user.organizationId, body.targetUserId);
        return reply.status(200).send({
            success: true,
            message: result.message,
            data: { executedCount: result.executedCount },
        });
    };
}
export default WorkflowController;
