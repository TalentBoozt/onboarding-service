import { DocumentController } from "../controllers/document.controller.js";
import { DocumentService } from "../services/document.service.js";
import { authenticate, requireRole, requireFeatureFlag } from "../../../middleware/auth.middleware.js";
import { createTemplateSchema, updateTemplateSchema, assignDocumentSchema, signDocumentSchema, } from "../schemas/document.schema.js";
export async function documentRoutes(app) {
    const service = new DocumentService();
    const controller = new DocumentController(service);
    // Authenticate all routes
    app.addHook("preHandler", authenticate);
    app.addHook("preHandler", requireFeatureFlag("digital_signatures"));
    // Template Routes (Admin / Owner)
    app.post("/templates", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: createTemplateSchema },
    }, controller.createTemplate);
    // Alias POST /api/v1/documents -> createTemplate
    app.post("/", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: createTemplateSchema },
    }, controller.createTemplate);
    app.get("/templates", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.listTemplates);
    // Alias GET /api/v1/documents -> listTemplates
    app.get("/", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.listTemplates);
    app.put("/templates/:id", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: updateTemplateSchema },
    }, controller.updateTemplate);
    // Alias PATCH /api/v1/documents/:id -> updateTemplate
    app.patch("/:id", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: updateTemplateSchema },
    }, controller.updateTemplate);
    app.delete("/templates/:id", { preHandler: [requireRole(["owner", "admin"])] }, controller.deleteTemplate);
    // Template Audit Trail Signatures (Admin / Owner / Manager)
    app.get("/templates/:id/signatures", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.getTemplateSignatures);
    app.get("/:id/signatures", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.getTemplateSignatures);
    // Assignment Routes (Admin / Owner)
    app.post("/assign", {
        preHandler: [requireRole(["owner", "admin"])],
        schema: { body: assignDocumentSchema },
    }, controller.assignDocument);
    // Employee Inbox & Signing Routes (Any Authenticated User)
    app.get("/inbox", controller.getEmployeeInbox);
    app.get("/:id", controller.getDocumentAssignment);
    app.post("/:id/sign", { schema: { body: signDocumentSchema } }, controller.signDocument);
}
export default documentRoutes;
