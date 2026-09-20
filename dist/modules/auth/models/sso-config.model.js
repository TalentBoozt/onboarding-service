import mongoose, { Schema } from "mongoose";
const SSORoleMappingSchema = new Schema({
    idpGroup: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "employee"], default: "employee" },
}, { _id: false });
const SSOConfigSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization", unique: true },
    provider: {
        type: String,
        enum: ["okta", "azure_ad", "google_workspace", "custom_saml", "custom_oidc", "saml2"],
        default: "okta",
    },
    domains: { type: [String], default: [] },
    issuerUrl: { type: String },
    clientId: { type: String },
    clientSecret: { type: String },
    ssoUrl: { type: String },
    certificate: { type: String },
    enforceSSO: { type: Boolean, default: false },
    defaultRole: { type: String, enum: ["admin", "manager", "employee"], default: "employee" },
    roleMappings: { type: [SSORoleMappingSchema], default: [] },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, {
    timestamps: true,
});
SSOConfigSchema.index({ domains: 1 });
export const SSOConfig = mongoose.model("SSOConfig", SSOConfigSchema);
export default SSOConfig;
