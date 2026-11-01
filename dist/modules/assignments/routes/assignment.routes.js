import { EmployeeAssignmentController } from "../controllers/assignment.controller.js";
import { EmployeeAssignmentService } from "../services/assignment.service.js";
import { EmployeeAssignmentRepository } from "../repositories/assignment.repository.js";
import { authenticate, requireRole } from "../../../middleware/auth.middleware.js";
import { assignJourneySchema, completeLessonSchema, submitQuizSchema, } from "../schemas/assignment.schema.js";
export async function assignmentRoutes(app) {
    const repository = new EmployeeAssignmentRepository();
    const service = new EmployeeAssignmentService(repository);
    const controller = new EmployeeAssignmentController(service);
    // Explicit unauthenticated public certificate verification route
    app.get("/public/verify/:id", controller.verifyCertificatePublic);
    // Protected assignment routes requiring authentication
    await app.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", authenticate);
        // GET /api/v1/assignments/me
        protectedApp.get("/me", controller.getMyAssignments);
        // GET /api/v1/assignments/me/active
        protectedApp.get("/me/active", controller.getMyActiveAssignments);
        // GET /api/v1/assignments/me/completed
        protectedApp.get("/me/completed", controller.getMyCompletedAssignments);
        // GET /api/v1/assignments
        protectedApp.get("/", controller.listAssignments);
        // GET /api/v1/assignments/:id
        protectedApp.get("/:id", controller.getAssignment);
        // POST /api/v1/assignments (assign journey)
        protectedApp.post("/", {
            preHandler: [requireRole(["owner", "admin", "manager", "employee"])],
            schema: { body: assignJourneySchema },
        }, controller.assignJourney);
        // POST /api/v1/assignments/bulk (bulk assign journeys)
        protectedApp.post("/bulk", {
            preHandler: [requireRole(["owner", "admin", "manager"])],
        }, controller.bulkAssignJourneys);
        // POST /api/v1/assignments/:id/start
        protectedApp.post("/:id/start", controller.startAssignment);
        // POST /api/v1/assignments/:id/complete-lesson
        protectedApp.post("/:id/complete-lesson", { schema: { body: completeLessonSchema } }, controller.completeLesson);
        // POST /api/v1/assignments/:id/progress (PWA progress sync alias)
        protectedApp.post("/:id/progress", controller.updateProgress);
        // POST /api/v1/assignments/:id/submit-quiz
        protectedApp.post("/:id/submit-quiz", { schema: { body: submitQuizSchema } }, controller.submitQuiz);
        // POST /api/v1/assignments/:id/issue-certificate
        protectedApp.post("/:id/issue-certificate", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.issueCertificate);
    });
}
export default assignmentRoutes;
