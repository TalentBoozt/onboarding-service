import mongoose from "mongoose";
import SystemJob from "./system-job.model.js";
export class QueueService {
    static instance;
    jobHandlers = new Map();
    processedKeys = new Set();
    isProcessing = false;
    jobQueue = [];
    completedJobs = [];
    failedJobs = [];
    constructor() {
        // Singleton
    }
    static getInstance() {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService();
        }
        return QueueService.instance;
    }
    registerWorker(jobName, handler) {
        this.jobHandlers.set(jobName, handler);
    }
    async enqueue(jobName, data, options) {
        if (options.idempotencyKey) {
            const uniqueKey = `${options.organizationId.toString()}:${options.idempotencyKey}`;
            if (this.processedKeys.has(uniqueKey)) {
                console.warn(`[QueueService] Job ${jobName} suppressed by idempotency key: ${uniqueKey}`);
                return null;
            }
            this.processedKeys.add(uniqueKey);
        }
        const jobId = new mongoose.Types.ObjectId();
        const effectiveAvailableAt = options.availableAt
            ? new Date(options.availableAt)
            : options.delayMs
                ? new Date(Date.now() + options.delayMs)
                : new Date();
        const job = {
            id: jobId.toString(),
            name: jobName,
            data,
            options: {
                maxRetries: options.maxRetries ?? 3,
                backoffDelayMs: options.backoffDelayMs ?? 1000,
                organizationId: options.organizationId,
                idempotencyKey: options.idempotencyKey,
                availableAt: effectiveAvailableAt,
                delayMs: options.delayMs,
            },
            status: "pending",
            attempts: 0,
            availableAt: effectiveAvailableAt,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Persist to MongoDB before enqueuing to in-memory processing loop
        if (mongoose.connection.readyState === 1) {
            try {
                await SystemJob.create({
                    _id: jobId,
                    organizationId: options.organizationId,
                    name: jobName,
                    data: data,
                    status: "pending",
                    attempts: 0,
                    maxRetries: options.maxRetries ?? 3,
                    backoffDelayMs: options.backoffDelayMs ?? 1000,
                    idempotencyKey: options.idempotencyKey,
                    availableAt: effectiveAvailableAt,
                });
            }
            catch (err) {
                // Suppress duplicate key errors quietly
            }
        }
        this.jobQueue.push(job);
        this.processQueue();
        return job;
    }
    async processQueue() {
        if (this.isProcessing || this.jobQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        while (this.jobQueue.length > 0) {
            const now = Date.now();
            const readyIndex = this.jobQueue.findIndex((j) => !j.availableAt || j.availableAt.getTime() <= now);
            if (readyIndex === -1) {
                // Find earliest scheduled job to awaken queue
                const nextJob = this.jobQueue.reduce((earliest, j) => !earliest || (j.availableAt && j.availableAt.getTime() < earliest.availableAt.getTime())
                    ? j
                    : earliest, null);
                if (nextJob && nextJob.availableAt) {
                    const delay = Math.max(50, nextJob.availableAt.getTime() - now);
                    setTimeout(() => {
                        this.processQueue();
                    }, Math.min(delay, 2147483647));
                }
                break;
            }
            const [job] = this.jobQueue.splice(readyIndex, 1);
            const handler = this.jobHandlers.get(job.name);
            if (!handler) {
                console.error(`[QueueService] No registered handler for job: ${job.name}`);
                job.status = "failed";
                job.lastError = `No handler registered for ${job.name}`;
                job.updatedAt = new Date();
                this.failedJobs.push(job);
                if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(job.id)) {
                    SystemJob.updateOne({ _id: new mongoose.Types.ObjectId(job.id) }, { $set: { status: "failed", lastError: job.lastError } }).catch(() => { });
                }
                continue;
            }
            job.status = "processing";
            job.attempts += 1;
            job.updatedAt = new Date();
            if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(job.id)) {
                await SystemJob.updateOne({ _id: new mongoose.Types.ObjectId(job.id) }, {
                    $set: { status: "processing", lockedAt: new Date() },
                    $inc: { attempts: 1 },
                }).catch(() => { });
            }
            try {
                await handler(job);
                job.status = "completed";
                job.updatedAt = new Date();
                this.completedJobs.push(job);
                if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(job.id)) {
                    await SystemJob.updateOne({ _id: new mongoose.Types.ObjectId(job.id) }, {
                        $set: {
                            status: "completed",
                            completedAt: new Date(),
                            lockedAt: null,
                        },
                    }).catch(() => { });
                }
            }
            catch (error) {
                job.lastError = error?.message || String(error);
                job.updatedAt = new Date();
                if (job.attempts < (job.options.maxRetries || 3)) {
                    const backoff = (job.options.backoffDelayMs || 1000) * Math.pow(2, job.attempts - 1);
                    console.warn(`[QueueService] Job ${job.name} (${job.id}) failed (attempt ${job.attempts}). Retrying in ${backoff}ms...`);
                    job.status = "pending";
                    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(job.id)) {
                        SystemJob.updateOne({ _id: new mongoose.Types.ObjectId(job.id) }, {
                            $set: {
                                status: "pending",
                                availableAt: new Date(Date.now() + backoff),
                                lastError: job.lastError,
                                lockedAt: null,
                            },
                        }).catch(() => { });
                    }
                    await new Promise((resolve) => setTimeout(resolve, backoff));
                    this.jobQueue.push(job);
                }
                else {
                    console.error(`[QueueService] Job ${job.name} (${job.id}) failed permanently after ${job.attempts} attempts:`, error);
                    job.status = "failed";
                    this.failedJobs.push(job);
                    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(job.id)) {
                        SystemJob.updateOne({ _id: new mongoose.Types.ObjectId(job.id) }, {
                            $set: {
                                status: "failed",
                                lastError: job.lastError,
                                lockedAt: null,
                            },
                        }).catch(() => { });
                    }
                }
            }
        }
        this.isProcessing = false;
    }
    /**
     * Resumes any pending or stalled jobs persisted in MongoDB upon startup/reboot
     */
    async resumePendingJobs() {
        if (mongoose.connection.readyState !== 1)
            return 0;
        try {
            const stalledOrPending = await SystemJob.find({
                status: { $in: ["pending", "processing"] },
                $or: [
                    { lockedAt: null },
                    { lockedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } }, // Lock expired after 5 mins
                ],
                availableAt: { $lte: new Date() },
            }).limit(100);
            let resumed = 0;
            for (const record of stalledOrPending) {
                if (!this.jobQueue.some((j) => j.id === record._id.toString())) {
                    this.jobQueue.push({
                        id: record._id.toString(),
                        name: record.name,
                        data: record.data,
                        options: {
                            organizationId: record.organizationId,
                            maxRetries: record.maxRetries,
                            backoffDelayMs: record.backoffDelayMs,
                            idempotencyKey: record.idempotencyKey,
                        },
                        status: "pending",
                        attempts: record.attempts,
                        availableAt: record.availableAt || record.createdAt,
                        createdAt: record.createdAt,
                        updatedAt: record.updatedAt,
                    });
                    resumed++;
                }
            }
            if (resumed > 0) {
                console.log(`[QueueService] Resumed ${resumed} persistent jobs from MongoDB.`);
                this.processQueue();
            }
            return resumed;
        }
        catch (err) {
            console.warn("[QueueService] Could not resume persistent jobs:", err.message);
            return 0;
        }
    }
    getStats() {
        return {
            pending: this.jobQueue.length,
            completed: this.completedJobs.length,
            failed: this.failedJobs.length,
        };
    }
    clear() {
        this.jobQueue = [];
        this.completedJobs = [];
        this.failedJobs = [];
        this.processedKeys.clear();
    }
}
export const queueService = QueueService.getInstance();
export default queueService;
