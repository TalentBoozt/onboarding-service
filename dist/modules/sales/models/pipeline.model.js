import mongoose, { Schema } from "mongoose";
const PipelineStageSchema = new Schema({
    key: { type: String, required: true },
    name: { type: String, required: true },
    probability: { type: Number, required: true, min: 0, max: 1 },
    order: { type: Number, required: true },
    requiredFields: [{ type: String }],
    slaDays: { type: Number },
});
const PipelineSchema = new Schema({
    name: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false, index: true },
    stages: [PipelineStageSchema],
}, {
    timestamps: true,
});
export const Pipeline = mongoose.model("SalesPipeline", PipelineSchema);
export default Pipeline;
