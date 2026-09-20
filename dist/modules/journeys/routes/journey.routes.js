import { JourneyController } from "../controllers/journey.controller.js";
import { JourneyService } from "../services/journey.service.js";
import { JourneyRepository } from "../repositories/journey.repository.js";
import { authenticate, requireRole, requireFeatureFlag } from "../../../middleware/auth.middleware.js";
import { extractLocale } from "../../../middleware/locale.middleware.js";
import { createJourneySchema, updateJourneySchema, duplicateJourneySchema, } from "../schemas/journey.schema.js";
export async function journeyRoutes(app) {
    const repository = new JourneyRepository();
    const service = new JourneyService(repository);
    const controller = new JourneyController(service);
    // Authenticate all routes
    app.addHook("preHandler", authenticate);
    app.addHook("preHandler", requireFeatureFlag("journey_templates"));
    // GET /api/v1/journeys
    app.get("/", { preHandler: [extractLocale] }, controller.listJourneys);
    // GET /api/v1/journeys/:id
    app.get("/:id", { preHandler: [extractLocale] }, controller.getJourney);
    // GET /api/v1/journeys/courses/:id
    app.get("/courses/:id", { preHandler: [extractLocale] }, controller.getJourney);
    // POST /api/v1/journeys
    app.post("/", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: createJourneySchema },
    }, controller.createJourney);
    // PATCH /api/v1/journeys/:id
    app.patch("/:id", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: updateJourneySchema },
    }, controller.updateJourney);
    // DELETE /api/v1/journeys/:id
    app.delete("/:id", { preHandler: [requireRole(["owner", "admin"])] }, controller.deleteJourney);
    // POST /api/v1/journeys/:id/publish
    app.post("/:id/publish", { preHandler: [requireRole(["owner", "admin"])] }, controller.publishJourney);
    // POST /api/v1/journeys/:id/archive
    app.post("/:id/archive", { preHandler: [requireRole(["owner", "admin"])] }, controller.archiveJourney);
    // POST /api/v1/journeys/:id/duplicate
    app.post("/:id/duplicate", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: duplicateJourneySchema },
    }, controller.duplicateJourney);
    // GET /api/v1/journeys/:id/analytics
    app.get("/:id/analytics", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.getJourneyAnalytics);
    // POST /api/v1/journeys/:id/assignment-preview
    app.post("/:id/assignment-preview", { preHandler: [requireRole(["owner", "admin"])] }, controller.previewSmartAssignment);
    // POST /api/v1/journeys/:id/smart-assign
    app.post("/:id/smart-assign", { preHandler: [requireRole(["owner", "admin"])] }, controller.executeSmartAssignment);
    // PATCH /api/v1/journeys/:id/targeting
    app.patch("/:id/targeting", { preHandler: [requireRole(["owner", "admin"])] }, controller.updateTargeting);
    // GET /api/v1/journeys/:id/prerequisites-check
    app.get("/:id/prerequisites-check", controller.checkPrerequisites);
    // POST /api/v1/journeys/:id/clone
    app.post("/:id/clone", { preHandler: [requireRole(["owner", "admin"])] }, controller.cloneJourney);
    // PUT /api/v1/journeys/:id/reorder
    app.put("/:id/reorder", { preHandler: [requireRole(["owner", "admin"])] }, controller.reorderCurriculum);
    // POST /api/v1/journeys/reminders/dispatch
    app.post("/reminders/dispatch", { preHandler: [requireRole(["owner", "admin"])] }, controller.dispatchReminders);
}
export default journeyRoutes;
