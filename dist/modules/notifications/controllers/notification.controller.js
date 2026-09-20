export class NotificationController {
    service;
    constructor(service) {
        this.service = service;
    }
    listNotifications = async (request, reply) => {
        const user = request.user;
        const query = request.query;
        const filter = {
            organizationId: user.organizationId,
            recipientUserId: user.userId,
        };
        if (query.isRead !== undefined) {
            filter.isRead = query.isRead === "true";
        }
        const pagination = {
            page: query.page ? parseInt(query.page, 10) : 1,
            limit: query.limit ? parseInt(query.limit, 10) : 50,
        };
        const result = await this.service.listNotifications(filter, pagination);
        return reply.status(200).send({
            success: true,
            message: "Notifications list retrieved successfully",
            data: result.notifications,
            meta: {
                total: result.total,
                page: pagination.page,
                limit: pagination.limit,
            },
        });
    };
    getUnreadNotifications = async (request, reply) => {
        const user = request.user;
        const query = request.query;
        const filter = {
            organizationId: user.organizationId,
            recipientUserId: user.userId,
            isRead: false,
        };
        const pagination = {
            page: query.page ? parseInt(query.page, 10) : 1,
            limit: query.limit ? parseInt(query.limit, 10) : 50,
        };
        const result = await this.service.listNotifications(filter, pagination);
        return reply.status(200).send({
            success: true,
            message: "Unread notifications list retrieved successfully",
            data: result.notifications,
            meta: {
                total: result.total,
                page: pagination.page,
                limit: pagination.limit,
            },
        });
    };
    getUnreadCount = async (request, reply) => {
        const user = request.user;
        const count = await this.service.getUnreadCount(user.userId);
        return reply.status(200).send({
            success: true,
            message: "Unread notification count retrieved successfully",
            data: { count },
        });
    };
    markRead = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const notification = await this.service.markNotificationRead(params.id, user.userId);
        return reply.status(200).send({
            success: true,
            message: "Notification marked as read successfully",
            data: notification,
        });
    };
    markAllRead = async (request, reply) => {
        const user = request.user;
        await this.service.markAllRead(user.userId);
        return reply.status(200).send({
            success: true,
            message: "All notifications marked as read successfully",
            data: null,
        });
    };
    deleteNotification = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        await this.service.deleteNotification(params.id, user.userId);
        return reply.status(200).send({
            success: true,
            message: "Notification deleted successfully",
            data: null,
        });
    };
    getPreferences = async (request, reply) => {
        const user = request.user;
        const prefs = await this.service.getPreferences(user.userId, user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Notification preferences retrieved successfully",
            data: prefs,
        });
    };
    updatePreferences = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const prefs = await this.service.updatePreferences(user.userId, user.organizationId, body);
        return reply.status(200).send({
            success: true,
            message: "Notification preferences updated successfully",
            data: prefs,
        });
    };
    registerPushSubscription = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        if (!body.endpoint || !body.keys) {
            return reply.status(400).send({
                success: false,
                message: "Endpoint and keys are required for Web Push subscription",
            });
        }
        const subscription = await this.service.registerPushSubscription(user.organizationId, user.userId, { endpoint: body.endpoint, keys: body.keys }, request.headers["user-agent"]);
        return reply.status(201).send({
            success: true,
            message: "Web Push subscription registered successfully",
            data: subscription,
        });
    };
    unregisterPushSubscription = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        if (!body.endpoint) {
            return reply.status(400).send({
                success: false,
                message: "Endpoint is required to unregister Web Push subscription",
            });
        }
        await this.service.unregisterPushSubscription(user.organizationId, user.userId, body.endpoint);
        return reply.status(200).send({
            success: true,
            message: "Web Push subscription unregistered successfully",
        });
    };
}
export default NotificationController;
