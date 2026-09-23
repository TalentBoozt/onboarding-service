import mongoose from "mongoose";
import { getDemoEmailLogModel } from "../models/demo-email-log.model.js";
export class DemoEmailSinkService {
    /**
     * Captures an email in the isolated demo inbox log.
     * Completely bypasses SMTP to ensure zero chance of leaking to real email addresses.
     */
    async captureEmail(to, subject, htmlContent, demoTenantId, sourceEvent = "notification") {
        const DemoEmailLog = getDemoEmailLogModel();
        const logEntry = await DemoEmailLog.create({
            demoTenantId: demoTenantId ? new mongoose.Types.ObjectId(demoTenantId) : undefined,
            to,
            subject,
            htmlContent,
            sourceEvent,
            sentAt: new Date(),
        });
        return logEntry;
    }
    /**
     * Retrieves captured demo emails for a specific tenant or user.
     */
    async getInbox(demoTenantId, limit = 50) {
        const DemoEmailLog = getDemoEmailLogModel();
        const query = {};
        if (demoTenantId) {
            query.demoTenantId = new mongoose.Types.ObjectId(demoTenantId);
        }
        return DemoEmailLog.find(query).sort({ sentAt: -1 }).limit(limit).lean();
    }
}
export const demoEmailSinkService = new DemoEmailSinkService();
export default demoEmailSinkService;
