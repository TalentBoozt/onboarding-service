import mongoose, { Schema } from "mongoose";
const PlatformSettingSchema = new Schema({
    singleton: {
        type: Boolean,
        default: true,
        unique: true,
        required: true,
    },
    maintenanceMode: {
        type: Boolean,
        default: false,
        required: true,
    },
    maintenanceMessage: {
        type: String,
        default: "Talnova Onboarding is undergoing planned infrastructure maintenance.",
        required: true,
        trim: true,
    },
    sessionTimeoutMinutes: {
        type: Number,
        default: 60,
        min: 5,
        max: 1440,
        required: true,
    },
    enforceMfaAdmins: {
        type: Boolean,
        default: true,
        required: true,
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
}, {
    collection: "platform_settings",
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Static helper to get or initialize the singleton setting
PlatformSettingSchema.statics.getOrCreate = async function () {
    let setting = await this.findOne({ singleton: true });
    if (!setting) {
        setting = await this.findOneAndUpdate({ singleton: true }, {
            $setOnInsert: {
                singleton: true,
                maintenanceMode: false,
                maintenanceMessage: "Talnova Onboarding is undergoing planned infrastructure maintenance.",
                sessionTimeoutMinutes: 60,
                enforceMfaAdmins: true,
            },
        }, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
    return setting;
};
export const PlatformSetting = mongoose.model("PlatformSetting", PlatformSettingSchema);
export default PlatformSetting;
