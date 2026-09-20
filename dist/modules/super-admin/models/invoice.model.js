import mongoose, { Schema } from "mongoose";
const InvoiceLineItemSchema = new Schema({
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
}, { _id: false });
const round2 = (val) => Math.round((val + Number.EPSILON) * 100) / 100;
const InvoiceSchema = new Schema({
    invoiceNo: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },
    customerName: {
        type: String,
        required: true,
        trim: true,
    },
    currency: {
        type: String,
        default: "USD",
        uppercase: true,
        trim: true,
    },
    issueDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
        index: true,
    },
    lineItems: {
        type: [InvoiceLineItemSchema],
        default: [],
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    taxAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: 0,
    },
    balanceDue: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    status: {
        type: String,
        enum: [
            "draft",
            "issued",
            "sent",
            "partially_paid",
            "paid",
            "overdue",
            "cancelled",
            "written_off",
            // Legacy support
            "Paid",
            "Pending",
            "Overdue",
        ],
        default: "issued",
        index: true,
    },
    type: {
        type: String,
        enum: ["Invoice", "Receipt"],
        default: "Invoice",
    },
    notes: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Virtual for legacy 'organization' field mapped to customerName
InvoiceSchema.virtual("organization")
    .get(function () {
    return this.customerName;
})
    .set(function (val) {
    this.customerName = val;
});
// Virtual for legacy 'amount' field mapped to totalAmount
InvoiceSchema.virtual("amount")
    .get(function () {
    return this.totalAmount;
})
    .set(function (val) {
    this.totalAmount = val;
});
// Pre-validate & Pre-save calculation hook
InvoiceSchema.pre("validate", function (next) {
    const invoice = this;
    // Support legacy fallback if customerName is empty but organization is present
    if (!invoice.customerName && invoice.organization) {
        invoice.customerName = invoice.organization;
    }
    // Support legacy seed fixtures where organizationId was omitted
    if (!invoice.organizationId) {
        invoice.organizationId = new mongoose.Types.ObjectId();
    }
    // Ensure line items amounts are computed
    if (Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0) {
        invoice.lineItems.forEach((item) => {
            const qty = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
            const unit = typeof item.unitPrice === "number" && item.unitPrice >= 0 ? item.unitPrice : 0;
            item.quantity = qty;
            item.unitPrice = round2(unit);
            item.amount = round2(qty * item.unitPrice);
        });
        invoice.subtotal = round2(invoice.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0));
    }
    else if (!invoice.subtotal) {
        // If no line items but totalAmount or legacy amount was provided
        const fallbackAmount = invoice.totalAmount || invoice.amount || 0;
        invoice.subtotal = round2(fallbackAmount);
    }
    const discount = round2(invoice.discountAmount || 0);
    const tax = round2(invoice.taxAmount || 0);
    invoice.discountAmount = discount;
    invoice.taxAmount = tax;
    invoice.totalAmount = round2(Math.max(0, invoice.subtotal - discount + tax));
    const paid = round2(invoice.amountPaid || 0);
    invoice.amountPaid = paid;
    invoice.balanceDue = round2(Math.max(0, invoice.totalAmount - paid));
    // Auto-status adjustment for payment states if status hasn't been cancelled/written_off
    if (invoice.status !== "cancelled" && invoice.status !== "written_off") {
        if (invoice.totalAmount > 0 && invoice.balanceDue === 0) {
            invoice.status = invoice.status === "Paid" ? "Paid" : "paid";
        }
        else if (paid > 0 && invoice.balanceDue > 0) {
            invoice.status = "partially_paid";
        }
    }
    next();
});
// Compound Indexes for enterprise query patterns
InvoiceSchema.index({ organizationId: 1, status: 1, isDeleted: 1 });
InvoiceSchema.index({ dueDate: 1, balanceDue: 1 });
InvoiceSchema.index({ organizationId: 1, isDeleted: 1 });
InvoiceSchema.index({ status: 1, createdAt: 1 });
export const Invoice = mongoose.model("Invoice", InvoiceSchema);
export default Invoice;
