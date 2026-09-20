import { QuickLink } from "../models/quick-link.model.js";
export class QuickLinkRepository {
    async findByOrg(orgId) {
        return QuickLink.find({ organizationId: orgId, isDeleted: false }).sort({ order: 1, createdAt: 1 });
    }
    async findByIdAndOrg(id, orgId) {
        return QuickLink.findOne({ _id: id, organizationId: orgId, isDeleted: false });
    }
    async create(data) {
        const quickLink = new QuickLink(data);
        return quickLink.save();
    }
    async update(id, updateData) {
        return QuickLink.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: updateData }, { new: true });
    }
    async softDelete(id) {
        return QuickLink.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: { isDeleted: true } }, { new: true });
    }
}
export default QuickLinkRepository;
