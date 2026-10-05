import mongoose from "mongoose";
import { KioskAnalyticsModel, GDPR_ANALYTICS_REDACTED_FIELDS } from "../models/kiosk-analytics.model.js";
export class KioskAnalyticsRepository {
    /**
     * Redacts any personal identifiable information (PII) before storage.
     */
    sanitizeAnalyticsDoc(doc) {
        const clean = { ...doc };
        for (const key of GDPR_ANALYTICS_REDACTED_FIELDS) {
            delete clean[key];
        }
        return clean;
    }
    async saveSession(sessionData) {
        const sanitized = this.sanitizeAnalyticsDoc(sessionData);
        const session = new KioskAnalyticsModel(sanitized);
        return session.save();
    }
    async bulkSync(sessions) {
        const sanitized = sessions.map((s) => this.sanitizeAnalyticsDoc(s));
        return KioskAnalyticsModel.insertMany(sanitized);
    }
    /**
     * Retrieves summary analytics for a journey including completion rate and language splits.
     */
    async getSummary(orgId, journeyId, startDate, endDate) {
        const matchQuery = {
            organizationId: new mongoose.Types.ObjectId(orgId),
            journeyId: new mongoose.Types.ObjectId(journeyId)
        };
        if (startDate || endDate) {
            matchQuery.dateKey = {};
            if (startDate)
                matchQuery.dateKey.$gte = startDate;
            if (endDate)
                matchQuery.dateKey.$lte = endDate;
        }
        const result = await KioskAnalyticsModel.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalLaunches: { $sum: "$metrics.launchesCount" },
                    totalCompletions: { $sum: "$metrics.completedCount" },
                    totalDurationSeconds: { $sum: "$metrics.durationSeconds" },
                    languagesUsed: { $addToSet: "$languageUsed" },
                    sessionsCount: { $sum: 1 }
                }
            }
        ]);
        const languageBreakdown = await KioskAnalyticsModel.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$languageUsed",
                    count: { $sum: 1 }
                }
            }
        ]);
        if (result.length === 0) {
            return {
                totalLaunches: 0,
                totalCompletions: 0,
                averageDurationSeconds: 0,
                completionRate: 0,
                languagesUsed: [],
                sessionsCount: 0,
                languageBreakdown: []
            };
        }
        const summary = result[0];
        const completionRate = summary.totalLaunches > 0 ? (summary.totalCompletions / summary.totalLaunches) * 100 : 0;
        return {
            totalLaunches: summary.totalLaunches,
            totalCompletions: summary.totalCompletions,
            averageDurationSeconds: summary.sessionsCount > 0 ? summary.totalDurationSeconds / summary.sessionsCount : 0,
            completionRate,
            languagesUsed: summary.languagesUsed,
            sessionsCount: summary.sessionsCount,
            languageBreakdown: languageBreakdown.map((lb) => ({
                language: lb._id,
                count: lb.count
            }))
        };
    }
    /**
     * K-ANA-001: Step Funnel Drop-off & Dwell Time Aggregation
     *
     * Aggregates journey sessions to reveal drop-off rates and dwell times per step
     * strictly without exposing individual employee identities or device hardware IDs.
     */
    async getStepDropOffFunnel(orgId, journeyId, startDate, endDate) {
        const matchQuery = {
            organizationId: new mongoose.Types.ObjectId(orgId),
            journeyId: new mongoose.Types.ObjectId(journeyId)
        };
        if (startDate || endDate) {
            matchQuery.dateKey = {};
            if (startDate)
                matchQuery.dateKey.$gte = startDate;
            if (endDate)
                matchQuery.dateKey.$lte = endDate;
        }
        // 1. Calculate drop-offs per step (from abortedStepId)
        const dropOffAgg = await KioskAnalyticsModel.aggregate([
            { $match: { ...matchQuery, "metrics.abortedStepId": { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: "$metrics.abortedStepId",
                    dropOffCount: { $sum: 1 }
                }
            }
        ]);
        const dropOffMap = new Map();
        dropOffAgg.forEach((item) => {
            if (item._id) {
                dropOffMap.set(String(item._id), item.dropOffCount);
            }
        });
        // 2. Aggregate views and dwell times from interactions
        const interactionAgg = await KioskAnalyticsModel.aggregate([
            { $match: matchQuery },
            { $unwind: "$interactions" },
            {
                $group: {
                    _id: "$interactions.stepId",
                    viewsCount: { $sum: 1 },
                    totalDwellSeconds: { $sum: { $ifNull: ["$interactions.dwellTimeSeconds", 0] } }
                }
            }
        ]);
        // 3. Aggregate from stepFunnels if populated
        const funnelAgg = await KioskAnalyticsModel.aggregate([
            { $match: matchQuery },
            { $unwind: "$stepFunnels" },
            {
                $group: {
                    _id: "$stepFunnels.stepId",
                    viewsCount: { $sum: 1 },
                    dropOffs: { $sum: { $cond: ["$stepFunnels.isDropOff", 1, 0] } },
                    completions: { $sum: { $cond: ["$stepFunnels.completed", 1, 0] } },
                    totalDwellSeconds: { $sum: "$stepFunnels.dwellTimeSeconds" }
                }
            }
        ]);
        const stepStatsMap = new Map();
        funnelAgg.forEach((item) => {
            const sid = String(item._id);
            stepStatsMap.set(sid, {
                viewsCount: item.viewsCount || 0,
                completionsCount: item.completions || 0,
                dropOffCount: item.dropOffs || dropOffMap.get(sid) || 0,
                totalDwellSeconds: item.totalDwellSeconds || 0
            });
        });
        interactionAgg.forEach((item) => {
            const sid = String(item._id);
            const existing = stepStatsMap.get(sid);
            if (existing) {
                if (existing.viewsCount === 0)
                    existing.viewsCount = item.viewsCount;
                if (existing.totalDwellSeconds === 0)
                    existing.totalDwellSeconds = item.totalDwellSeconds;
            }
            else {
                stepStatsMap.set(sid, {
                    viewsCount: item.viewsCount || 1,
                    completionsCount: 0,
                    dropOffCount: dropOffMap.get(sid) || 0,
                    totalDwellSeconds: item.totalDwellSeconds || 0
                });
            }
        });
        dropOffMap.forEach((dropCount, sid) => {
            if (!stepStatsMap.has(sid)) {
                stepStatsMap.set(sid, {
                    viewsCount: dropCount,
                    completionsCount: 0,
                    dropOffCount: dropCount,
                    totalDwellSeconds: 0
                });
            }
        });
        const funnel = Array.from(stepStatsMap.entries()).map(([stepId, stats]) => {
            const views = Math.max(stats.viewsCount, stats.dropOffCount);
            const dropOffs = stats.dropOffCount;
            const dropOffRate = views > 0 ? Math.round((dropOffs / views) * 1000) / 10 : 0;
            const averageDwellTimeSeconds = views > 0 ? Math.round((stats.totalDwellSeconds / views) * 10) / 10 : 0;
            return {
                stepId,
                viewsCount: views,
                completionsCount: stats.completionsCount,
                dropOffCount: dropOffs,
                dropOffRate,
                averageDwellTimeSeconds
            };
        });
        const totalSessions = await KioskAnalyticsModel.countDocuments(matchQuery);
        const totalDropOffs = Array.from(dropOffMap.values()).reduce((sum, count) => sum + count, 0);
        return {
            journeyId: journeyId.toString(),
            organizationId: orgId.toString(),
            totalSessions,
            totalDropOffs,
            funnel
        };
    }
}
export default KioskAnalyticsRepository;
