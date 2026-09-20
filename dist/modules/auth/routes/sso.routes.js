import { SSOController } from "../controllers/sso.controller.js";
import { SSOService } from "../services/sso.service.js";
import { authenticate, requireRole } from "../../../middleware/auth.middleware.js";
export async function ssoRoutes(app) {
    const service = new SSOService();
    const controller = new SSOController(service);
    // Public Endpoints (Domain Discovery, Initiate & Callback)
    app.post("/discover", controller.discoverDomain);
    app.post("/initiate", controller.initiateSSO);
    app.post("/callback", controller.handleCallback);
    // Admin Configuration Endpoints (Protected)
    app.get("/config", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.getSSOConfig);
    app.put("/config", { preHandler: [authenticate, requireRole(["owner", "admin"])] }, controller.saveSSOConfig);
}
export default ssoRoutes;
