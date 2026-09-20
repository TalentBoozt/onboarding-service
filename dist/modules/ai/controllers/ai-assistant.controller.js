import { AICourseBuilderService } from "../services/ai-course-builder.service.js";
import { FeatureTelemetryService } from "../../super-admin/services/feature-telemetry.service.js";
export class AIAssistantController {
    service;
    courseBuilderService;
    constructor(service, courseBuilderService = new AICourseBuilderService()) {
        this.service = service;
        this.courseBuilderService = courseBuilderService;
    }
    chat = async (request, reply) => {
        const user = request.user;
        const body = request.body || {};
        const promptText = body.message || body.query || body.question || body.prompt;
        if (!promptText || typeof promptText !== "string" || !promptText.trim()) {
            return reply.status(400).send({
                success: false,
                message: "Message or query prompt is required",
            });
        }
        const conversation = await this.service.chat(user.organizationId, user.userId, user.role || "employee", promptText.trim(), body.conversationId);
        const lastAssistantMsg = conversation.messages
            .slice()
            .reverse()
            .find((m) => m.sender === "assistant");
        const answer = lastAssistantMsg?.content || "";
        const sources = (lastAssistantMsg?.citations || []).map((c) => ({
            id: c.articleId,
            title: c.title,
            url: c.url,
        }));
        return reply.status(200).send({
            success: true,
            message: "AI response generated successfully",
            answer,
            sources,
            data: conversation,
        });
    };
    getConversations = async (request, reply) => {
        const user = request.user;
        const conversations = await this.service.getConversations(user.organizationId, user.userId);
        return reply.status(200).send({
            success: true,
            message: "AI conversations retrieved successfully",
            data: conversations,
        });
    };
    getConversationById = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const conversation = await this.service.getConversationById(user.organizationId, user.userId, params.id);
        if (!conversation) {
            return reply.status(404).send({
                success: false,
                message: "Conversation not found",
            });
        }
        return reply.status(200).send({
            success: true,
            message: "AI conversation thread retrieved successfully",
            data: conversation,
        });
    };
    logFeedback = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const conversation = await this.service.logFeedback(user.organizationId, user.userId, body.conversationId, body.messageId, body.rating, body.comment);
        return reply.status(200).send({
            success: true,
            message: "Feedback logged successfully",
            data: conversation,
        });
    };
    generateCourseDraft = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        if (!body?.prompt || typeof body.prompt !== "string" || !body.prompt.trim()) {
            return reply.status(400).send({
                success: false,
                message: "Prompt is required for course generation",
            });
        }
        const draft = await this.courseBuilderService.generateJourneyOutline(user.organizationId, user.userId, body.prompt, body.targetRole, body.department, body.level || body.difficulty || "Intermediate", Number(body.moduleCount || body.modulesCount || body.modules || 3));
        const statusCode = request.url.includes("course-builder") ? 201 : 200;
        // Instrument feature telemetry (fire-and-forget)
        FeatureTelemetryService.recordUsage({
            featureKey: "ai_course_builder",
            organizationId: user.organizationId,
            userId: user.userId || user.id,
            userRole: user.role || "admin",
            actionName: "GENERATE_AI_COURSE",
            metadata: {
                draftId: draft?._id || draft?.id,
                level: body.level || body.difficulty,
                department: body.department,
            },
        }).catch(() => { });
        return reply.status(statusCode).send({
            success: true,
            message: "AI course draft generated successfully",
            data: draft,
        });
    };
    getCourseDrafts = async (request, reply) => {
        const user = request.user;
        const drafts = await this.courseBuilderService.getDrafts(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "AI course drafts retrieved successfully",
            data: drafts,
        });
    };
    getCourseDraftById = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const draft = await this.courseBuilderService.getDraftById(user.organizationId, params.id);
        if (!draft) {
            return reply.status(404).send({
                success: false,
                message: "Course draft not found",
            });
        }
        return reply.status(200).send({
            success: true,
            message: "AI course draft retrieved successfully",
            data: draft,
        });
    };
    regenerateModule = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const draft = await this.courseBuilderService.regenerateModule(user.organizationId, user.userId, params.id, body.moduleId);
        return reply.status(200).send({
            success: true,
            message: "Module regenerated successfully",
            data: draft,
        });
    };
    publishCourseDraft = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const result = await this.courseBuilderService.publishDraftToJourney(user.organizationId, user.userId, params.id);
        return reply.status(200).send({
            success: true,
            message: "Course draft published to live Journeys successfully",
            data: result,
        });
    };
    deleteCourseDraft = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        await this.courseBuilderService.deleteDraft(user.organizationId, params.id);
        return reply.status(200).send({
            success: true,
            message: "Course draft deleted successfully",
        });
    };
}
