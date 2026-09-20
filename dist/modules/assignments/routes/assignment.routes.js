import { EmployeeAssignmentController } from "../controllers/assignment.controller.js";
import { EmployeeAssignmentService } from "../services/assignment.service.js";
import { EmployeeAssignmentRepository } from "../repositories/assignment.repository.js";
import { authenticate, requireRole } from "../../../middleware/auth.middleware.js";
import { assignJourneySchema, completeLessonSchema, submitQuizSchema, } from "../schemas/assignment.schema.js";
export async function assignmentRoutes(app) {
    const repository = new EmployeeAssignmentRepository();
    const service = new EmployeeAssignmentService(repository);
    const controller = new EmployeeAssignmentController(service);
    // GET /api/v1/assignments/public/verify/:id (unauthenticated)
    app.get("/public/verify/:id", controller.verifyCertificatePublic);
    // Authenticate all routes
    app.addHook("preHandler", authenticate);
    // GET /api/v1/assignments/me
    app.get("/me", controller.getMyAssignments);
    // GET /api/v1/assignments/me/active
    app.get("/me/active", controller.getMyActiveAssignments);
    // GET /api/v1/assignments/me/completed
    app.get("/me/completed", controller.getMyCompletedAssignments);
    // GET /api/v1/assignments
    app.get("/", controller.listAssignments);
    // GET /api/v1/assignments/:id
    app.get("/:id", controller.getAssignment);
    // POST /api/v1/assignments (assign journey)
    app.post("/", {
        preHandler: [requireRole(["owner", "admin", "manager", "employee"])],
        schema: { body: assignJourneySchema },
    }, controller.assignJourney);
    // POST /api/v1/assignments/bulk (bulk assign journeys)
    app.post("/bulk", {
        preHandler: [requireRole(["owner", "admin", "manager"])],
    }, controller.bulkAssignJourneys);
    // POST /api/v1/assignments/:id/start
    app.post("/:id/start", controller.startAssignment);
    // POST /api/v1/assignments/:id/complete-lesson
    app.post("/:id/complete-lesson", { schema: { body: completeLessonSchema } }, controller.completeLesson);
    // POST /api/v1/assignments/:id/progress (PWA progress sync alias)
    app.post("/:id/progress", controller.updateProgress);
    // POST /api/v1/assignments/:id/submit-quiz
    app.post("/:id/submit-quiz", { schema: { body: submitQuizSchema } }, controller.submitQuiz);
    // POST /api/v1/assignments/:id/issue-certificate
    app.post("/:id/issue-certificate", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.issueCertificate);
}
export default assignmentRoutes;
