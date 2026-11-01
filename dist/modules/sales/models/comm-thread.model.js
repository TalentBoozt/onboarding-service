import mongoose, { Schema } from "mongoose";
const CommMessageSchema = new Schema({
    channel: { type: String, enum: ["email", "whatsapp"], required: true },
    direction: { type: String, enum: ["inbound", "outbound"], required: true },
    from: { type: String, required: true },
    to: [{ type: String, required: true }],
    subject: String,
    body: { type: String, required: true },
    status: { type: String, enum: ["sent", "delivered", "read", "failed"], default: "sent" },
    providerMessageId: String,
    sentAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
});
const CommThreadSchema = new Schema({
    channel: { type: String, enum: ["email", "whatsapp"], required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: "SalesLead", index: true },
    contactId: { type: Schema.Types.ObjectId, ref: "SalesContact", index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "SalesCompany", index: true },
    dealId: { type: Schema.Types.ObjectId, ref: "SalesDeal", index: true },
    status: { type: String, enum: ["open", "pending", "resolved"], default: "open", index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    subject: { type: String, trim: true },
    lastMessageSnippet: { type: String },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    messages: [CommMessageSchema],
}, {
    timestamps: true,
});
CommThreadSchema.index({ status: 1, lastMessageAt: -1 });
export const CommThread = mongoose.model("SalesCommThread", CommThreadSchema);
export default CommThread;
