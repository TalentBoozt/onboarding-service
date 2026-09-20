import { AnalyticsController } from "../controllers/analytics.controller.js";
import { AnalyticsService } from "../services/analytics.service.js";
import { authenticate, requireRole } from "../../../middleware/auth.middleware.js";
export async function analyticsRoutes(app) {
    const service = new AnalyticsService();
    const controller = new AnalyticsController(service);
    // Authenticate all routes
    app.addHook("preHandler", authenticate);
    app.addHook("preHandler", requireRole(["owner", "admin", "manager"]));
    // GET /api/v1/analytics/overview (UJ-ADM-012)
    app.get("/overview", controller.getOverview);
    // GET /api/v1/analytics/summary
    app.get("/summary", controller.getSummary);
    // GET /api/v1/analytics/time-to-completion
    app.get("/time-to-completion", controller.getTimeToCompletion);
    // GET /api/v1/analytics/bottlenecks
    app.get("/bottlenecks", controller.getBottlenecks);
    // GET /api/v1/analytics/export
    app.get("/export", controller.exportCSV);
    // Scheduled Reports
    app.post("/scheduled-reports", controller.createScheduledReport);
    app.get("/scheduled-reports", controller.listScheduledReports);
    app.delete("/scheduled-reports/:id", controller.deleteScheduledReport);
}
export default analyticsRoutes;
