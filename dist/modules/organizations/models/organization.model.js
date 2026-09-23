import mongoose, { Schema } from "mongoose";
const UploadReferenceSchema = new Schema({
    uploadId: { type: Schema.Types.ObjectId, required: true },
    fileName: { type: String, required: true },
    publicUrl: { type: String },
});
const DepartmentSchema = new Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String },
    color: { type: String },
    active: { type: Boolean, default: true },
});
const TeamSchema = new Schema({
    departmentId: { type: Schema.Types.ObjectId },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
});
const JobTitleSchema = new Schema({
    title: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
});
const LocationSchema = new Schema({
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    timezone: { type: String, required: true },
});
const OrganizationSchema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    domain: { type: String, lowercase: true, trim: true },
    description: { type: String },
    website: { type: String },
    industry: { type: String },
    size: {
        type: String,
        enum: ["1-10", "11-50", "51-250", "251-1000", "1000+"],
    },
    supportEmail: { type: String, lowercase: true, trim: true },
    status: { type: String, enum: ["Active", "Suspended"], default: "Active" },
    plan: { type: String, enum: ["Starter", "Growth", "Professional", "Enterprise"], default: "Starter" },
    subscription: {
        plan: { type: String, default: "Starter" },
        status: { type: String, default: "active" },
        seatLimit: { type: Number, default: 50 },
        billingCycle: { type: String, default: "monthly" },
        renewsAt: { type: Date }
    },
    limits: {
        maxUsers: { type: Number, default: 50 },
        maxStorageGb: { type: Number, default: 10 }
    },
    branding: {
        logo: { type: UploadReferenceSchema },
        favicon: { type: UploadReferenceSchema },
        primaryColor: { type: String, default: "#4F46E5" },
        secondaryColor: { type: String, default: "#10B981" },
        accentColor: { type: String, default: "#F59E0B" },
    },
    workspace: {
        timezone: { type: String, default: "UTC" },
        locale: { type: String, default: "en-US" },
        dateFormat: { type: String, default: "YYYY-MM-DD" },
        firstDayOfWeek: { type: Number, default: 0 },
    },
    departments: { type: [DepartmentSchema], default: [] },
    categories: { type: [String], default: ["Engineering", "Sales", "General"] },
    teams: { type: [TeamSchema], default: [] },
    jobTitles: { type: [JobTitleSchema], default: [] },
    locations: { type: [LocationSchema], default: [] },
    notificationSettings: {
        assignmentEmail: { type: Boolean, default: true },
        reminderEmail: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: true },
    },
    securitySettings: {
        allowPasswordLogin: { type: Boolean, default: true },
        enforceMfa: { type: Boolean, default: false },
        sessionTimeout: { type: Number, default: 3600 },
    },
    analytics: {
        totalEmployees: { type: Number, default: 0 },
        activeEmployees: { type: Number, default: 0 },
        journeys: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
    },
    certificate: {
        template: { type: String, enum: ["classic", "modern", "minimalist", "academic", "gradient", "executive"], default: "classic" },
        theme: { type: String, enum: ["light", "dark"], default: "light" },
        accentColor: { type: String },
        badgeStyle: { type: String, enum: ["medal", "laurel", "shield", "crypto", "ribbon"], default: "medal" },
        signatureUrl: { type: String },
        signatoryName: { type: String },
        signatoryTitle: { type: String },
    },
    ssoConfig: {
        enabled: { type: Boolean, default: false },
        provider: { type: String, default: "okta" },
        domain: { type: String },
        domains: { type: [String], default: [] },
        entryPoint: { type: String },
        ssoUrl: { type: String },
        issuerId: { type: String },
        issuerUrl: { type: String },
        certificate: { type: String },
        enforceSSO: { type: Boolean, default: false },
        status: { type: String, enum: ["active", "disabled"], default: "disabled" },
    },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    updatedBy: { type: Schema.Types.ObjectId },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId },
}, {
    timestamps: true,
});
// Indexes
OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ isDeleted: 1 });
export const Organization = mongoose.model("Organization", OrganizationSchema);
export default Organization;
