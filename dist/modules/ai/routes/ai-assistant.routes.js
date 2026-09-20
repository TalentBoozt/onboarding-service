import { AIAssistantController } from "../controllers/ai-assistant.controller.js";
import { AIAssistantService } from "../services/ai-assistant.service.js";
import { authenticate, requireRole, requireFeatureFlag } from "../../../middleware/auth.middleware.js";
export async function aiAssistantRoutes(app) {
    const service = new AIAssistantService();
    const controller = new AIAssistantController(service);
    // Authenticate all routes
    app.addHook("preHandler", authenticate);
    // POST /api/v1/ai/chat & POST /api/v1/ai/query
    app.post("/chat", controller.chat);
    app.post("/query", controller.chat);
    // GET /api/v1/ai/conversations
    app.get("/conversations", controller.getConversations);
    // GET /api/v1/ai/conversations/:id
    app.get("/conversations/:id", controller.getConversationById);
    // POST /api/v1/ai/feedback
    app.post("/feedback", controller.logFeedback);
    // AI Course & Journey Builder (AI-006 .. AI-010) - Gated by feature flag "ai_course_builder"
    app.post("/generate-course", { preHandler: [requireRole(["owner", "admin"]), requireFeatureFlag("ai_course_builder")] }, controller.generateCourseDraft);
    app.post("/course-builder/generate", { preHandler: [requireRole(["owner", "admin"]), requireFeatureFlag("ai_course_builder")] }, controller.generateCourseDraft);
    app.get("/course-builder/drafts", { preHandler: [requireRole(["owner", "admin"]), requireFeatureFlag("ai_course_builder")] }, controller.getCourseDrafts);
    app.get("/course-builder/drafts/:id", { preHandler: [requireRole(["owner", "admin"]), requireFeatureFlag("ai_course_builder")] }, controller.getCourseDraftById);
    app.post("/course-builder/drafts/:id/regenerate-module", { preHandler: [requireRole(["owner", "admin"]), requireFeatureFlag("ai_course_builder")] }, controller.regenerateModule);
    app.post("/course-builder/drafts/:id/publish", { preHandler: [requireRole(["owner", "admin"]), requireFeatureFlag("ai_course_builder")] }, controller.publishCourseDraft);
    app.delete("/course-builder/drafts/:id", { preHandler: [requireRole(["owner", "admin"]), requireFeatureFlag("ai_course_builder")] }, controller.deleteCourseDraft);
}
export default aiAssistantRoutes;
