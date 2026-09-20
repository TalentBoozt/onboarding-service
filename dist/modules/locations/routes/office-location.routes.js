import { OfficeLocationController } from "../controllers/office-location.controller.js";
import { OfficeLocationService } from "../services/office-location.service.js";
import { authenticate, requireRole, requireFeatureFlag } from "../../../middleware/auth.middleware.js";
export async function officeLocationRoutes(app) {
    const service = new OfficeLocationService();
    const controller = new OfficeLocationController(service);
    app.addHook("preHandler", authenticate);
    // Office Map & Employee Location Guidance (LOC-004, UJ-OPS-002)
    app.get("/office-map", { preHandler: [requireFeatureFlag("office_map")] }, controller.getOfficeMap);
    app.get("/my-location", { preHandler: [requireFeatureFlag("office_map")] }, controller.getEmployeeGuidance);
    // Location Management (LOC-001, LOC-002, LOC-003)
    app.get("/", controller.getLocations);
    app.get("/:id", controller.getLocationById);
    app.post("/", { preHandler: [requireRole(["owner", "admin"])] }, controller.createLocation);
    app.put("/:id", { preHandler: [requireRole(["owner", "admin"])] }, controller.updateLocation);
    app.delete("/:id", { preHandler: [requireRole(["owner", "admin"])] }, controller.deleteLocation);
    app.post("/:id/assign-desk", { preHandler: [requireRole(["owner", "admin", "manager"])] }, controller.assignDesk);
}
export default officeLocationRoutes;
