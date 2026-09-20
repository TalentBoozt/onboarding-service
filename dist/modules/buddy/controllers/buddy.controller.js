import { FeatureTelemetryService } from "../../super-admin/services/feature-telemetry.service.js";
export class BuddyController {
    buddyService;
    constructor(buddyService) {
        this.buddyService = buddyService;
    }
    registerProfile = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        // Authorization check: User can only modify their own buddy profile
        if (body.userId && body.userId !== user.userId && user.role !== "admin" && user.role !== "owner") {
            return reply.status(403).send({
                success: false,
                code: "FORBIDDEN",
                message: "User can only modify their own buddy profile",
            });
        }
        const targetUserId = body.userId && (user.role === "admin" || user.role === "owner") ? body.userId : user.userId;
        const profile = await this.buddyService.registerBuddyProfile(user.organizationId, targetUserId, body);
        const profileObj = profile.toObject ? profile.toObject() : profile;
        return reply.status(200).send({
            success: true,
            message: "Buddy profile updated successfully",
            data: profile,
            profile: {
                ...profileObj,
                userId: profile.userId,
                maxMentees: profile.maxMentees,
                isActive: profile.isAvailable,
            },
        });
    };
    getMyProfile = async (request, reply) => {
        const user = request.user;
        const profile = await this.buddyService.getBuddyProfile(user.organizationId, user.userId);
        const profileObj = profile ? (profile.toObject ? profile.toObject() : profile) : null;
        return reply.status(200).send({
            success: true,
            message: "My buddy profile retrieved successfully",
            data: profile,
            profile: profileObj ? {
                ...profileObj,
                userId: profile.userId,
                maxMentees: profile.maxMentees,
                isActive: profile.isAvailable,
            } : null,
        });
    };
    listAvailableBuddies = async (request, reply) => {
        const user = request.user;
        const buddies = await this.buddyService.listAvailableBuddies(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Available buddies retrieved successfully",
            data: buddies,
        });
    };
    listOrganizationAssignments = async (request, reply) => {
        const user = request.user;
        const assignments = await this.buddyService.listOrganizationAssignments(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Organization buddy assignments retrieved successfully",
            data: assignments,
        });
    };
    assignBuddy = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const newHireUserId = body.newHireUserId || body.employeeId;
        const buddyUserId = body.buddyUserId || body.buddyId;
        const templateName = body.templateName || body.checklistTemplate;
        const assignment = await this.buddyService.assignBuddy(user.organizationId, newHireUserId, buddyUserId, user.userId, templateName);
        const assignmentObj = assignment.toObject ? assignment.toObject() : assignment;
        // Instrument feature telemetry (fire-and-forget)
        FeatureTelemetryService.recordUsage({
            featureKey: "buddy_assignment",
            organizationId: user.organizationId,
            userId: user.userId || user.id,
            userRole: user.role || "admin",
            actionName: "ASSIGN_BUDDY",
            metadata: {
                newHireUserId,
                buddyUserId,
                templateName,
            },
        }).catch(() => { });
        return reply.status(201).send({
            success: true,
            message: "Buddy assigned to new hire successfully",
            data: assignment,
            assignment: {
                ...assignmentObj,
                buddyId: assignment.buddyUserId,
                employeeId: assignment.newHireUserId,
                status: assignment.status,
            },
        });
    };
    getEmployeeBuddy = async (request, reply) => {
        const user = request.user;
        const assignment = await this.buddyService.getEmployeeBuddy(user.organizationId, user.userId);
        return reply.status(200).send({
            success: true,
            message: "Assigned buddy retrieved successfully",
            data: assignment,
        });
    };
    getBuddyMentees = async (request, reply) => {
        const user = request.user;
        const mentees = await this.buddyService.getBuddyMentees(user.organizationId, user.userId);
        return reply.status(200).send({
            success: true,
            message: "Assigned mentees retrieved successfully",
            data: mentees,
        });
    };
    updateChecklistTask = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const assignment = await this.buddyService.updateChecklistTask(user.organizationId, params.id, body.taskId, body.completed, user.userId, user.role);
        return reply.status(200).send({
            success: true,
            message: "Buddy checklist item updated successfully",
            data: assignment,
        });
    };
    addCustomChecklistTask = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const assignment = await this.buddyService.addCustomChecklistTask(user.organizationId, params.id, body, user.userId, user.role);
        return reply.status(200).send({
            success: true,
            message: "Custom task added to buddy checklist successfully",
            data: assignment,
        });
    };
    logBuddyCheckin = async (request, reply) => {
        const user = request.user;
        const params = request.params;
        const body = request.body;
        const assignment = await this.buddyService.logBuddyCheckin(user.organizationId, params.id, body, user.userId, user.role);
        return reply.status(200).send({
            success: true,
            message: "1-on-1 buddy check-in logged successfully",
            data: assignment,
        });
    };
}
