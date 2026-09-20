export class OrganizationController {
    orgService;
    constructor(orgService) {
        this.orgService = orgService;
    }
    getCurrent = async (request, reply) => {
        const user = request.user;
        const org = await this.orgService.getOrganization(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Organization retrieved successfully",
            data: org,
        });
    };
    updateCurrent = async (request, reply) => {
        const user = request.user;
        const org = await this.orgService.updateOrganization(user.organizationId, request.body);
        return reply.status(200).send({
            success: true,
            message: "Organization updated successfully",
            data: org,
        });
    };
    updateBranding = async (request, reply) => {
        const user = request.user;
        const org = await this.orgService.updateBranding(user.organizationId, request.body);
        return reply.status(200).send({
            success: true,
            message: "Branding updated successfully",
            data: org,
        });
    };
    updateSecurity = async (request, reply) => {
        const user = request.user;
        const org = await this.orgService.updateSecurity(user.organizationId, request.body);
        return reply.status(200).send({
            success: true,
            message: "Security settings updated successfully",
            data: org,
        });
    };
    listDepartments = async (request, reply) => {
        const user = request.user;
        const org = await this.orgService.getOrganization(user.organizationId);
        const activeDepts = org.departments.filter((d) => d.active);
        return reply.status(200).send({
            success: true,
            message: "Departments retrieved successfully",
            data: activeDepts,
        });
    };
    createDepartment = async (request, reply) => {
        const user = request.user;
        const dept = await this.orgService.createDepartment(user.organizationId, request.body);
        return reply.status(201).send({
            success: true,
            message: "Department created successfully",
            data: dept,
        });
    };
    updateDepartment = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const dept = await this.orgService.updateDepartment(user.organizationId, params.id, request.body);
        return reply.status(200).send({
            success: true,
            message: "Department updated successfully",
            data: dept,
        });
    };
    deleteDepartment = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        await this.orgService.deleteDepartment(user.organizationId, params.id);
        return reply.status(200).send({
            success: true,
            message: "Department deleted successfully",
            data: null,
        });
    };
    listTeams = async (request, reply) => {
        const user = request.user;
        const org = await this.orgService.getOrganization(user.organizationId);
        const activeTeams = org.teams.filter((t) => t.active);
        return reply.status(200).send({
            success: true,
            message: "Teams retrieved successfully",
            data: activeTeams,
        });
    };
    createTeam = async (request, reply) => {
        const user = request.user;
        const team = await this.orgService.createTeam(user.organizationId, request.body);
        return reply.status(201).send({
            success: true,
            message: "Team created successfully",
            data: team,
        });
    };
    updateTeam = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const team = await this.orgService.updateTeam(user.organizationId, params.id, request.body);
        return reply.status(200).send({
            success: true,
            message: "Team updated successfully",
            data: team,
        });
    };
    deleteTeam = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        await this.orgService.deleteTeam(user.organizationId, params.id);
        return reply.status(200).send({
            success: true,
            message: "Team deleted successfully",
            data: null,
        });
    };
}
export default OrganizationController;
