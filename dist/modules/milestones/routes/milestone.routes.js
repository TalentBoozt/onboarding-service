import { MilestoneController } from "../controllers/milestone.controller.js";
import { MilestoneService } from "../services/milestone.service.js";
import { authenticate, requireRole, requireFeatureFlag } from "../../../middleware/auth.middleware.js";
import { createMilestoneTemplateSchema, updateMilestoneTemplateSchema, assignMilestoneSchema, managerReviewSchema, } from "../schemas/milestone.schema.js";
export async function milestoneRoutes(app) {
    const service = new MilestoneService();
    const controller = new MilestoneController(service);
    // Authenticate all routes
    app.addHook("preHandler", authenticate);
    app.addHook("preHandler", requireFeatureFlag("milestone_ratings"));
    // Template Management (Admin / Owner / HR Admin / Super Admin)
    app.post("/templates", {
        preHandler: [requireRole(["owner", "admin", "hr_admin", "super_admin"])],
        schema: { body: createMilestoneTemplateSchema },
    }, controller.createTemplate);
    app.get("/templates", controller.listTemplates);
    app.put("/templates/:id", {
        preHandler: [requireRole(["owner", "admin", "hr_admin", "super_admin"])],
        schema: { body: updateMilestoneTemplateSchema },
    }, controller.updateTemplate);
    app.patch("/templates/:id", {
        preHandler: [requireRole(["owner", "admin", "hr_admin", "super_admin"])],
        schema: { body: updateMilestoneTemplateSchema },
    }, controller.updateTemplate);
    app.delete("/templates/:id", {
        preHandler: [requireRole(["owner", "admin", "hr_admin", "super_admin"])],
    }, controller.deleteTemplate);
    // Assignment (Admin / Owner)
    app.post("/assign", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: assignMilestoneSchema },
    }, controller.assignMilestone);
    // Employee Milestones & Self Check-in / Self-Evaluation
    app.get("/my-milestones", controller.getMyMilestones);
    app.post("/:id/self-checkin", controller.submitEmployeeSelfCheck);
    app.post("/:id/self-evaluation", controller.submitEmployeeSelfCheck);
    // Manager Team Milestones & Review
    app.get("/team-milestones", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.getTeamMilestones);
    app.get("/team", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.getTeamMilestones);
    app.post("/:id/evaluate", {
        preHandler: [requireRole(["owner", "admin", "manager"])],
    }, controller.evaluateMilestone);
    app.post("/:id/manager-review", {
        preHandler: [requireRole(["owner", "admin", "manager"])],
        schema: { body: managerReviewSchema },
    }, controller.submitManagerReview);
}
export default milestoneRoutes;
