import { NotificationController } from "../controllers/notification.controller.js";
import { NotificationService } from "../services/notification.service.js";
import { NotificationRepository } from "../repositories/notification.repository.js";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { getNotificationsQuerySchema } from "../schemas/notification.schema.js";
export async function notificationRoutes(app) {
    const repository = new NotificationRepository();
    const service = new NotificationService(repository);
    const controller = new NotificationController(service);
    // Authenticate all routes
    app.addHook("preHandler", authenticate);
    // GET /api/v1/notifications/preferences
    app.get("/preferences", controller.getPreferences);
    // PUT /api/v1/notifications/preferences
    app.put("/preferences", controller.updatePreferences);
    // GET /api/v1/notifications/unread
    app.get("/unread", controller.getUnreadNotifications);
    // GET /api/v1/notifications/count
    app.get("/count", controller.getUnreadCount);
    // PATCH /api/v1/notifications/read-all
    app.patch("/read-all", controller.markAllRead);
    // GET /api/v1/notifications
    app.get("/", { schema: { querystring: getNotificationsQuerySchema } }, controller.listNotifications);
    // PATCH /api/v1/notifications/:id/read
    app.patch("/:id/read", controller.markRead);
    // DELETE /api/v1/notifications/:id
    app.delete("/:id", controller.deleteNotification);
    // Web Push Subscription Routes (MOB-004)
    app.post("/push-subscription", controller.registerPushSubscription);
    app.delete("/push-subscription", controller.unregisterPushSubscription);
}
export default notificationRoutes;
