import mongoose, { Schema } from "mongoose";
const AICitationSchema = new Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    articleId: { type: String },
}, { _id: false });
const AIActionSuggestionSchema = new Schema({
    text: { type: String, required: true },
    action: { type: String, required: true },
}, { _id: false });
const AIMessageSchema = new Schema({
    sender: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    citations: { type: [AICitationSchema], default: [] },
    actionSuggestions: { type: [AIActionSuggestionSchema], default: [] },
    timestamp: { type: Date, default: Date.now },
});
const AIFeedbackSchema = new Schema({
    messageId: { type: String, required: true },
    rating: { type: String, enum: ["up", "down"], required: true },
    comment: { type: String },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });
const AIConversationSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    title: { type: String, required: true, default: "Onboarding Chat" },
    messages: { type: [AIMessageSchema], default: [] },
    feedback: { type: [AIFeedbackSchema], default: [] },
}, {
    timestamps: true,
});
AIConversationSchema.index({ organizationId: 1, userId: 1 });
export const AIConversation = mongoose.model("AIConversation", AIConversationSchema);
export default AIConversation;
