import { Notification } from "../models/notification.model.js";
import mongoose from "mongoose";
export class NotificationRepository {
    async findById(id) {
        return Notification.findOne({ _id: id });
    }
    async findByIdAndUser(id, userId) {
        return Notification.findOne({ _id: id, recipientUserId: userId });
    }
    async find(filter, pagination) {
        const query = {
            recipientUserId: new mongoose.Types.ObjectId(filter.recipientUserId),
        };
        if (filter.organizationId) {
            query.organizationId = new mongoose.Types.ObjectId(filter.organizationId);
        }
        if (filter.isRead !== undefined) {
            query.isRead = filter.isRead;
        }
        if (filter.type) {
            query.type = filter.type;
        }
        if (filter.status) {
            query.status = filter.status;
        }
        const total = await Notification.countDocuments(query);
        const page = Math.max(1, pagination.page);
        const limit = Math.max(1, pagination.limit);
        const skip = (page - 1) * limit;
        const sortField = pagination.sortBy || "createdAt";
        const sortOrder = pagination.sortOrder === "asc" ? 1 : -1;
        const notifications = await Notification.find(query)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);
        return { notifications, total };
    }
    async countUnread(userId) {
        return Notification.countDocuments({
            recipientUserId: new mongoose.Types.ObjectId(userId),
            isRead: false,
        });
    }
    async create(notificationData) {
        const notification = new Notification(notificationData);
        return notification.save();
    }
    async bulkCreate(notificationsData) {
        return Notification.insertMany(notificationsData);
    }
    async markAsRead(id, userId) {
        return Notification.findOneAndUpdate({ _id: id, recipientUserId: userId, isRead: false }, {
            $set: {
                isRead: true,
                readAt: new Date(),
                status: "sent", // finalize status
            },
        }, { new: true });
    }
    async markAllAsRead(userId) {
        await Notification.updateMany({ recipientUserId: userId, isRead: false }, {
            $set: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }
    async delete(id, userId) {
        return Notification.findOneAndDelete({ _id: id, recipientUserId: userId });
    }
}
export default NotificationRepository;
