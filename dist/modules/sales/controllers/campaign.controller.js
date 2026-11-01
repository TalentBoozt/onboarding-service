import CampaignService from "../services/campaign.service.js";
import AudienceSegmentationService from "../services/audience-segmentation.service.js";
import CampaignDispatcherService from "../services/campaign-dispatcher.service.js";
import AppError from "../../../common/errors/app-error.js";
import { createCampaignSchema, updateCampaignSchema, updateCampaignStatusSchema, cloneCampaignSchema, addRecipientsSchema, campaignQuerySchema, createTemplateSchema, updateTemplateSchema, templateQuerySchema, previewTemplateSchema, audienceEstimateSchema, audienceResolveSchema, launchCampaignOptionsSchema, } from "../schemas/campaign.schemas.js";
export class CampaignController {
    service;
    audienceService;
    dispatcherService;
    constructor(service = new CampaignService(), audienceService = new AudienceSegmentationService(), dispatcherService = new CampaignDispatcherService()) {
        this.service = service;
        this.audienceService = audienceService;
        this.dispatcherService = dispatcherService;
    }
    // ==========================================
    // CAMPAIGNS
    // ==========================================
    getCampaigns = async (request, reply) => {
        const parseResult = campaignQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const result = await this.service.getCampaigns(parseResult.data);
        return reply.status(200).send({
            success: true,
            data: result.items,
            pagination: result.pagination,
            counters: result.statusCounters,
        });
    };
    getCampaignById = async (request, reply) => {
        const { id } = request.params;
        const campaign = await this.service.getCampaignById(id);
        return reply.status(200).send({
            success: true,
            data: campaign,
        });
    };
    createCampaign = async (request, reply) => {
        const parseResult = createCampaignSchema.safeParse(request.body);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const actorId = request.user?.id ||
            request.user?._id?.toString() ||
            request.user?.userId;
        const campaign = await this.service.createCampaign(parseResult.data, actorId);
        return reply.status(201).send({
            success: true,
            data: campaign,
        });
    };
    updateCampaign = async (request, reply) => {
        const { id } = request.params;
        const parseResult = updateCampaignSchema.safeParse(request.body);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const actorId = request.user?.id ||
            request.user?._id?.toString() ||
            request.user?.userId;
        const campaign = await this.service.updateCampaign(id, parseResult.data, actorId);
        return reply.status(200).send({
            success: true,
            data: campaign,
        });
    };
    updateCampaignStatus = async (request, reply) => {
        const { id } = request.params;
        const parseResult = updateCampaignStatusSchema.safeParse(request.body);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const actorId = request.user?.id ||
            request.user?._id?.toString() ||
            request.user?.userId;
        const campaign = await this.service.updateCampaignStatus(id, parseResult.data.status, actorId);
        return reply.status(200).send({
            success: true,
            data: campaign,
        });
    };
    cloneCampaign = async (request, reply) => {
        const { id } = request.params;
        const parseResult = cloneCampaignSchema.safeParse(request.body || {});
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const actorId = request.user?.id ||
            request.user?._id?.toString() ||
            request.user?.userId;
        const campaign = await this.service.cloneCampaign(id, parseResult.data, actorId);
        return reply.status(201).send({
            success: true,
            data: campaign,
        });
    };
    addRecipients = async (request, reply) => {
        const { id } = request.params;
        const parseResult = addRecipientsSchema.safeParse(request.body);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const result = await this.service.addRecipients(id, parseResult.data.recipients);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    deleteCampaign = async (request, reply) => {
        const { id } = request.params;
        const actorId = request.user?.id ||
            request.user?._id?.toString() ||
            request.user?.userId;
        const result = await this.service.deleteCampaign(id, actorId);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    // ==========================================
    // TEMPLATES
    // ==========================================
    getTemplates = async (request, reply) => {
        const parseResult = templateQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const result = await this.service.getTemplates(parseResult.data);
        return reply.status(200).send({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    };
    getTemplateById = async (request, reply) => {
        const { id } = request.params;
        const template = await this.service.getTemplateById(id);
        return reply.status(200).send({
            success: true,
            data: template,
        });
    };
    createTemplate = async (request, reply) => {
        const parseResult = createTemplateSchema.safeParse(request.body);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const actorId = request.user?.id ||
            request.user?._id?.toString() ||
            request.user?.userId;
        const template = await this.service.createTemplate(parseResult.data, actorId);
        return reply.status(201).send({
            success: true,
            data: template,
        });
    };
    updateTemplate = async (request, reply) => {
        const { id } = request.params;
        const parseResult = updateTemplateSchema.safeParse(request.body);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const actorId = request.user?.id ||
            request.user?._id?.toString() ||
            request.user?.userId;
        const template = await this.service.updateTemplate(id, parseResult.data, actorId);
        return reply.status(200).send({
            success: true,
            data: template,
        });
    };
    deleteTemplate = async (request, reply) => {
        const { id } = request.params;
        const actorId = request.user?.id ||
            request.user?._id?.toString() ||
            request.user?.userId;
        const result = await this.service.deleteTemplate(id, actorId);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    previewTemplate = async (request, reply) => {
        const parseResult = previewTemplateSchema.safeParse(request.body);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const result = await this.service.previewTemplate(parseResult.data);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    // ==========================================
    // AUDIENCE SEGMENTATION & SUPPRESSION
    // ==========================================
    estimateAudience = async (request, reply) => {
        const parseResult = audienceEstimateSchema.safeParse(request.body);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const result = await this.audienceService.estimateAudience(parseResult.data.filter, parseResult.data.sampleSize);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    resolveAudience = async (request, reply) => {
        const parseResult = audienceResolveSchema.safeParse(request.body);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const result = await this.audienceService.resolveAudienceRecipients(parseResult.data.filter, parseResult.data.limit);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    // ==========================================
    // DISPATCHER & BATCH EXECUTION
    // ==========================================
    launchCampaign = async (request, reply) => {
        const { id } = request.params;
        const parseResult = launchCampaignOptionsSchema.safeParse(request.body || {});
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const result = await this.dispatcherService.launchCampaign(id, parseResult.data);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    pauseCampaign = async (request, reply) => {
        const { id } = request.params;
        const result = await this.dispatcherService.pauseCampaign(id);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    resumeCampaign = async (request, reply) => {
        const { id } = request.params;
        const parseResult = launchCampaignOptionsSchema.safeParse(request.body || {});
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const result = await this.dispatcherService.resumeCampaign(id, parseResult.data);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    cancelCampaign = async (request, reply) => {
        const { id } = request.params;
        const result = await this.dispatcherService.cancelCampaign(id);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    getExecutionStatus = async (request, reply) => {
        const { id } = request.params;
        const result = await this.dispatcherService.getCampaignExecutionStatus(id);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
}
export default CampaignController;
