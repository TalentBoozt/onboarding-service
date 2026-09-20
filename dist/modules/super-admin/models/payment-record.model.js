import mongoose, { Schema } from "mongoose";
const PaymentRecordSchema = new Schema({
    paymentNo: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    invoiceId: {
        type: Schema.Types.ObjectId,
        ref: "Invoice",
        required: false,
        index: true,
    },
    invoiceNo: {
        type: String,
        required: false,
        uppercase: true,
        trim: true,
        default: "N/A",
        index: true,
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },
    organizationName: {
        type: String,
        required: true,
        trim: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01,
    },
    currency: {
        type: String,
        default: "USD",
        uppercase: true,
        trim: true,
    },
    paymentDate: {
        type: Date,
        default: Date.now,
        required: true,
        index: true,
    },
    paymentMethod: {
        type: String,
        enum: ["bank_transfer", "wire", "check", "manual_card", "other"],
        default: "bank_transfer",
    },
    referenceNumber: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    verificationStatus: {
        type: String,
        enum: ["verified", "pending_reconciliation", "rejected"],
        default: "verified",
        index: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    recordedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    recordedByEmail: {
        type: String,
        trim: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    collection: "payment_records",
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Virtual aliases for legacy document compatibility
PaymentRecordSchema.virtual("receiptNo")
    .get(function () {
    return this.paymentNo || this._doc?.receiptNo;
})
    .set(function (val) {
    this.paymentNo = val;
});
PaymentRecordSchema.virtual("method")
    .get(function () {
    return this.paymentMethod || this._doc?.method;
})
    .set(function (val) {
    const v = String(val).toLowerCase();
    if (v.includes("wire"))
        this.paymentMethod = "wire";
    else if (v.includes("check"))
        this.paymentMethod = "check";
    else if (v.includes("card"))
        this.paymentMethod = "manual_card";
    else if (v.includes("ach") || v.includes("transfer") || v.includes("bank"))
        this.paymentMethod = "bank_transfer";
    else
        this.paymentMethod = "other";
});
PaymentRecordSchema.virtual("reference")
    .get(function () {
    return this.referenceNumber || this._doc?.reference;
})
    .set(function (val) {
    this.referenceNumber = val;
});
PaymentRecordSchema.virtual("recordedAt")
    .get(function () {
    return this.paymentDate || this._doc?.recordedAt;
})
    .set(function (val) {
    this.paymentDate = val;
});
// Pre-validate hook for precision rounding and fallbacks
PaymentRecordSchema.pre("validate", function (next) {
    const doc = this;
    if (doc.amount) {
        doc.amount = Math.round((doc.amount + Number.EPSILON) * 100) / 100;
    }
    if (!doc.paymentNo && doc.receiptNo) {
        doc.paymentNo = doc.receiptNo;
    }
    if (!doc.referenceNumber && doc.reference) {
        doc.referenceNumber = doc.reference;
    }
    if (!doc.paymentDate && doc.recordedAt) {
        doc.paymentDate = doc.recordedAt;
    }
    next();
});
// Compound Indexes
PaymentRecordSchema.index({ organizationId: 1, paymentDate: -1 });
PaymentRecordSchema.index({ verificationStatus: 1, paymentDate: 1 });
export const PaymentRecord = mongoose.model("PaymentRecord", PaymentRecordSchema);
export default PaymentRecord;
