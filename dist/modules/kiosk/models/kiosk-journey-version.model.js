import mongoose, { Schema } from "mongoose";
import { KioskStepMongooseSchema, KioskJourneySettingsMongooseSchema } from "./kiosk-journey.model.js";
import AppError from "../../../common/errors/app-error.js";
export const KioskJourneyVersionSchema = new Schema({
    journeyId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "KioskJourney"
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Organization"
    },
    version: {
        type: Number,
        required: true,
        min: 1
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    languages: {
        type: [String],
        required: true
    },
    steps: {
        type: [KioskStepMongooseSchema],
        default: []
    },
    settings: {
        type: KioskJourneySettingsMongooseSchema,
        required: true
    },
    contentChecksum: {
        type: String,
        required: true
    },
    publishedBy: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    publishedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ["published", "superseded", "revoked"],
        default: "published"
    },
    changelog: {
        type: String
    }
}, {
    timestamps: true
});
// Indexes
KioskJourneyVersionSchema.index({ journeyId: 1, version: 1 }, { unique: true });
KioskJourneyVersionSchema.index({ organizationId: 1, journeyId: 1, version: -1 });
KioskJourneyVersionSchema.index({ organizationId: 1, status: 1 });
KioskJourneyVersionSchema.index({ contentChecksum: 1 });
// Immutability hooks: prevent updates to existing documents
KioskJourneyVersionSchema.pre("save", function (next) {
    if (!this.isNew) {
        return next(new AppError(400, "IMMUTABLE_VERSION", "IMMUTABLE_VERSION: Published journey versions are strictly immutable and cannot be modified."));
    }
    next();
});
const preventUpdate = function (next) {
    if (this.getOptions?.()?.bypassImmutability) {
        return next();
    }
    return next(new AppError(400, "IMMUTABLE_VERSION", "IMMUTABLE_VERSION: Published journey versions are strictly immutable and cannot be modified."));
};
const preventDelete = function (next) {
    if (this.getOptions?.()?.bypassImmutability) {
        return next();
    }
    return next(new AppError(400, "IMMUTABLE_VERSION", "IMMUTABLE_VERSION: Published journey versions are strictly immutable and cannot be deleted."));
};
// Intercept query-level mutations
KioskJourneyVersionSchema.pre("updateOne", preventUpdate);
KioskJourneyVersionSchema.pre("updateMany", preventUpdate);
KioskJourneyVersionSchema.pre("findOneAndUpdate", preventUpdate);
KioskJourneyVersionSchema.pre("replaceOne", preventUpdate);
// Intercept document-level and query-level deletions
KioskJourneyVersionSchema.pre("deleteOne", { document: true, query: false }, function (next) {
    return next(new AppError(400, "IMMUTABLE_VERSION", "IMMUTABLE_VERSION: Published journey versions are strictly immutable and cannot be deleted."));
});
KioskJourneyVersionSchema.pre("deleteOne", { document: false, query: true }, preventDelete);
KioskJourneyVersionSchema.pre("deleteMany", preventDelete);
KioskJourneyVersionSchema.pre("findOneAndDelete", preventDelete);
export const KioskJourneyVersionModel = mongoose.model("KioskJourneyVersion", KioskJourneyVersionSchema);
export default KioskJourneyVersionModel;
