import { EmployeeController } from "../controllers/employee.controller.js";
import { EmployeeService } from "../services/employee.service.js";
import { EmployeeRepository } from "../repositories/employee.repository.js";
import { authenticate, requireRole } from "../../../middleware/auth.middleware.js";
import { updateProfileSchema, updatePreferencesSchema, changePasswordSchema, inviteEmployeeSchema, updateEmployeeSchema, importEmployeesSchema, validateBulkImportSchema, } from "../schemas/employee.schema.js";
export async function employeeRoutes(app) {
    const repository = new EmployeeRepository();
    const service = new EmployeeService(repository);
    const controller = new EmployeeController(service);
    // Authenticate all routes
    app.addHook("preHandler", authenticate);
    // User Self Profile Routes
    app.get("/me", controller.getMe);
    app.patch("/me", { schema: { body: updateProfileSchema } }, controller.updateMe);
    app.patch("/preferences", { schema: { body: updatePreferencesSchema } }, controller.updatePreferences);
    app.patch("/me/preferences", { schema: { body: updatePreferencesSchema } }, controller.updatePreferences);
    app.patch("/me/password", { schema: { body: changePasswordSchema } }, controller.changePassword);
    // Directory & Administration Routes
    app.get("/", { preHandler: [requireRole(["owner", "admin", "hr_admin", "manager", "it_admin"])] }, controller.listEmployees);
    app.post("/invite", {
        preHandler: [requireRole(["owner", "admin", "hr_admin"])],
        schema: { body: inviteEmployeeSchema },
    }, controller.inviteEmployee);
    app.post("/bulk/validate", {
        preHandler: [requireRole(["owner", "admin", "hr_admin"])],
        schema: { body: validateBulkImportSchema },
    }, controller.validateBulkImport);
    app.post("/import", {
        preHandler: [requireRole(["owner", "admin", "hr_admin"])],
        schema: { body: importEmployeesSchema },
    }, controller.importEmployees);
    app.get("/:id", { preHandler: [requireRole(["owner", "admin", "hr_admin", "manager"])] }, controller.getEmployee);
    app.patch("/:id", {
        preHandler: [requireRole(["owner", "admin", "hr_admin"])],
        schema: { body: updateEmployeeSchema },
    }, controller.updateEmployee);
    app.delete("/:id", { preHandler: [requireRole(["owner", "admin"])] }, controller.deleteEmployee);
    app.post("/:id/legal-hold", { preHandler: [requireRole(["owner", "admin"])] }, controller.setLegalHold);
}
export default employeeRoutes;
