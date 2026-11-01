import TaskService from "../services/task.service.js";
import AppError from "../../../common/errors/app-error.js";
import { createTaskSchema, updateTaskSchema, completeTaskSchema, taskQuerySchema, calendarQuerySchema, } from "../schemas/task.schemas.js";
export class TaskController {
    service;
    constructor(service = new TaskService()) {
        this.service = service;
    }
    /**
     * GET /api/v1/sales/tasks
     */
    getTasks = async (request, reply) => {
        const parseResult = taskQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const result = await this.service.getTasks(parseResult.data);
        return reply.status(200).send({
            success: true,
            data: result.items,
            pagination: result.pagination,
            counters: result.counters,
        });
    };
    /**
     * GET /api/v1/sales/tasks/calendar
     */
    getCalendarTasks = async (request, reply) => {
        const parseResult = calendarQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const calendar = await this.service.getCalendarTasks(parseResult.data);
        return reply.status(200).send({
            success: true,
            data: calendar,
        });
    };
    /**
     * GET /api/v1/sales/tasks/:id
     */
    getTaskById = async (request, reply) => {
        const { id } = request.params;
        const task = await this.service.getTaskById(id);
        return reply.status(200).send({
            success: true,
            data: task,
        });
    };
    /**
     * POST /api/v1/sales/tasks
     */
    createTask = async (request, reply) => {
        const parseResult = createTaskSchema.safeParse(request.body);
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
        const task = await this.service.createTask(parseResult.data, actorId);
        return reply.status(201).send({
            success: true,
            data: task,
        });
    };
    /**
     * PATCH /api/v1/sales/tasks/:id
     */
    updateTask = async (request, reply) => {
        const { id } = request.params;
        const parseResult = updateTaskSchema.safeParse(request.body);
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
        const task = await this.service.updateTask(id, parseResult.data, actorId);
        return reply.status(200).send({
            success: true,
            data: task,
        });
    };
    /**
     * PATCH /api/v1/sales/tasks/:id/complete
     */
    completeTask = async (request, reply) => {
        const { id } = request.params;
        const parseResult = completeTaskSchema.safeParse(request.body || {});
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
        const task = await this.service.completeTask(id, parseResult.data, actorId);
        return reply.status(200).send({
            success: true,
            data: task,
        });
    };
    /**
     * DELETE /api/v1/sales/tasks/:id
     */
    deleteTask = async (request, reply) => {
        const { id } = request.params;
        const actorId = request.user?.id ||
            request.user?._id?.toString() ||
            request.user?.userId;
        const result = await this.service.deleteTask(id, actorId);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
}
export default TaskController;
