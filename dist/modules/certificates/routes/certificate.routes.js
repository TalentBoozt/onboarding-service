import { CertificateController } from "../controllers/certificate.controller.js";
import { authenticate } from "../../../middleware/auth.middleware.js";
export async function certificateRoutes(app) {
    const controller = new CertificateController();
    // Public verification endpoints
    app.get("/public/:id", controller.getPublicCertificate);
    app.get("/verify/:id", controller.getPublicCertificate);
    // Authenticated employee endpoints
    app.register(async (authApp) => {
        authApp.addHook("preHandler", authenticate);
        authApp.get("/me", controller.getMyCertificates);
    });
}
export default certificateRoutes;
