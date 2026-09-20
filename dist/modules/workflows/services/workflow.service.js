import AppError from "../../../common/errors/app-error.js";
import mongoose from "mongoose";
import workflowEngine from "./workflow.engine.js";
export class WorkflowService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async listRules(orgId, triggerType) {
        return this.repository.findRules(orgId, triggerType);
    }
    async getRule(id, orgId) {
        const rule = await this.repository.findRuleById(id, orgId);
        if (!rule) {
            throw new AppError(404, "NOT_FOUND", "Workflow rule not found");
        }
        return rule;
    }
    async createRule(orgId, createdBy, data) {
        const name = data.name || data.title;
        if (!name || !name.trim()) {
            throw new AppError(400, "BAD_REQUEST", "Rule title or name is required");
        }
        let triggerType = (data.triggerType || "user_created").toLowerCase();
        if (triggerType === "on_user_created") {
            triggerType = "user_created";
        }
        const rawActions = data.actions || [];
        if (!Array.isArray(rawActions) || rawActions.length === 0) {
            throw new AppError(400, "BAD_REQUEST", "At least one action is required");
        }
        const actions = rawActions.map((act) => {
            const type = (act.type || "").toLowerCase();
            const journeyId = act.params?.journeyId ||
                act.targetTemplateId ||
                act.targetTemplate ||
                act.params?.targetTemplateId ||
                data.targetTemplateId;
            if (type === "assign_journey" && !journeyId) {
                throw new AppError(400, "BAD_REQUEST", "Target template is required for journey assignment");
            }
            return {
                type,
                params: {
                    ...act.params,
                    journeyId: journeyId || act.params?.journeyId,
                },
            };
        });
        const ruleData = {
            organizationId: new mongoose.Types.ObjectId(orgId),
            createdBy: new mongoose.Types.ObjectId(createdBy),
            name: name.trim(),
            description: data.description,
            triggerType: triggerType,
            conditions: data.conditions || [],
            actions,
            priority: data.priority !== undefined ? Number(data.priority) : 0,
            isActive: data.isActive ?? true,
            version: 1,
        };
        return this.repository.createRule(ruleData);
    }
    async updateRule(id, orgId, data) {
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.title !== undefined)
            updateData.name = data.title;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.triggerType !== undefined) {
            let t = data.triggerType.toLowerCase();
            if (t === "on_user_created")
                t = "user_created";
            updateData.triggerType = t;
        }
        if (data.conditions !== undefined)
            updateData.conditions = data.conditions;
        if (data.actions !== undefined) {
            updateData.actions = data.actions.map((act) => {
                const type = (act.type || "").toLowerCase();
                const journeyId = act.params?.journeyId ||
                    act.targetTemplateId ||
                    act.targetTemplate ||
                    act.params?.targetTemplateId;
                return {
                    type,
                    params: {
                        ...act.params,
                        journeyId: journeyId || act.params?.journeyId,
                    },
                };
            });
        }
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.priority !== undefined)
            updateData.priority = Number(data.priority);
        const rule = await this.repository.updateRule(id, orgId, updateData);
        if (!rule) {
            throw new AppError(404, "NOT_FOUND", "Workflow rule not found");
        }
        return rule;
    }
    async toggleRuleActive(id, orgId, isActive) {
        const rule = await this.repository.toggleRuleActive(id, orgId, isActive);
        if (!rule) {
            throw new AppError(404, "NOT_FOUND", "Workflow rule not found");
        }
        return rule;
    }
    async deleteRule(id, orgId) {
        const rule = await this.repository.softDeleteRule(id, orgId);
        if (!rule) {
            throw new AppError(404, "NOT_FOUND", "Workflow rule not found");
        }
        return rule;
    }
    async getExecutionLogs(orgId, ruleId, pagination = { page: 1, limit: 50 }) {
        return this.repository.findExecutionLogs(orgId, ruleId, pagination);
    }
    async triggerTestRun(id, orgId, targetUserId) {
        const rule = await this.getRule(id, orgId);
        const executedCount = await workflowEngine.processEvent(orgId, rule.triggerType, targetUserId, { isTestRun: true });
        return { executedCount, message: `Test run triggered for workflow "${rule.name}"` };
    }
}
export default WorkflowService;
