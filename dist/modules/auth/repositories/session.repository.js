import { Session } from "../models/session.model.js";
export class SessionRepository {
    async create(sessionData) {
        const session = new Session(sessionData);
        return session.save();
    }
    async findById(id) {
        return Session.findOne({ _id: id, isValid: true });
    }
    async invalidateSession(id) {
        return Session.findOneAndUpdate({ _id: id }, { $set: { isValid: false } }, { new: true });
    }
    async invalidateAllUserSessions(userId) {
        await Session.updateMany({ userId, isValid: true }, { $set: { isValid: false } });
    }
    async incrementTokenVersion(id) {
        return Session.findOneAndUpdate({ _id: id, isValid: true }, { $inc: { tokenVersion: 1 }, $set: { lastActivityAt: new Date() } }, { new: true });
    }
}
export default SessionRepository;
