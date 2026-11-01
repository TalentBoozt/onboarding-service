import mongoose, { Schema } from "mongoose";
import { encryptSecret, decryptSecret, maskSecret, isEncryptedSecret, } from "../../../utils/crypto.js";
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
    certificate: {
        type: String,
        get: (val) => {
            if (!val)
                return val;
            try {
                return isEncryptedSecret(val) ? decryptSecret(val) : val;
            }
            catch {
                return val;
            }
        },
    },
    enforceSSO: { type: Boolean, default: false },
    defaultRole: { type: String, enum: ["admin", "manager", "employee"], default: "employee" },
    roleMappings: { type: [SSORoleMappingSchema], default: [] },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, {
    timestamps: true,
    toJSON: {
        getters: true,
        transform: (_doc, ret) => {
            if (ret.clientSecret) {
                try {
                    const plain = isEncryptedSecret(ret.clientSecret)
                        ? decryptSecret(ret.clientSecret)
                        : ret.clientSecret;
                    ret.clientSecret = maskSecret(plain);
                }
                catch {
                    ret.clientSecret = maskSecret(ret.clientSecret);
                }
            }
            return ret;
        },
    },
    toObject: {
        getters: true,
        transform: (_doc, ret) => {
            if (ret.clientSecret) {
                try {
                    const plain = isEncryptedSecret(ret.clientSecret)
                        ? decryptSecret(ret.clientSecret)
                        : ret.clientSecret;
                    ret.clientSecret = maskSecret(plain);
                }
                catch {
                    ret.clientSecret = maskSecret(ret.clientSecret);
                }
            }
            return ret;
        },
    },
});
// Pre-save hook: ensure clientSecret and certificate are stored encrypted in MongoDB
SSOConfigSchema.pre("save", function (next) {
    if (this.isModified("clientSecret") && this.clientSecret && !isEncryptedSecret(this.clientSecret)) {
        this.clientSecret = encryptSecret(this.clientSecret);
    }
    if (this.isModified("certificate") && this.certificate && !isEncryptedSecret(this.certificate)) {
        this.certificate = encryptSecret(this.certificate);
    }
    next();
});
SSOConfigSchema.methods.getDecryptedClientSecret = function () {
    if (!this.clientSecret)
        return "";
    try {
        return isEncryptedSecret(this.clientSecret) ? decryptSecret(this.clientSecret) : this.clientSecret;
    }
    catch {
        return "";
    }
};
SSOConfigSchema.methods.getDecryptedCertificate = function () {
    if (!this.certificate)
        return "";
    try {
        return isEncryptedSecret(this.certificate) ? decryptSecret(this.certificate) : this.certificate;
    }
    catch {
        return this.certificate;
    }
};
SSOConfigSchema.index({ domains: 1 });
export const SSOConfig = mongoose.model("SSOConfig", SSOConfigSchema);
export default SSOConfig;
