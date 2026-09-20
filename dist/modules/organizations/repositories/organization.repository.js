import { Organization } from "../models/organization.model.js";
export class OrganizationRepository {
    async findById(id) {
        return Organization.findOne({ _id: id, isDeleted: false });
    }
    async findBySlug(slug) {
        return Organization.findOne({ slug: slug.toLowerCase(), isDeleted: false });
    }
    async create(orgData) {
        const org = new Organization(orgData);
        return org.save();
    }
    async update(id, updateData) {
        return Organization.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: updateData }, { new: true });
    }
    // Department sub-document operations
    async addDepartment(orgId, department) {
        return Organization.findOneAndUpdate({ _id: orgId, isDeleted: false }, { $push: { departments: department } }, { new: true });
    }
    async updateDepartment(orgId, deptId, updateData) {
        // Map fields to $set operators
        const updateObj = {};
        for (const [key, value] of Object.entries(updateData)) {
            updateObj[`departments.$.${key}`] = value;
        }
        return Organization.findOneAndUpdate({ _id: orgId, "departments._id": deptId, isDeleted: false }, { $set: updateObj }, { new: true });
    }
    async deleteDepartment(orgId, deptId) {
        return Organization.findOneAndUpdate({ _id: orgId, isDeleted: false }, { $pull: { departments: { _id: deptId } } }, { new: true });
    }
    // Team sub-document operations
    async addTeam(orgId, team) {
        return Organization.findOneAndUpdate({ _id: orgId, isDeleted: false }, { $push: { teams: team } }, { new: true });
    }
    async updateTeam(orgId, teamId, updateData) {
        const updateObj = {};
        for (const [key, value] of Object.entries(updateData)) {
            updateObj[`teams.$.${key}`] = value;
        }
        return Organization.findOneAndUpdate({ _id: orgId, "teams._id": teamId, isDeleted: false }, { $set: updateObj }, { new: true });
    }
}
export default OrganizationRepository;
