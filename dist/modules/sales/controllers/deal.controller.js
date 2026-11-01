import DealService from "../services/deal.service.js";
import OnboardingHandoffService from "../services/onboarding-handoff.service.js";
import AppError from "../../../common/errors/app-error.js";
import { createDealSchema, updateDealSchema, updateDealStageSchema, dealQuerySchema, kanbanQuerySchema, pipelineSummaryQuerySchema, } from "../schemas/deal.schemas.js";
export class DealController {
    service;
    handoffService;
    constructor(service = new DealService(), handoffService = new OnboardingHandoffService()) {
        this.service = service;
        this.handoffService = handoffService;
    }
    /**
     * GET /api/v1/sales/deals
     */
    getDeals = async (request, reply) => {
        const parseResult = dealQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const result = await this.service.getDeals(parseResult.data);
        return reply.status(200).send({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    };
    /**
     * GET /api/v1/sales/deals/kanban
     */
    getKanbanBoard = async (request, reply) => {
        const parseResult = kanbanQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const kanban = await this.service.getKanbanBoard(parseResult.data);
        return reply.status(200).send({
            success: true,
            data: kanban,
        });
    };
    /**
     * GET /api/v1/sales/deals/summary
     */
    getPipelineSummary = async (request, reply) => {
        const parseResult = pipelineSummaryQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const summary = await this.service.getPipelineSummary(parseResult.data);
        return reply.status(200).send({
            success: true,
            data: summary,
        });
    };
    /**
     * GET /api/v1/sales/deals/:id
     */
    getDealById = async (request, reply) => {
        const { id } = request.params;
        const deal = await this.service.getDealById(id);
        return reply.status(200).send({
            success: true,
            data: deal,
        });
    };
    /**
     * POST /api/v1/sales/deals
     */
    createDeal = async (request, reply) => {
        const parseResult = createDealSchema.safeParse(request.body);
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
        const deal = await this.service.createDeal(parseResult.data, actorId);
        return reply.status(201).send({
            success: true,
            data: deal,
        });
    };
    /**
     * PATCH /api/v1/sales/deals/:id
     */
    updateDeal = async (request, reply) => {
        const { id } = request.params;
        const parseResult = updateDealSchema.safeParse(request.body);
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
        const updated = await this.service.updateDeal(id, parseResult.data, actorId);
        return reply.status(200).send({
            success: true,
            data: updated,
        });
    };
    /**
     * PATCH /api/v1/sales/deals/:id/stage
     */
    updateDealStage = async (request, reply) => {
        const { id } = request.params;
        const parseResult = updateDealStageSchema.safeParse(request.body);
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
        const updated = await this.service.updateDealStage(id, parseResult.data, actorId);
        return reply.status(200).send({
            success: true,
            data: updated,
        });
    };
    /**
     * DELETE /api/v1/sales/deals/:id
     */
    deleteDeal = async (request, reply) => {
        const { id } = request.params;
        const actorId = request.user?.id ||
            request.user?._id?.toString() ||
            request.user?.userId;
        const result = await this.service.deleteDeal(id, actorId);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    /**
     * POST /api/v1/sales/deals/:id/handoff
     */
    handoffDeal = async (request, reply) => {
        const { id } = request.params;
        const body = (request.body || {});
        const actorId = request.user?.id ||
            request.user?._id?.toString() ||
            request.user?.userId;
        const result = await this.handoffService.handoffDeal(id, actorId, body);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
}
export default DealController;
