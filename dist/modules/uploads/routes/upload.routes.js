import { UploadController } from "../controllers/upload.controller.js";
import { UploadService } from "../services/upload.service.js";
import { UploadRepository } from "../repositories/upload.repository.js";
import { authenticate } from "../../../middleware/auth.middleware.js";
import { requestUploadUrlSchema, confirmUploadSchema } from "../schemas/upload.schema.js";
export async function uploadRoutes(app) {
    const repository = new UploadRepository();
    const service = new UploadService(repository);
    const controller = new UploadController(service);
    // Authenticate all routes
    app.addHook("preHandler", authenticate);
    // POST /api/v1/uploads/request-url
    app.post("/request-url", { schema: { body: requestUploadUrlSchema } }, controller.requestUploadUrl);
    // POST /api/v1/uploads/presigned
    app.post("/presigned", { schema: { body: requestUploadUrlSchema } }, controller.requestUploadUrl);
    // POST /api/v1/uploads/complete
    app.post("/complete", { schema: { body: confirmUploadSchema } }, controller.confirmUpload);
    // GET /api/v1/uploads/:id
    app.get("/:id", controller.getUpload);
    // GET /api/v1/uploads
    app.get("/", controller.listUploads);
    // DELETE /api/v1/uploads/:id
    app.delete("/:id", controller.deleteUpload);
}
export default uploadRoutes;
