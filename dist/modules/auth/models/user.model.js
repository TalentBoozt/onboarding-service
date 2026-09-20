import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    auth: {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        emailVerified: { type: Boolean, default: false },
        authProvider: {
            type: String,
            enum: ["local", "saml2", "okta", "azure_ad", "google", "oidc"],
            default: "local",
        },
        lastLoginAt: { type: Date },
        passwordChangedAt: { type: Date },
    },
    profile: {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        fullName: { type: String, required: true, trim: true },
        avatar: {
            uploadId: { type: Schema.Types.ObjectId },
            fileName: { type: String },
            publicUrl: { type: String },
        },
        phone: { type: String },
        location: { type: String },
        timezone: { type: String },
    },
    employment: {
        employeeId: { type: String },
        badgeId: { type: String, trim: true },
        nationalId: { type: String, trim: true },
        department: { type: String },
        departmentId: { type: Schema.Types.ObjectId },
        teamId: { type: Schema.Types.ObjectId },
        jobTitle: { type: String },
        jobTitleId: { type: Schema.Types.ObjectId },
        designation: { type: String },
        payrollCategory: { type: String },
        managerId: { type: Schema.Types.ObjectId },
        employmentType: {
            type: String,
            enum: ["full_time", "part_time", "contractor", "intern"],
            default: "full_time",
        },
        hireDate: { type: Date },
        status: {
            type: String,
            enum: ["invited", "active", "onboarding", "inactive", "on_leave", "sick", "terminated"],
            default: "invited",
        },
        onboardingState: {
            type: String,
            enum: ["not_started", "active", "paused", "completed", "archived"],
            default: "active",
        },
        onboardingStateReason: { type: String },
        onboardingPausedAt: { type: Date },
    },
    permissions: {
        role: {
            type: String,
            enum: ["owner", "admin", "manager", "employee", "super_admin", "it_admin"],
            default: "employee",
        },
        customRoles: { type: [String], default: [] },
    },
    preferences: {
        language: { type: String, default: "en" },
        theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
        emailNotifications: { type: Boolean, default: true },
    },
    statistics: {
        assignedJourneys: { type: Number, default: 0 },
        completedJourneys: { type: Number, default: 0 },
        certificates: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
    },
    security: {
        mfaEnabled: { type: Boolean, default: false },
        failedLoginAttempts: { type: Number, default: 0 },
        lockedUntil: { type: Date },
        lastPasswordReset: { type: Date },
        passwordResetToken: { type: String },
        passwordResetExpires: { type: Date },
        supervisorPinHash: { type: String },
    },
    compliance: {
        legalHold: { type: Boolean, default: false },
        legalHoldReason: { type: String },
        legalHoldPlacedAt: { type: Date },
        legalHoldPlacedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    createdBy: { type: Schema.Types.ObjectId },
    updatedBy: { type: Schema.Types.ObjectId },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId },
}, {
    timestamps: true,
});
// Pre-save hook to populate full name and clean up strings
UserSchema.pre("validate", function (next) {
    this.profile.fullName = `${this.profile.firstName} ${this.profile.lastName}`.trim();
    next();
});
// Configure Indexes
UserSchema.index({ organizationId: 1 });
UserSchema.index({ "employment.departmentId": 1 });
UserSchema.index({ "employment.teamId": 1 });
UserSchema.index({ "employment.managerId": 1 });
UserSchema.index({ "permissions.role": 1 });
UserSchema.index({ "employment.status": 1 });
UserSchema.index({ isDeleted: 1 });
// Compound Indexes
UserSchema.index({ organizationId: 1, isDeleted: 1 });
UserSchema.index({ organizationId: 1, "auth.email": 1 });
UserSchema.index({ organizationId: 1, "permissions.role": 1 });
UserSchema.index({ organizationId: 1, "employment.badgeId": 1 }, { sparse: true });
UserSchema.index({ organizationId: 1, "employment.nationalId": 1 }, { sparse: true });
/**
 * CANONICAL PERSISTENCE MODEL:
 * 'User' (MongoDB collection: 'users') is the single authoritative source of truth
 * for all human accounts, employee profiles, and system identities in Talnova Onboarding.
 *
 * To avoid data model duplication, DO NOT create a separate 'Employee' Mongoose collection.
 * All employee-specific fields (employment, departmentId, hireDate, status) are natively
 * embedded within this canonical schema.
 */
export const User = mongoose.model("User", UserSchema);
// Architectural alias to prevent regression or duplicate collection creation
export const EmployeeModel = User;
export default User;
