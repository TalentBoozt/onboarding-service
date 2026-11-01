import ContactService from "../services/contact.service.js";
import AppError from "../../../common/errors/app-error.js";
import { createContactSchema, updateContactSchema, contactQuerySchema, } from "../schemas/contact.schemas.js";
export class ContactController {
    service;
    constructor(service = new ContactService()) {
        this.service = service;
    }
    /**
     * GET /api/v1/sales/contacts
     */
    getContacts = async (request, reply) => {
        const parseResult = contactQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const result = await this.service.getContacts(parseResult.data);
        return reply.status(200).send({
            success: true,
            data: result,
        });
    };
    /**
     * GET /api/v1/sales/contacts/:id
     */
    getContactById = async (request, reply) => {
        const { id } = request.params;
        const contact = await this.service.getContactById(id);
        return reply.status(200).send({
            success: true,
            data: contact,
        });
    };
    /**
     * POST /api/v1/sales/contacts
     */
    createContact = async (request, reply) => {
        const parseResult = createContactSchema.safeParse(request.body);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const actorUserId = request.user?.userId;
        const contact = await this.service.createContact(parseResult.data, actorUserId);
        return reply.status(201).send({
            success: true,
            message: "Contact created successfully",
            data: contact,
        });
    };
    /**
     * PATCH /api/v1/sales/contacts/:id
     */
    updateContact = async (request, reply) => {
        const { id } = request.params;
        const parseResult = updateContactSchema.safeParse(request.body);
        if (!parseResult.success) {
            const details = parseResult.error.errors.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            throw new AppError(400, "VALIDATION_ERROR", "Validation failed", details);
        }
        const actorUserId = request.user?.userId;
        const contact = await this.service.updateContact(id, parseResult.data, actorUserId);
        return reply.status(200).send({
            success: true,
            message: "Contact updated successfully",
            data: contact,
        });
    };
    /**
     * DELETE /api/v1/sales/contacts/:id
     */
    deleteContact = async (request, reply) => {
        const { id } = request.params;
        const actorUserId = request.user?.userId;
        const result = await this.service.deleteContact(id, actorUserId);
        return reply.status(200).send({
            success: true,
            message: "Contact deleted successfully",
            data: result,
        });
    };
}
export default ContactController;
