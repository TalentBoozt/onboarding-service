import { GamificationController } from "../controllers/gamification.controller.js";
import { GamificationService } from "../services/gamification.service.js";
import { authenticate, requireFeatureFlag } from "../../../middleware/auth.middleware.js";
export async function gamificationRoutes(app) {
    const service = new GamificationService();
    const controller = new GamificationController(service);
    // Authenticate all routes
    app.addHook("preHandler", authenticate);
    app.addHook("preHandler", requireFeatureFlag("gamified_milestones"));
    // GET /api/v1/gamification/profile
    app.get("/profile", controller.getProfile);
    // POST /api/v1/gamification/award-points
    app.post("/award-points", controller.awardPoints);
    // POST /api/v1/gamification/streak
    app.post("/streak", controller.recordStreak);
    // GET /api/v1/gamification/leaderboard
    app.get("/leaderboard", controller.getLeaderboard);
}
export default gamificationRoutes;
