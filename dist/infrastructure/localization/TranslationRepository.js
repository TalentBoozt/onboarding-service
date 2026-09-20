import mongoose from "mongoose";
import { Translation, } from "../../modules/localization/models/translation.model.js";
/**
 * TranslationRepository
 *
 * Single point of database access for all translation operations.
 * Business services and LocalizationService use ONLY this repository
 * to query the Translation collection — never the model directly.
 *
 * This keeps the DB schema change surface contained: if the schema changes,
 * only this file needs updating.
 */
export class TranslationRepository {
    buildEntityId(id) {
        return new mongoose.Types.ObjectId(id.toString());
    }
    /**
     * Find a single APPROVED translation.
     */
    async findApproved(entityType, entityId, field, language) {
        return Translation.findOne({
            entityType: entityType.toLowerCase(),
            entityId: this.buildEntityId(entityId),
            field: field.toLowerCase(),
            language: language.toLowerCase(),
            status: "APPROVED",
        }).lean();
    }
    /**
     * Find ALL translations for an entity (any status) — admin use.
     */
    async findAllForEntity(entityType, entityId) {
        const docs = await Translation.find({
            entityType: entityType.toLowerCase(),
            entityId: this.buildEntityId(entityId),
        })
            .sort({ field: 1, language: 1 })
            .lean();
        return docs;
    }
    /**
     * Find all translations for an entity in a specific language.
     */
    async findForEntityAndLanguage(entityType, entityId, language) {
        const docs = await Translation.find({
            entityType: entityType.toLowerCase(),
            entityId: this.buildEntityId(entityId),
            language: language.toLowerCase(),
        }).lean();
        return docs;
    }
    /**
     * Upsert a single translation record.
     * Returns the updated document.
     */
    async upsert(entityType, entityId, field, language, data) {
        const filter = {
            entityType: entityType.toLowerCase(),
            entityId: this.buildEntityId(entityId),
            field: field.toLowerCase(),
            language: language.toLowerCase(),
        };
        const update = {
            $set: {
                value: data.value,
                ...(data.status && { status: data.status }),
                ...(data.sourceVersion !== undefined && { sourceVersion: data.sourceVersion }),
                ...(data.translatedBy && {
                    translatedBy: new mongoose.Types.ObjectId(data.translatedBy.toString()),
                }),
            },
            $inc: { version: 1 },
        };
        const result = await Translation.findOneAndUpdate(filter, update, {
            upsert: true,
            new: true,
        });
        return result;
    }
    /**
     * Approve a translation — marks it APPROVED and records approver.
     */
    async approve(entityType, entityId, field, language, approverId) {
        const doc = await Translation.findOneAndUpdate({
            entityType: entityType.toLowerCase(),
            entityId: this.buildEntityId(entityId),
            field: field.toLowerCase(),
            language: language.toLowerCase(),
        }, {
            $set: {
                status: "APPROVED",
                approvedBy: new mongoose.Types.ObjectId(approverId.toString()),
                approvedAt: new Date(),
            },
        }, { new: true });
        return doc;
    }
    /**
     * Mark all non-English translations for an entity+field as OUTDATED.
     * Called when the English source content changes.
     */
    async markOutdated(entityType, entityId, field) {
        await Translation.updateMany({
            entityType: entityType.toLowerCase(),
            entityId: this.buildEntityId(entityId),
            field: field.toLowerCase(),
            language: { $ne: "en" },
            status: { $in: ["APPROVED", "UNDER_REVIEW", "AI_GENERATED"] },
        }, {
            $set: { status: "OUTDATED" },
        });
    }
    /**
     * Admin: list entities with missing translations for a given language.
     */
    async findMissing(entityType, language, fields) {
        // Find (entityId, field) pairs that have an English record but lack the target language
        const englishDocs = await Translation.find({
            entityType: entityType.toLowerCase(),
            language: "en",
            field: { $in: fields.map((f) => f.toLowerCase()) },
        })
            .select("entityId field")
            .lean();
        const results = [];
        for (const doc of englishDocs) {
            const existing = await Translation.findOne({
                entityType: entityType.toLowerCase(),
                entityId: doc.entityId,
                field: doc.field,
                language: language.toLowerCase(),
                status: { $ne: "OUTDATED" },
            }).lean();
            if (!existing) {
                results.push({ entityId: doc.entityId, field: doc.field });
            }
        }
        return results;
    }
    /**
     * Admin: list OUTDATED translations for an entity type.
     */
    async findOutdated(entityType) {
        const docs = await Translation.find({
            entityType: entityType.toLowerCase(),
            status: "OUTDATED",
        })
            .sort({ updatedAt: -1 })
            .lean();
        return docs;
    }
    /**
     * Admin: compute translation coverage for an entity type.
     * Returns {language, field, approved, total} stats.
     */
    async coverage(entityType) {
        const pipeline = [
            { $match: { entityType: entityType.toLowerCase() } },
            {
                $group: {
                    _id: { language: "$language", field: "$field" },
                    total: { $sum: 1 },
                    approved: {
                        $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    language: "$_id.language",
                    field: "$_id.field",
                    total: 1,
                    approved: 1,
                },
            },
        ];
        return Translation.aggregate(pipeline);
    }
}
export const translationRepository = new TranslationRepository();
export default TranslationRepository;
