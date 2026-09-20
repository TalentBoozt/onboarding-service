import AppError from "../../../common/errors/app-error.js";
import { appConfig } from "../../../config/index.js";
import EmailService from "../../../shared/email/email.service.js";
import PlatformSetting from "../../super-admin/models/platform-setting.model.js";
export class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    login = async (request, reply) => {
        const { email, password } = request.body;
        const ipAddress = request.ip;
        const deviceInfo = request.headers["user-agent"];
        const result = await this.authService.login(email, password, ipAddress, deviceInfo);
        // Platform Maintenance Mode check: block non-super-admins
        const platformSetting = await PlatformSetting.findOne({ singleton: true });
        if (platformSetting?.maintenanceMode && result.user.role !== "super_admin") {
            throw new AppError(503, "MAINTENANCE_MODE", platformSetting.maintenanceMessage || "Talnova Onboarding is undergoing planned infrastructure maintenance.");
        }
        // Set refresh token cookie
        reply.setCookie("refreshToken", result.refreshToken, {
            path: "/api/v1/auth",
            httpOnly: true,
            secure: appConfig.isProduction,
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        return reply.status(200).send({
            success: true,
            message: "Login successful",
            data: {
                accessToken: result.accessToken,
                user: result.user,
            },
        });
    };
    refresh = async (request, reply) => {
        const refreshToken = request.cookies.refreshToken;
        if (!refreshToken) {
            throw new AppError(401, "UNAUTHORIZED", "Refresh token missing");
        }
        try {
            const result = await this.authService.refresh(refreshToken);
            // Set new rotated refresh token cookie
            reply.setCookie("refreshToken", result.refreshToken, {
                path: "/api/v1/auth",
                httpOnly: true,
                secure: appConfig.isProduction,
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });
            return reply.status(200).send({
                success: true,
                message: "Token refreshed successfully",
                data: {
                    accessToken: result.accessToken,
                },
            });
        }
        catch (error) {
            // Clear cookie on failed refresh
            reply.clearCookie("refreshToken", {
                path: "/api/v1/auth",
            });
            throw error;
        }
    };
    logout = async (request, reply) => {
        // If authenticated, invalidate session using the request.user payload
        const user = request.user;
        if (user?.sessionId) {
            await this.authService.logout(user.sessionId);
        }
        // Always clear the cookie
        reply.clearCookie("refreshToken", {
            path: "/api/v1/auth",
        });
        return reply.status(200).send({
            success: true,
            message: "Logout successful",
            data: null,
        });
    };
    forgotPassword = async (request, reply) => {
        const { email } = request.body;
        const emailService = new EmailService();
        await this.authService.forgotPassword(email, emailService);
        return reply.status(200).send({
            success: true,
            message: "If the email is registered, a password reset link has been sent.",
            data: null,
        });
    };
    resetPassword = async (request, reply) => {
        const { token, password } = request.body;
        await this.authService.resetPassword(token, password);
        return reply.status(200).send({
            success: true,
            message: "Password reset successful.",
            data: null,
        });
    };
}
export default AuthController;
