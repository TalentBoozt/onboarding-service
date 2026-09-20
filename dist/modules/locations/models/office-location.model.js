import mongoose, { Schema } from "mongoose";
const DeskSchema = new Schema({
    deskNumber: { type: String, required: true },
    zone: { type: String },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    assignedUserId: { type: Schema.Types.ObjectId, ref: "User" },
    assignedUserName: { type: String },
    isAvailable: { type: Boolean, default: true },
}, { _id: false });
const FloorPlanSchema = new Schema({
    floorNumber: { type: Number, required: true },
    floorName: { type: String, required: true },
    mapImageUrl: { type: String },
    desks: { type: [DeskSchema], default: [] },
}, { _id: false });
const AccessInfoSchema = new Schema({
    wifiSsd: { type: String },
    wifiPassword: { type: String },
    buildingAccessCode: { type: String },
    parkingInfo: { type: String },
    arrivalInstructions: { type: String },
}, { _id: false });
const OfficeAddressSchema = new Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    zip: { type: String },
    country: { type: String, required: true },
}, { _id: false });
const OfficeLocationSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    name: { type: String, required: true },
    code: { type: String, required: true },
    address: { type: OfficeAddressSchema, required: true },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number },
    },
    timezone: { type: String, default: "UTC" },
    contactEmail: { type: String },
    contactPhone: { type: String },
    accessInfo: { type: AccessInfoSchema, default: {} },
    floors: { type: [FloorPlanSchema], default: [] },
    isPrimary: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
}, {
    timestamps: true,
});
OfficeLocationSchema.index({ organizationId: 1, code: 1 }, { unique: true });
export const OfficeLocation = mongoose.model("OfficeLocation", OfficeLocationSchema);
export default OfficeLocation;
