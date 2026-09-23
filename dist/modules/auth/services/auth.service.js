import AppError from "../../../common/errors/app-error.js";
import { verifyPassword, hashPassword } from "../../../utils/crypto.js";
import crypto from "crypto";
import { Organization } from "../../organizations/models/organization.model.js";
export class AuthService {
    userRepository;
    sessionRepository;
    jwt;
    constructor(userRepository, sessionRepository, jwt) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.jwt = jwt;
    }
    /**
     * Log in a user by verifying their credentials and starting an active session.
     */
    async login(email, password, ipAddress, deviceInfo) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new AppError(401, "UNAUTHORIZED", "Invalid email or password");
        }
        // Check if organization is suspended
        const org = await Organization.findById(user.organizationId);
        if (org && org.status === "Suspended") {
            throw new AppError(403, "FORBIDDEN", "Your organization has been suspended. Please contact support.");
        }
        // Check if account is locked
        if (user.security.lockedUntil && user.security.lockedUntil > new Date()) {
            const lockRemainingMinutes = Math.ceil((user.security.lockedUntil.getTime() - Date.now()) / (60 * 1000));
            throw new AppError(403, "FORBIDDEN", `Account is locked. Please try again in ${lockRemainingMinutes} minute(s).`);
        }
        // Verify Password
        const isValid = await verifyPassword(password, user.auth.passwordHash);
        if (!isValid) {
            // Increment failed login attempts
            const updatedUser = await this.userRepository.incrementFailedLogin(user._id);
            if (updatedUser && updatedUser.security.failedLoginAttempts >= 5) {
                const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lock
                await this.userRepository.lockAccount(user._id, lockedUntil);
                throw new AppError(403, "FORBIDDEN", "Account locked due to 5 consecutive failed login attempts. Try again in 15 minutes.");
            }
            throw new AppError(401, "UNAUTHORIZED", "Invalid email or password");
        }
        // Successful login - reset login failures and lock
        await this.userRepository.resetFailedLogin(user._id);
        // Create session (expires in 30 days)
        const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const session = await this.sessionRepository.create({
            userId: user._id,
            organizationId: user.organizationId,
            tokenVersion: 1,
            deviceInfo,
            ipAddress,
            expiresAt: sessionExpiresAt,
            isValid: true,
            lastActivityAt: new Date(),
        });
        // Update lastLoginAt
        await this.userRepository.update(user._id, {
            "auth.lastLoginAt": new Date(),
        });
        const userRoles = Array.from(new Set([
            user.permissions.role,
            ...(Array.isArray(user.permissions.roles) ? user.permissions.roles : []),
            ...(Array.isArray(user.permissions.customRoles) ? user.permissions.customRoles : []),
        ].filter(Boolean)));
        // Generate Tokens
        const payload = {
            userId: user._id.toString(),
            organizationId: user.organizationId.toString(),
            role: user.permissions.role,
            roles: userRoles,
            sessionId: session._id.toString(),
            tokenVersion: 1,
        };
        const accessToken = this.jwt.sign(payload, { expiresIn: "15m" });
        const refreshToken = this.jwt.sign(payload, { expiresIn: "30d" });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.auth.email,
                firstName: user.profile.firstName,
                lastName: user.profile.lastName,
                role: user.permissions.role,
                roles: userRoles,
                organizationId: user.organizationId,
            },
        };
    }
    /**
     * Refreshes the access token using the rotating refresh token mechanism.
     */
    async refresh(token) {
        let decoded;
        try {
            decoded = this.jwt.verify(token);
        }
        catch (error) {
            throw new AppError(401, "TOKEN_EXPIRED", "Session expired or invalid token");
        }
        const session = await this.sessionRepository.findById(decoded.sessionId);
        // If session doesn't exist, is invalid, or tokenVersion doesn't match (indicating reuse!)
        if (!session || !session.isValid || session.tokenVersion !== decoded.tokenVersion) {
            if (session) {
                // Break session and invalidate all active user sessions for security breach detection
                await this.sessionRepository.invalidateAllUserSessions(session.userId);
            }
            throw new AppError(401, "INVALID_TOKEN", "Authentication failed. Session terminated.");
        }
        // Rotate refresh token - Increment DB tokenVersion
        const updatedSession = await this.sessionRepository.incrementTokenVersion(session._id);
        if (!updatedSession) {
            throw new AppError(401, "INVALID_TOKEN", "Authentication failed");
        }
        // Retrieve user to carry correct role permissions
        const user = await this.userRepository.findById(session.userId);
        if (!user || user.employment.status === "inactive") {
            throw new AppError(401, "UNAUTHORIZED", "User profile inactive or deleted");
        }
        // Check if organization is suspended
        const org = await Organization.findById(user.organizationId);
        if (org && org.status === "Suspended") {
            throw new AppError(403, "FORBIDDEN", "Your organization has been suspended. Access denied.");
        }
        // Generate new payload with incremented tokenVersion
        const userRoles = Array.from(new Set([
            user.permissions.role,
            ...(Array.isArray(user.permissions.roles) ? user.permissions.roles : []),
            ...(Array.isArray(user.permissions.customRoles) ? user.permissions.customRoles : []),
        ].filter(Boolean)));
        const newPayload = {
            userId: user._id.toString(),
            organizationId: user.organizationId.toString(),
            role: user.permissions.role,
            roles: userRoles,
            sessionId: updatedSession._id.toString(),
            tokenVersion: updatedSession.tokenVersion,
        };
        const accessToken = this.jwt.sign(newPayload, { expiresIn: "15m" });
        const refreshToken = this.jwt.sign(newPayload, { expiresIn: "30d" });
        return {
            accessToken,
            refreshToken,
        };
    }
    /**
     * Logs out the user by terminating the active session.
     */
    async logout(sessionId) {
        await this.sessionRepository.invalidateSession(sessionId);
    }
    /**
     * Generates a password reset token, saves it, and dispatches a reset email.
     */
    async forgotPassword(email, emailService) {
        const user = await this.userRepository.findByEmail(email);
        // Generic response for security to prevent email enumeration
        if (!user) {
            return;
        }
        // Generate random token and hash it
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expires = new Date(Date.now() + 3600000); // 1 hour expiry
        // Save hashed token and expiry to database
        await this.userRepository.update(user._id, {
            "security.passwordResetToken": hashedToken,
            "security.passwordResetExpires": expires,
        });
        // Send email using organization email integration if configured
        try {
            const { OrganizationIntegrationService } = await import("../../integrations/services/organization-integration.service.js");
            const integrationService = new OrganizationIntegrationService();
            const activeEmail = await integrationService.getActiveEmailClient(user.organizationId);
            await activeEmail.service.sendPasswordResetEmail(activeEmail.config, activeEmail.secrets, user.auth.email, rawToken);
        }
        catch {
            await emailService.sendPasswordResetEmail(user.auth.email, rawToken);
        }
    }
    /**
     * Resets the user's password using the raw token.
     */
    async resetPassword(token, newPassword) {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await this.userRepository.findByResetToken(hashedToken);
        if (!user) {
            throw new AppError(400, "INVALID_OR_EXPIRED_TOKEN", "Password reset token is invalid or has expired.");
        }
        // Hash new password
        const passwordHash = await hashPassword(newPassword);
        // Update user: set new password, clear reset fields, update passwordChangedAt
        await this.userRepository.update(user._id, {
            "auth.passwordHash": passwordHash,
            "auth.passwordChangedAt": new Date(),
            "security.passwordResetToken": null,
            "security.passwordResetExpires": null,
        });
        // Invalidate all active sessions for this user on password change
        await this.sessionRepository.invalidateAllUserSessions(user._id);
    }
}
export default AuthService;
