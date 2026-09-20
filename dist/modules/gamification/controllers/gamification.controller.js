export class GamificationController {
    service;
    constructor(service) {
        this.service = service;
    }
    getProfile = async (request, reply) => {
        const user = request.user;
        const profile = await this.service.getProfile(user.organizationId, user.userId);
        return reply.status(200).send({
            success: true,
            message: "Gamification profile retrieved successfully",
            data: profile,
        });
    };
    awardPoints = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const profile = await this.service.awardPoints(user.organizationId, user.userId, body.action || "general_activity", body.points || 10, body.description || "Completed onboarding activity");
        return reply.status(200).send({
            success: true,
            message: "Points awarded successfully",
            data: profile,
        });
    };
    recordStreak = async (request, reply) => {
        const user = request.user;
        const profile = await this.service.recordActivityStreak(user.organizationId, user.userId);
        return reply.status(200).send({
            success: true,
            message: "Activity streak recorded successfully",
            data: profile,
        });
    };
    getLeaderboard = async (request, reply) => {
        const user = request.user;
        const leaderboard = await this.service.getLeaderboard(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "Organization leaderboard retrieved successfully",
            data: leaderboard,
        });
    };
}
