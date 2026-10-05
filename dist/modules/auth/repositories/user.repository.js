import { User } from "../models/user.model.js";
import mongoose from "mongoose";
export class UserRepository {
    async findByEmail(email) {
        return User.findOne({
            "auth.email": email.toLowerCase(),
            isDeleted: false,
        });
    }
    async findByIdentifier(identifier, organizationId) {
        const clean = identifier.trim();
        if (!clean)
            return null;
        const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const exactRegex = new RegExp(`^${escaped}$`, "i");
        const cleanDigits = clean.replace(/\D/g, "");
        const orConditions = [
            { "auth.email": clean.toLowerCase() },
            { "employment.employeeId": exactRegex },
            { "employment.badgeId": exactRegex },
            { "profile.phone": clean },
            { "profile.phone": clean.replace(/\s+/g, "") },
        ];
        if (cleanDigits.length >= 7) {
            orConditions.push({ "profile.phone": new RegExp(`${cleanDigits}$`) });
        }
        const query = {
            $or: orConditions,
            isDeleted: false,
        };
        if (organizationId) {
            query.organizationId = typeof organizationId === "string" ? new mongoose.Types.ObjectId(organizationId) : organizationId;
        }
        return User.findOne(query);
    }
    async findById(id) {
        return User.findOne({
            _id: id,
            isDeleted: false,
        });
    }
    async create(userData) {
        const user = new User(userData);
        return user.save();
    }
    async update(id, updateData) {
        return User.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: updateData }, { new: true });
    }
    async incrementFailedLogin(id) {
        return User.findOneAndUpdate({ _id: id, isDeleted: false }, { $inc: { "security.failedLoginAttempts": 1 } }, { new: true });
    }
    async resetFailedLogin(id) {
        return User.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { "security.failedLoginAttempts": 0, "security.lockedUntil": null } }, { new: true });
    }
    async lockAccount(id, lockedUntil) {
        return User.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { "security.lockedUntil": lockedUntil } }, { new: true });
    }
    async findByResetToken(hashedToken) {
        return User.findOne({
            "security.passwordResetToken": hashedToken,
            "security.passwordResetExpires": { $gt: new Date() },
            isDeleted: false,
        });
    }
}
export default UserRepository;
