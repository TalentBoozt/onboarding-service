import { FeatureTelemetryService } from "../../super-admin/services/feature-telemetry.service.js";
export class DocumentController {
    documentService;
    constructor(documentService) {
        this.documentService = documentService;
    }
    createTemplate = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const template = await this.documentService.createTemplate(user.organizationId, user.userId, body);
        return reply.status(201).send({
            success: true,
            message: "Document template created successfully",
            data: template,
        });
    };
    listTemplates = async (request, reply) => {
        const user = request.user;
        const templates = await this.documentService.listTemplates(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Document templates retrieved successfully",
            data: templates,
        });
    };
    updateTemplate = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const template = await this.documentService.updateTemplate(user.organizationId, params.id, user.userId, body);
        return reply.status(200).send({
            success: true,
            message: "Document template updated successfully",
            data: template,
        });
    };
    deleteTemplate = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        await this.documentService.deleteTemplate(user.organizationId, params.id);
        return reply.status(200).send({
            success: true,
            message: "Document template deleted successfully",
        });
    };
    assignDocument = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const assignment = await this.documentService.assignDocument(user.organizationId, body.templateId, body.employeeId, user.userId, body.dueDate ? new Date(body.dueDate) : undefined);
        return reply.status(201).send({
            success: true,
            message: "Document assigned successfully",
            data: assignment,
        });
    };
    getEmployeeInbox = async (request, reply) => {
        const user = request.user;
        const assignments = await this.documentService.getEmployeeDocumentInbox(user.organizationId, user.userId);
        return reply.status(200).send({
            success: true,
            message: "Employee document inbox retrieved successfully",
            data: assignments,
        });
    };
    getDocumentAssignment = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const reqMetadata = {
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"],
        };
        const assignment = await this.documentService.getDocumentAssignment(user.organizationId, params.id, user.userId, user.role, reqMetadata);
        return reply.status(200).send({
            success: true,
            message: "Document assignment retrieved successfully",
            data: assignment,
        });
    };
    signDocument = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const reqMetadata = {
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"],
        };
        const assignment = await this.documentService.signDocument(user.organizationId, params.id, user.userId, body, reqMetadata, user.role || (user.scope ? "frontline_worker_kiosk" : undefined));
        // Instrument feature telemetry (fire-and-forget)
        FeatureTelemetryService.recordUsage({
            featureKey: "digital_signatures",
            organizationId: user.organizationId,
            userId: user.userId || user.id,
            userRole: user.role || (user.scope ? "frontline_worker_kiosk" : "employee"),
            actionName: "EXECUTE_SIGNATURE",
            metadata: {
                documentId: params.id,
            },
        }).catch(() => { });
        return reply.status(200).send({
            success: true,
            message: "Document signed successfully with SHA-256 cryptographic audit trail",
            data: assignment,
        });
    };
    getTemplateSignatures = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const signatures = await this.documentService.getTemplateSignatures(user.organizationId, params.id);
        return reply.status(200).send({
            success: true,
            message: "Template signatures retrieved successfully",
            data: signatures,
        });
    };
}
