import mongoose, { Schema } from "mongoose";
const KioskDeviceGroupSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    siteId: {
        type: Schema.Types.Mixed,
        default: null,
        trim: true
    },
    deviceIds: [
        {
            type: Schema.Types.ObjectId,
            ref: "KioskDevice"
        }
    ],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});
KioskDeviceGroupSchema.index({ organizationId: 1, name: 1 });
KioskDeviceGroupSchema.index({ organizationId: 1, isDeleted: 1 });
KioskDeviceGroupSchema.index({ deviceIds: 1 });
KioskDeviceGroupSchema.index({ siteId: 1 });
export const KioskDeviceGroupModel = mongoose.model("KioskDeviceGroup", KioskDeviceGroupSchema);
export default KioskDeviceGroupModel;
