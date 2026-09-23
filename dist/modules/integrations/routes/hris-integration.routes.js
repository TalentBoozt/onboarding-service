import { HRISIntegrationController } from "../controllers/hris-integration.controller.js";
import { HRISIntegrationService } from "../services/hris-integration.service.js";
import { authenticate, requireRole } from "../../../middleware/auth.middleware.js";
export async function hrisIntegrationRoutes(app) {
    const service = new HRISIntegrationService();
    const controller = new HRISIntegrationController(service);
    // Public Incoming Webhook Endpoint (INT-002)
    app.post("/webhooks/:provider", controller.handleWebhook);
    // Protected Admin Integration Endpoints (INT-001, HRIS-002)
    app.get("/", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.getIntegrations);
    app.post("/", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.createIntegration);
    app.post("/:provider/connect", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.connectProvider);
    app.post("/:idOrProvider/sync", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.triggerSync);
    app.post("/:provider/disconnect", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.disconnectProvider);
    app.put("/:id", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.updateIntegration);
    app.delete("/:id", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.deleteIntegration);
    app.post("/:id/test", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.testConnection);
    app.get("/:id/logs", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.getSyncLogs);
    app.post("/:id/rotate-secret", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.rotateWebhookSecret);
    app.post("/:id/dlq/:eventId/retry", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.retryDLQEvent);
}
export default hrisIntegrationRoutes;
