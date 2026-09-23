export class AnalyticsController {
    service;
    constructor(service) {
        this.service = service;
    }
    getOverview = async (request, reply) => {
        const user = request.user;
        const query = (request.query || {});
        const overview = await this.service.getOverview(user.organizationId, query);
        return reply.status(200).send({
            success: true,
            message: "Analytics overview retrieved successfully",
            data: overview,
            ...overview,
        });
    };
    getSummary = async (request, reply) => {
        const user = request.user;
        const summary = await this.service.getSummary(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Analytics summary retrieved successfully",
            data: summary,
        });
    };
    getTimeToCompletion = async (request, reply) => {
        const user = request.user;
        const query = (request.query || {});
        const metrics = await this.service.getTimeToCompletionMetrics(user.organizationId, query.department);
        return reply.status(200).send({
            success: true,
            message: "Time-to-completion metrics retrieved successfully",
            data: metrics,
        });
    };
    getBottlenecks = async (request, reply) => {
        const user = request.user;
        const query = (request.query || {});
        const bottlenecks = await this.service.getQuizAndModuleBottlenecks(user.organizationId, query.department);
        return reply.status(200).send({
            success: true,
            message: "Quiz and module failure bottlenecks retrieved successfully",
            data: bottlenecks,
        });
    };
    getCohortHealth = async (request, reply) => {
        const user = request.user;
        const query = (request.query || {});
        const health = await this.service.getCohortHealth(user.organizationId, query.department);
        return reply.status(200).send({
            success: true,
            message: "Cohort health and at-risk telemetry retrieved successfully",
            data: health,
        });
    };
    nudgeEmployee = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const result = await this.service.nudgeEmployee(user.organizationId, params.employeeId);
        return reply.status(200).send({
            success: true,
            message: "Intervention nudge dispatched successfully",
            data: result,
        });
    };
    exportCSV = async (request, reply) => {
        const user = request.user;
        const csvContent = await this.service.exportAnalyticsCSV(user.organizationId);
        return reply
            .header("Content-Type", "text/csv; charset=utf-8")
            .header("Content-Disposition", 'attachment; filename="onboarding-analytics.csv"')
            .send(csvContent);
    };
    createScheduledReport = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const report = await this.service.createScheduledReport(user.organizationId, user.userId, body);
        return reply.status(201).send({
            success: true,
            message: "Scheduled report created successfully",
            data: report,
        });
    };
    listScheduledReports = async (request, reply) => {
        const user = request.user;
        const reports = await this.service.listScheduledReports(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Scheduled reports retrieved successfully",
            data: reports,
        });
    };
    deleteScheduledReport = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        await this.service.deleteScheduledReport(user.organizationId, params.id);
        return reply.status(200).send({
            success: true,
            message: "Scheduled report deleted successfully",
        });
    };
    runScheduledReport = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const result = await this.service.executeScheduledReport(user.organizationId, params.id);
        return reply.status(200).send({
            success: true,
            message: "Scheduled report executed and dispatched successfully",
            data: result,
        });
    };
}
export default AnalyticsController;
