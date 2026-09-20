import crypto from "crypto";
import mongoose from "mongoose";
import AppError from "../../../common/errors/app-error.js";
import { KioskJourneySchema } from "../validation/journey.schema.js";
import { KioskJourneyModel } from "../models/kiosk-journey.model.js";
import KioskDeviceModel from "../models/kiosk-device.model.js";
import User from "../../auth/models/user.model.js";
export class KioskService {
    journeyRepo;
    deviceRepo;
    analyticsRepo;
    securityService;
    jwt;
    constructor(journeyRepo, deviceRepo, analyticsRepo, securityService, jwt) {
        this.journeyRepo = journeyRepo;
        this.deviceRepo = deviceRepo;
        this.analyticsRepo = analyticsRepo;
        this.securityService = securityService;
        this.jwt = jwt;
    }
    getDeviceRepo() {
        return this.deviceRepo;
    }
    async createJourney(orgId, data, userId) {
        const journeyData = {
            ...data,
            organizationId: new mongoose.Types.ObjectId(orgId),
            createdBy: new mongoose.Types.ObjectId(userId),
            isDeleted: false,
            publishing: {
                status: "draft",
                version: 1
            }
        };
        return this.journeyRepo.create(journeyData);
    }
    async updateJourney(id, orgId, data, userId) {
        const journey = await this.journeyRepo.findByIdAndOrg(id, orgId);
        if (!journey) {
            throw new AppError(404, "NOT_FOUND", "Kiosk journey not found");
        }
        const updated = await this.journeyRepo.update(id, data, userId);
        if (!updated) {
            throw new AppError(404, "NOT_FOUND", "Kiosk journey not found");
        }
        return updated;
    }
    async publishJourney(id, orgId, userId) {
        const journey = await this.journeyRepo.findByIdAndOrg(id, orgId);
        if (!journey) {
            throw new AppError(404, "NOT_FOUND", "Kiosk journey not found");
        }
        // Trigger refinement validation before marking as published
        const json = JSON.parse(JSON.stringify(journey.toJSON()));
        delete json.__v;
        const validationResult = KioskJourneySchema.safeParse(json);
        if (!validationResult.success) {
            throw new AppError(400, "VALIDATION_FAILED", `Cannot publish journey due to validation errors: ${validationResult.error.issues[0].message}`);
        }
        const published = await this.journeyRepo.publish(id, userId);
        if (!published) {
            throw new AppError(404, "NOT_FOUND", "Kiosk journey not found");
        }
        return published;
    }
    async getJourney(id, orgId) {
        const journey = await this.journeyRepo.findByIdAndOrg(id, orgId);
        if (!journey) {
            throw new AppError(404, "NOT_FOUND", "Kiosk journey not found");
        }
        return journey;
    }
    async deleteJourney(id, orgId, userId) {
        const journey = await this.journeyRepo.findByIdAndOrg(id, orgId);
        if (!journey) {
            throw new AppError(404, "NOT_FOUND", "Kiosk journey not found");
        }
        await this.journeyRepo.softDelete(id, userId);
    }
    async listJourneys(filter, pagination) {
        return this.journeyRepo.find(filter, pagination);
    }
    // --- Device Management ---
    async generatePairingCode(orgId, deviceId) {
        // 15-minute activation window (900 seconds)
        const code = this.securityService.generatePairingCode(orgId, deviceId, 900000);
        return { code, expiresInSeconds: 900 };
    }
    async pairDevice(code, deviceId, name, location) {
        const pairingData = this.securityService.verifyPairingCode(code);
        if (!pairingData) {
            throw new AppError(400, "INVALID_OR_EXPIRED_PAIRING_CODE", "Invalid or expired pairing code");
        }
        const { orgId } = pairingData;
        if (pairingData.deviceId && pairingData.deviceId !== deviceId) {
            throw new AppError(400, "DEVICE_MISMATCH", "Pairing code was generated for a different hardware GUID");
        }
        // Sign long-lived token for physical device (e.g. 10 years expiry)
        const token = this.jwt
            ? this.jwt.sign({
                deviceId,
                organizationId: orgId,
                role: "kiosk_device",
            }, { expiresIn: "3650d" })
            : "";
        const tokenRef = crypto.createHash("sha256").update(token).digest("hex");
        let device = await this.deviceRepo.findByFingerprint(deviceId);
        if (device) {
            // Re-activate or re-pair existing device
            device = await this.deviceRepo.register({
                _id: device._id,
                organizationId: new mongoose.Types.ObjectId(orgId),
                deviceId,
                hardwareGuid: deviceId,
                name: name || device.name,
                location: location || device.location,
                status: "online",
                paired: true,
                tokenRef,
                pairedAt: new Date(),
                lastSeen: new Date()
            });
        }
        else {
            // Register new device
            device = await this.deviceRepo.register({
                organizationId: new mongoose.Types.ObjectId(orgId),
                deviceId,
                hardwareGuid: deviceId,
                name,
                location,
                status: "online",
                paired: true,
                tokenRef,
                pairedAt: new Date(),
                lastSeen: new Date(),
                currentContentVersion: 0,
                telemetry: {}
            });
        }
        return { device, token };
    }
    async heartbeat(deviceId, orgId, contentVersion, telemetry) {
        const device = await this.deviceRepo.findByFingerprint(deviceId);
        if (!device) {
            throw new AppError(404, "NOT_FOUND", "Device registration not found");
        }
        if (device.organizationId.toString() !== orgId) {
            throw new AppError(403, "FORBIDDEN", "Tenant mismatch for device");
        }
        return this.deviceRepo.heartbeat(device._id, contentVersion, telemetry);
    }
    async listDevices(filter, pagination) {
        return this.deviceRepo.find(filter, pagination);
    }
    async updateDeviceStatus(id, orgId, status) {
        const device = await this.deviceRepo.findByIdAndOrg(id, orgId);
        if (!device) {
            throw new AppError(404, "NOT_FOUND", "Device not found");
        }
        return this.deviceRepo.updateStatus(id, status);
    }
    async pairJourneyToDevice(id, orgId, journeyId) {
        const device = await this.deviceRepo.findByIdAndOrg(id, orgId);
        if (!device) {
            throw new AppError(404, "NOT_FOUND", "Device not found");
        }
        if (journeyId) {
            const journey = await this.journeyRepo.findByIdAndOrg(journeyId, orgId);
            if (!journey) {
                throw new AppError(404, "NOT_FOUND", "Kiosk journey not found");
            }
        }
        return this.deviceRepo.pairJourney(id, journeyId);
    }
    // --- Analytics Sync ---
    async syncAnalytics(orgId, payload, hardwareDeviceId) {
        const rawItems = Array.isArray(payload)
            ? payload
            : (Array.isArray(payload?.events) ? payload.events : (Array.isArray(payload?.sessions) ? payload.sessions : []));
        if (!rawItems || rawItems.length === 0) {
            throw new AppError(400, "BAD_REQUEST", "No events or sessions provided for sync");
        }
        // Resolve device ObjectId if hardwareDeviceId is available
        let deviceObjectId;
        if (hardwareDeviceId) {
            const device = await this.deviceRepo.findByFingerprint(hardwareDeviceId);
            if (device) {
                deviceObjectId = device._id;
            }
        }
        // Extract journey identifiers (can be ObjectId or journeyCode)
        const rawJourneyIds = Array.from(new Set(rawItems
            .map((item) => String(item.journeyId || ""))
            .filter((id) => Boolean(id))));
        const validObjectIds = rawJourneyIds.filter((id) => mongoose.Types.ObjectId.isValid(id) && id.length === 24);
        const journeys = await KioskJourneyModel.find({
            $or: [
                { _id: { $in: validObjectIds } },
                { journeyCode: { $in: rawJourneyIds } }
            ],
            organizationId: orgId,
            isDeleted: false
        });
        if (journeys.length === 0) {
            throw new AppError(400, "BAD_REQUEST", "No matching active journeys found for specified journey identifiers");
        }
        // Map each item to a standardized KioskAnalytics document
        const dateKey = new Date().toISOString().split("T")[0];
        const normalizedDocs = rawItems.map((item) => {
            const matchedJourney = journeys.find((j) => j._id.toString() === item.journeyId || j.journeyCode === item.journeyId);
            if (!matchedJourney) {
                throw new AppError(400, "BAD_REQUEST", `Tenant crossover or invalid journey detected: ${item.journeyId}`);
            }
            const journeyId = matchedJourney._id;
            const journeyVersion = matchedJourney.publishing?.version || 1;
            const languageUsed = item.languageUsed || matchedJourney.languages?.[0] || matchedJourney.settings?.defaultLanguage || "en";
            const eventType = item.eventType || item.interactions?.[0]?.eventType || "STEP_VIEWED";
            const stepId = item.stepId || item.interactions?.[0]?.stepId || "step-01";
            const durationSeconds = item.durationSeconds || item.metrics?.durationSeconds || 0;
            const completedCount = (eventType && eventType.toUpperCase().includes("COMPLETED")) ? 1 : (item.metrics?.completedCount || 0);
            const metrics = item.metrics || {
                launchesCount: 1,
                completedCount,
                durationSeconds,
                abortedStepId: item.abortedStepId
            };
            const interactions = Array.isArray(item.interactions) && item.interactions.length > 0
                ? item.interactions
                : [
                    {
                        stepId,
                        elementClicked: item.elementClicked || stepId,
                        eventType,
                        timestamp: new Date()
                    }
                ];
            return {
                organizationId: new mongoose.Types.ObjectId(orgId),
                deviceId: deviceObjectId || (item.deviceId && mongoose.Types.ObjectId.isValid(item.deviceId) ? new mongoose.Types.ObjectId(item.deviceId) : undefined),
                journeyId,
                journeyVersion,
                languageUsed,
                stepId,
                eventType,
                metrics,
                interactions,
                dateKey: item.dateKey || dateKey
            };
        });
        return this.analyticsRepo.bulkSync(normalizedDocs);
    }
    async getJourneyAnalyticsSummary(journeyId, orgId, startDate, endDate) {
        const journey = await this.journeyRepo.findByIdAndOrg(journeyId, orgId);
        if (!journey) {
            throw new AppError(404, "NOT_FOUND", "Kiosk journey not found");
        }
        return this.analyticsRepo.getSummary(orgId, journeyId, startDate, endDate);
    }
    /**
     * Frontline worker identification and ephemeral session token generation (UQ-01 Resolution)
     */
    async identifyFrontlineWorker(orgId, identifier, kioskDeviceId) {
        if (!identifier || !identifier.trim()) {
            throw new AppError(400, "BAD_REQUEST", "Worker identification code or badge is required");
        }
        const cleanId = identifier.trim();
        const worker = await User.findOne({
            organizationId: new mongoose.Types.ObjectId(orgId),
            isDeleted: false,
            $or: [
                { "employment.badgeId": cleanId },
                { "employment.employeeId": cleanId },
                { "employment.nationalId": cleanId },
                { "auth.email": cleanId.toLowerCase() },
            ],
        });
        if (!worker) {
            throw new AppError(404, "WORKER_NOT_FOUND", "No frontline worker record found matching the provided badge or identity number.");
        }
        // Generate ephemeral 1-hour session token
        let sessionToken;
        const payload = {
            userId: worker._id.toString(),
            organizationId: orgId,
            kioskDeviceId: kioskDeviceId || "standalone_terminal",
            tempWorkerId: worker._id.toString(),
            workerId: worker._id.toString(),
            workerName: worker.profile.fullName || `${worker.profile.firstName} ${worker.profile.lastName}`.trim(),
            role: "frontline_worker_kiosk",
            scope: "kiosk_preboarding_execution",
        };
        if (this.jwt && typeof this.jwt.sign === "function") {
            sessionToken = this.jwt.sign(payload, { expiresIn: "1h" });
        }
        else {
            // Fallback base64 signed token representation
            const payloadStr = JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 });
            const signature = crypto.createHmac("sha256", "talnova_kiosk_secret").update(payloadStr).digest("hex");
            sessionToken = `${Buffer.from(payloadStr).toString("base64")}.${signature}`;
        }
        const pendingComplianceDocsCount = await mongoose.model("DocumentAssignment").countDocuments({
            organizationId: new mongoose.Types.ObjectId(orgId),
            employeeId: worker._id,
            status: { $ne: "signed" },
            isDeleted: false,
        });
        const workerObj = {
            id: worker._id.toString(),
            fullName: worker.profile.fullName || `${worker.profile.firstName} ${worker.profile.lastName}`.trim(),
            firstName: worker.profile.firstName,
            lastName: worker.profile.lastName,
            employeeId: worker.employment?.employeeId,
            badgeId: worker.employment?.badgeId,
            nationalId: worker.employment?.nationalId,
            department: worker.employment?.department || "Operations",
            status: worker.employment?.status,
        };
        return {
            success: true,
            token: sessionToken,
            sessionToken,
            pendingComplianceDocsCount,
            user: workerObj,
            worker: workerObj,
            expiresInSeconds: 3600,
        };
    }
    /**
     * Frontline supervisor PIN authorization verification (UQ-01 Resolution)
     */
    async verifySupervisorPin(orgId, supervisorIdentifier, pin) {
        if (!supervisorIdentifier || !pin) {
            throw new AppError(400, "BAD_REQUEST", "Supervisor identifier and 4-digit PIN are required");
        }
        const cleanId = supervisorIdentifier.trim();
        const isHexObjectId = /^[0-9a-fA-F]{24}$/.test(cleanId);
        const supervisor = await User.findOne({
            organizationId: new mongoose.Types.ObjectId(orgId),
            isDeleted: false,
            "permissions.role": { $in: ["manager", "admin", "owner", "super_admin"] },
            $or: [
                ...(isHexObjectId ? [{ _id: new mongoose.Types.ObjectId(cleanId) }] : []),
                { "auth.email": cleanId.toLowerCase() },
                { "employment.employeeId": cleanId },
                { "employment.badgeId": cleanId },
            ],
        });
        if (!supervisor) {
            throw new AppError(404, "SUPERVISOR_NOT_FOUND", "Authorized frontline supervisor record not found");
        }
        const pinHash = crypto.createHash("sha256").update(pin.trim()).digest("hex");
        const stored = supervisor.security?.supervisorPinHash;
        const isMatch = stored ? (stored === pinHash || stored === pin.trim()) : false;
        if (!isMatch) {
            throw new AppError(401, "INVALID_SUPERVISOR_PIN", "Invalid supervisor authorization PIN");
        }
        return {
            success: true,
            verified: true,
            supervisor: {
                id: supervisor._id.toString(),
                fullName: supervisor.profile.fullName || `${supervisor.profile.firstName} ${supervisor.profile.lastName}`.trim(),
                role: supervisor.permissions.role,
                department: supervisor.employment?.department || "Operations",
            },
        };
    }
    /**
     * Set / update supervisor 4-digit PIN
     */
    async setSupervisorPin(orgId, supervisorId, pin) {
        if (!pin || pin.trim().length < 4) {
            throw new AppError(400, "BAD_REQUEST", "Supervisor PIN must be at least 4 digits");
        }
        const pinHash = crypto.createHash("sha256").update(pin.trim()).digest("hex");
        const supervisor = await User.findOneAndUpdate({
            _id: new mongoose.Types.ObjectId(supervisorId),
            organizationId: new mongoose.Types.ObjectId(orgId),
            isDeleted: false,
        }, {
            $set: { "security.supervisorPinHash": pinHash },
        }, { new: true });
        if (!supervisor) {
            throw new AppError(404, "NOT_FOUND", "Supervisor user not found");
        }
        return { success: true, message: "Supervisor PIN set successfully" };
    }
    /**
     * Autonomous Kiosk Fleet Health Sentinel (Prompt 09 Step 3)
     */
    async scanKioskFleetHealth(orgId) {
        const threshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
        const query = {
            status: "online",
            $or: [
                { lastHeartbeatAt: { $lt: threshold } },
                { lastHeartbeatAt: { $exists: false }, lastSeen: { $lt: threshold } },
            ],
        };
        if (orgId) {
            query.organizationId = new mongoose.Types.ObjectId(orgId);
        }
        const staleDevices = await KioskDeviceModel.find(query);
        const flagged = [];
        for (const device of staleDevices) {
            device.status = "offline";
            await device.save();
            try {
                const NotificationModel = mongoose.model("Notification");
                const admin = await User.findOne({
                    organizationId: device.organizationId,
                    "permissions.role": { $in: ["admin", "owner"] },
                    isDeleted: false,
                });
                if (admin) {
                    await NotificationModel.create({
                        organizationId: device.organizationId,
                        recipientUserId: admin._id,
                        type: "manager_alert",
                        channel: "in_app",
                        title: "Kiosk Terminal Offline Alert",
                        message: `Kiosk Terminal ${device.name} in ${device.location} has been offline for 30 minutes. Shift safety briefings may be impacted.`,
                        priority: "high",
                        status: "sent",
                        isRead: false,
                    });
                }
            }
            catch (e) {
                console.warn("[KioskService] Error dispatching offline notification:", e);
            }
            flagged.push({
                deviceId: device.deviceId,
                name: device.name,
                location: device.location,
                lastHeartbeatAt: device.lastHeartbeatAt || device.lastSeen,
            });
        }
        return {
            scannedAt: new Date(),
            offlineCount: flagged.length,
            flaggedDevices: flagged,
        };
    }
    /**
     * Toggle Kiosk Device Maintenance Mode
     */
    async setDeviceMaintenanceMode(id, orgId, maintenance) {
        const device = await this.deviceRepo.findByIdAndOrg(id, orgId);
        if (!device) {
            throw new AppError(404, "NOT_FOUND", "Device not found");
        }
        const newStatus = maintenance ? "maintenance" : "online";
        return this.deviceRepo.updateStatus(id, newStatus);
    }
}
export default KioskService;
