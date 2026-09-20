export class ManagerController {
    managerService;
    constructor(managerService) {
        this.managerService = managerService;
    }
    getManagerDashboard = async (request, reply) => {
        const user = request.user;
        const data = await this.managerService.getManagerDashboard(user.organizationId, user.userId, user.role);
        return reply.status(200).send({
            success: true,
            message: "Manager dashboard retrieved successfully",
            data,
        });
    };
    getTeamOverview = async (request, reply) => {
        const user = request.user;
        const [metrics, team] = await Promise.all([
            this.managerService.getManagerDashboard(user.organizationId, user.userId, user.role),
            this.managerService.getTeamDirectReports(user.organizationId, user.userId, user.role),
        ]);
        return reply.status(200).send({
            success: true,
            message: "Team overview retrieved successfully",
            data: {
                metrics,
                team,
                totalDirectReports: metrics.totalDirectReports,
                averageProgress: metrics.overallCompletionRate,
                overdueCount: metrics.overdueItemsCount,
            },
        });
    };
    getTeamDirectReports = async (request, reply) => {
        const user = request.user;
        const data = await this.managerService.getTeamDirectReports(user.organizationId, user.userId, user.role);
        return reply.status(200).send({
            success: true,
            message: "Direct reports roster retrieved successfully",
            data,
        });
    };
    getDirectReportDetails = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const data = await this.managerService.getDirectReportDetails(user.organizationId, user.userId, user.role, params.employeeId);
        return reply.status(200).send({
            success: true,
            message: "Direct report details retrieved successfully",
            data,
        });
    };
    nudgeDirectReport = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body || {};
        const data = await this.managerService.nudgeDirectReport(user.organizationId, user.userId, user.role, params.employeeId, body.message);
        return reply.status(200).send({
            success: true,
            message: data.message,
            data,
        });
    };
    signOffDirectReport = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body || {};
        const data = await this.managerService.signOffDirectReport(user.organizationId, user.userId, user.role, params.employeeId, body.notes);
        return reply.status(200).send({
            success: true,
            message: data.message,
            data,
        });
    };
}
