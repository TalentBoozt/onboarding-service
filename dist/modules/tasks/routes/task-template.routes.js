import roleChecklistController from "../controllers/role-checklist.controller.js";
import { authenticate, requireRole, requireFeatureFlag } from "../../../middleware/auth.middleware.js";
export async function taskTemplateRoutes(app) {
    // All template management requires authentication
    app.addHook("preHandler", authenticate);
    app.addHook("preHandler", requireFeatureFlag("checklist_tasks"));
    // List templates
    app.get("/", roleChecklistController.listTemplates);
    // Get template by ID
    app.get("/:id", roleChecklistController.getTemplate);
    // Create template (Admin, Owner, Manager, HR Admin)
    app.post("/", { preHandler: [requireRole(["owner", "admin", "manager", "hr_admin"])] }, roleChecklistController.createTemplate);
    // Update template
    app.patch("/:id", { preHandler: [requireRole(["owner", "admin", "manager", "hr_admin"])] }, roleChecklistController.updateTemplate);
    // Delete template
    app.delete("/:id", { preHandler: [requireRole(["owner", "admin", "manager", "hr_admin"])] }, roleChecklistController.deleteTemplate);
    // Manually apply template to an employee
    app.post("/:id/apply", { preHandler: [requireRole(["owner", "admin", "manager", "hr_admin"])] }, roleChecklistController.applyTemplate);
    app.post("/:id/apply/:userId", { preHandler: [requireRole(["owner", "admin", "manager", "hr_admin"])] }, roleChecklistController.applyTemplate);
}
export default taskTemplateRoutes;
