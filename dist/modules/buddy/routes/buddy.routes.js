import { BuddyController } from "../controllers/buddy.controller.js";
import { BuddyService } from "../services/buddy.service.js";
import { authenticate, requireRole, requireFeatureFlag } from "../../../middleware/auth.middleware.js";
import { registerBuddySchema, assignBuddySchema, updateChecklistSchema, logCheckinSchema, addCustomTaskSchema, } from "../schemas/buddy.schema.js";
export async function buddyRoutes(app) {
    const service = new BuddyService();
    const controller = new BuddyController(service);
    // Authenticate all routes
    app.addHook("preHandler", authenticate);
    app.addHook("preHandler", requireFeatureFlag("buddy_connection"));
    // Profile Registration & Discovery
    app.post("/profiles", { schema: { body: registerBuddySchema } }, controller.registerProfile);
    app.get("/available", controller.listAvailableBuddies);
    app.get("/my-profile", controller.getMyProfile);
    app.get("/assignments", controller.listOrganizationAssignments);
    // Assignment (Admin / Owner / Manager)
    app.post("/assign", {
        preHandler: [requireRole(["owner", "admin", "manager"])],
        schema: { body: assignBuddySchema },
    }, controller.assignBuddy);
    // User Views
    app.get("/my-buddy", controller.getEmployeeBuddy);
    app.get("/my-mentees", controller.getBuddyMentees);
    // Checklist & Check-ins
    app.put("/assignment/:id/checklist", { schema: { body: updateChecklistSchema } }, controller.updateChecklistTask);
    app.post("/assignment/:id/checklist/task", { schema: { body: addCustomTaskSchema } }, controller.addCustomChecklistTask);
    app.post("/assignment/:id/checkin", { schema: { body: logCheckinSchema } }, controller.logBuddyCheckin);
}
export default buddyRoutes;
