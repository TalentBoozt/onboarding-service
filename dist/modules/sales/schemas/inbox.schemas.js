import { z } from "zod";
export const inboxQuerySchema = z.object({
    channel: z.enum(["email", "whatsapp"]).optional(),
    status: z.enum(["open", "pending", "resolved"]).optional(),
    assignedTo: z.string().optional(),
    unreadOnly: z
        .preprocess((val) => {
        if (typeof val === "string")
            return val.toLowerCase() === "true";
        return Boolean(val);
    }, z.boolean())
        .optional(),
    search: z.string().optional(),
    leadId: z.string().optional(),
    contactId: z.string().optional(),
    companyId: z.string().optional(),
    dealId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(["lastMessageAt", "createdAt", "updatedAt"]).default("lastMessageAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export const sendReplySchema = z.object({
    body: z.string().trim().min(1, "Message body cannot be empty"),
    subject: z.string().trim().optional(),
    to: z.string().trim().optional(),
    status: z.enum(["open", "pending", "resolved"]).optional(),
});
export const updateThreadSchema = z.object({
    status: z.enum(["open", "pending", "resolved"]).optional(),
    assignedTo: z.string().nullable().optional(),
    leadId: z.string().nullable().optional(),
    contactId: z.string().nullable().optional(),
    companyId: z.string().nullable().optional(),
    dealId: z.string().nullable().optional(),
});
export const createThreadSchema = z.object({
    channel: z.enum(["email", "whatsapp"]),
    recipient: z.string().trim().min(1, "Recipient address or phone number is required"),
    subject: z.string().trim().optional(),
    body: z.string().trim().min(1, "Initial message body cannot be empty"),
    leadId: z.string().optional(),
    contactId: z.string().optional(),
    companyId: z.string().optional(),
    dealId: z.string().optional(),
    assignedTo: z.string().optional(),
});
