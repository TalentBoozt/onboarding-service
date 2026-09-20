import { OrganizationController } from "../controllers/organization.controller.js";
import { OrganizationService } from "../services/organization.service.js";
import { OrganizationRepository } from "../repositories/organization.repository.js";
import { authenticate, requireRole } from "../../../middleware/auth.middleware.js";
import { updateOrganizationSchema, updateBrandingSchema, updateSecuritySchema, departmentSchema, teamSchema, } from "../schemas/organization.schema.js";
export async function organizationRoutes(app) {
    const orgRepository = new OrganizationRepository();
    const orgService = new OrganizationService(orgRepository);
    const controller = new OrganizationController(orgService);
    // Apply authentication to all organization routes
    app.addHook("preHandler", authenticate);
    // GET /api/v1/organizations/current
    app.get("/current", controller.getCurrent);
    // PATCH /api/v1/organizations/current
    app.patch("/current", {
        preHandler: [requireRole(["owner"])],
        schema: { body: updateOrganizationSchema },
    }, controller.updateCurrent);
    // PATCH /api/v1/organizations/branding
    app.patch("/branding", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: updateBrandingSchema },
    }, controller.updateBranding);
    // PATCH /api/v1/organizations/security
    app.patch("/security", {
        preHandler: [requireRole(["owner"])],
        schema: { body: updateSecuritySchema },
    }, controller.updateSecurity);
    // Departments
    app.get("/departments", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.listDepartments);
    app.post("/departments", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: departmentSchema },
    }, controller.createDepartment);
    app.patch("/departments/:id", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: departmentSchema.partial() },
    }, controller.updateDepartment);
    app.delete("/departments/:id", { preHandler: [requireRole(["owner", "admin"])] }, controller.deleteDepartment);
    // Teams
    app.get("/teams", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.listTeams);
    app.post("/teams", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: teamSchema },
    }, controller.createTeam);
    app.patch("/teams/:id", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: teamSchema.partial() },
    }, controller.updateTeam);
    app.delete("/teams/:id", { preHandler: [requireRole(["owner", "admin"])] }, controller.deleteTeam);
}
export default organizationRoutes;
