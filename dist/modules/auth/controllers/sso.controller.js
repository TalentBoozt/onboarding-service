import { SSOService } from "../services/sso.service.js";
export class SSOController {
    ssoService;
    constructor(ssoService) {
        this.ssoService = ssoService;
    }
    getSSOConfig = async (request, reply) => {
        const user = request.user;
        const config = await this.ssoService.getSSOConfig(user.organizationId);
        return reply.status(200).send({
            success: true,
            message: "SSO configuration retrieved successfully",
            data: config,
        });
    };
    saveSSOConfig = async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const config = await this.ssoService.saveSSOConfig(user.organizationId, user.userId, body);
        return reply.status(200).send({
            success: true,
            message: "SSO configuration saved successfully",
            data: config,
        });
    };
    discoverDomain = async (request, reply) => {
        const body = (request.body || {});
        const emailOrDomain = body.domain || body.email;
        if (!emailOrDomain || typeof emailOrDomain !== "string") {
            return reply.status(400).send({
                success: false,
                message: "Email address or domain is required for domain discovery",
            });
        }
        const discovery = await this.ssoService.discoverDomainSSO(emailOrDomain);
        return reply.status(200).send({
            success: true,
            message: "SSO domain discovery processed successfully",
            data: discovery,
        });
    };
    initiateSSO = async (request, reply) => {
        const body = (request.body || {});
        const emailOrDomain = body.email || body.domain;
        if (!emailOrDomain || typeof emailOrDomain !== "string") {
            return reply.status(400).send({
                success: false,
                message: "Email address or domain is required to initiate SSO",
            });
        }
        const result = await this.ssoService.initiateSSOLogin(emailOrDomain);
        return reply.status(200).send({
            success: true,
            message: "SSO login initiated successfully",
            data: result,
        });
    };
    handleCallback = async (request, reply) => {
        const body = request.body;
        if (!body.organizationId || !body.email) {
            return reply.status(400).send({
                success: false,
                message: "Organization ID and Email are required for SSO callback",
            });
        }
        const service = new SSOService(undefined, undefined, request.server.jwt);
        const result = await service.handleSSOCallback(body.organizationId, {
            email: body.email,
            firstName: body.firstName || "SSO",
            lastName: body.lastName || "User",
            department: body.department,
            role: body.role,
            authProvider: body.authProvider || body.provider,
            ssoId: body.ssoId || `sso_${Date.now()}`,
            idpGroups: body.idpGroups || [],
        }, request.ip, request.headers["user-agent"]);
        return reply.status(200).send({
            success: true,
            message: "SSO authentication successful",
            data: result,
        });
    };
}
