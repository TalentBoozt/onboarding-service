import mongoose, { Schema } from "mongoose";
const BillingContactSchema = new Schema({
    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" }
}, { _id: false });
const CustomerAccountSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        unique: true,
        index: true
    },
    accountStatus: {
        type: String,
        enum: ["good_standing", "delinquent", "credit_hold", "vip"],
        default: "good_standing",
        index: true
    },
    billingCycle: {
        type: String,
        enum: ["monthly", "quarterly", "annual"],
        default: "monthly"
    },
    preferredCurrency: {
        type: String,
        default: "USD",
        uppercase: true,
        trim: true,
        maxlength: 3
    },
    creditLimit: {
        type: Number,
        default: 0,
        min: 0
    },
    billingContact: {
        type: BillingContactSchema,
        default: () => ({ name: "", email: "", phone: "", address: "" })
    },
    commercialNotes: {
        type: String,
        trim: true,
        default: ""
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
    collection: "customer_accounts"
});
// Format currency to uppercase and ensure credit limit is non-negative before validation
CustomerAccountSchema.pre("validate", function (next) {
    if (this.preferredCurrency) {
        this.preferredCurrency = this.preferredCurrency.toUpperCase().trim();
    }
    if (typeof this.creditLimit === "number" && this.creditLimit < 0) {
        this.creditLimit = 0;
    }
    next();
});
export const CustomerAccount = mongoose.models.CustomerAccount ||
    mongoose.model("CustomerAccount", CustomerAccountSchema);
export default CustomerAccount;
