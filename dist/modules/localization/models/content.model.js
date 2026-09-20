import mongoose, { Schema } from "mongoose";
const ContentSchema = new Schema({
    key: { type: String, required: true, unique: true, trim: true, index: true },
    type: {
        type: String,
        enum: ["article", "journey", "lesson", "email_template", "help_text", "notification", "generic"],
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "archived"],
        default: "active",
    },
}, { timestamps: true });
ContentSchema.index({ type: 1 });
ContentSchema.index({ status: 1 });
export const Content = mongoose.model("Content", ContentSchema, "i18nContent");
export default Content;
