import WorkflowRule from "../models/workflow-rule.model.js";
import WorkflowExecutionLog from "../models/workflow-execution.model.js";
import mongoose from "mongoose";
export class WorkflowRepository {
    async findRules(orgId, triggerType, onlyActive = false) {
        const query = {
            organizationId: new mongoose.Types.ObjectId(orgId),
            isDeleted: false,
        };
        if (triggerType) {
            query.triggerType = triggerType;
        }
        if (onlyActive) {
            query.isActive = true;
        }
        return WorkflowRule.find(query)
            .populate("createdBy", "profile auth.email")
            .sort({ priority: -1, createdAt: -1 });
    }
    async findRuleById(id, orgId) {
        return WorkflowRule.findOne({ _id: id, organizationId: orgId, isDeleted: false }).populate("createdBy", "profile auth.email");
    }
    async createRule(data) {
        const rule = new WorkflowRule(data);
        return rule.save();
    }
    async updateRule(id, orgId, data) {
        return WorkflowRule.findOneAndUpdate({ _id: id, organizationId: orgId, isDeleted: false }, { $set: data, $inc: { version: 1 } }, { new: true });
    }
    async toggleRuleActive(id, orgId, isActive) {
        return WorkflowRule.findOneAndUpdate({ _id: id, organizationId: orgId, isDeleted: false }, { $set: { isActive } }, { new: true });
    }
    async softDeleteRule(id, orgId) {
        return WorkflowRule.findOneAndUpdate({ _id: id, organizationId: orgId, isDeleted: false }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true });
    }
    async createExecutionLog(data) {
        const log = new WorkflowExecutionLog(data);
        return log.save();
    }
    async findExecutionLogs(orgId, ruleId, pagination = { page: 1, limit: 50 }) {
        const query = {
            organizationId: new mongoose.Types.ObjectId(orgId),
        };
        if (ruleId) {
            query.workflowRuleId = new mongoose.Types.ObjectId(ruleId);
        }
        const total = await WorkflowExecutionLog.countDocuments(query);
        const page = Math.max(1, pagination.page);
        const limit = Math.max(1, pagination.limit);
        const skip = (page - 1) * limit;
        const logs = await WorkflowExecutionLog.find(query)
            .populate("workflowRuleId", "name triggerType")
            .populate("targetUserId", "profile auth.email employment")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return { logs, total };
    }
}
export default WorkflowRepository;
