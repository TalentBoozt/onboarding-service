import mongoose, { Schema } from "mongoose";
const AICourseQuizQuestionSchema = new Schema({
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    correctOptionIndex: { type: Number, required: true },
    explanation: { type: String },
}, { _id: false });
const AICourseLessonSchema = new Schema({
    lessonId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    durationMinutes: { type: Number, default: 15 },
    quizQuestions: { type: [AICourseQuizQuestionSchema], default: [] },
}, { _id: false });
const AICourseModuleSchema = new Schema({
    moduleId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    lessons: { type: [AICourseLessonSchema], default: [] },
}, { _id: false });
const AICourseDraftSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetRole: { type: String, required: true, default: "All Roles" },
    department: { type: String, required: true, default: "General" },
    status: { type: String, enum: ["draft", "approved", "published"], default: "draft" },
    modules: { type: [AICourseModuleSchema], default: [] },
    version: { type: Number, default: 1 },
    publishedJourneyId: { type: Schema.Types.ObjectId, ref: "Journey" },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
}, {
    timestamps: true,
});
AICourseDraftSchema.index({ organizationId: 1, status: 1 });
export const AICourseDraft = mongoose.model("AICourseDraft", AICourseDraftSchema);
export default AICourseDraft;
