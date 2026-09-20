export class HROperationsController {
    hrService;
    constructor(hrService) {
        this.hrService = hrService;
    }
    getDashboardMetrics = async (request, reply) => {
        const user = request.user;
        const metrics = await this.hrService.getDashboardMetrics(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "HR operational dashboard metrics retrieved successfully",
            data: metrics,
        });
    };
    getExceptionQueue = async (request, reply) => {
        const user = request.user;
        const exceptions = await this.hrService.getExceptionQueue(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Onboarding exception queue retrieved successfully",
            data: exceptions,
        });
    };
    completeHandover = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body || {};
        const result = await this.hrService.completeHandover(user.organizationId, params.userId, user.userId, body.reason);
        const certificateId = result.certificate?._id?.toString() || result.certificateId;
        const employeeStatus = result.employeeStatus || result.user?.employment?.status || "active";
        return reply.status(200).send({
            success: true,
            certificateId,
            employeeStatus,
            message: result.message,
            data: {
                ...(result.user?.toObject ? result.user.toObject() : result.user),
                certificateId,
                employeeStatus,
            },
        });
    };
    updateLifecycleState = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const updatedUser = await this.hrService.updateLifecycleState(user.organizationId, params.userId, body.state, body.reason, body.extensionDays);
        return reply.status(200).send({
            success: true,
            message: "Employee onboarding lifecycle state updated successfully",
            data: updatedUser,
        });
    };
    executeBulkAction = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const result = await this.hrService.executeBulkAction(user.organizationId, user.userId, body.action, body.employeeIds, body.payload || {});
        return reply.status(200).send({
            success: true,
            message: `Bulk ${body.action} executed successfully for ${result.processedCount} employees`,
            data: result,
        });
    };
    generateComplianceReport = async (request, reply) => {
        const user = request.user;
        const report = await this.hrService.generateComplianceReport(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "HR compliance report generated successfully",
            data: report,
        });
    };
}
export default HROperationsController;
