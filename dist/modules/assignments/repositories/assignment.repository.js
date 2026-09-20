import { EmployeeAssignment } from "../models/assignment.model.js";
import mongoose from "mongoose";
export class EmployeeAssignmentRepository {
    async findById(id) {
        return EmployeeAssignment.findOne({ _id: id });
    }
    async findByIdAndOrg(id, orgId) {
        return EmployeeAssignment.findOne({ _id: id, organizationId: orgId });
    }
    async find(filter, pagination) {
        const query = {
            organizationId: filter.organizationId,
        };
        if (filter.employeeId) {
            query.employeeId = new mongoose.Types.ObjectId(filter.employeeId);
        }
        if (filter.status) {
            query.status = filter.status;
        }
        if (filter.journeyId) {
            query["journey.journeyId"] = new mongoose.Types.ObjectId(filter.journeyId);
        }
        const total = await EmployeeAssignment.countDocuments(query);
        const page = Math.max(1, pagination.page);
        const limit = Math.max(1, pagination.limit);
        const skip = (page - 1) * limit;
        const sortField = pagination.sortBy || "createdAt";
        const sortOrder = pagination.sortOrder === "asc" ? 1 : -1;
        const assignments = await EmployeeAssignment.find(query)
            .populate("employeeId", "profile.firstName profile.lastName auth.email")
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit);
        return { assignments, total };
    }
    async create(assignmentData) {
        const assignment = new EmployeeAssignment(assignmentData);
        return assignment.save();
    }
    async update(id, updateData) {
        return EmployeeAssignment.findOneAndUpdate({ _id: id }, { $set: updateData }, { new: true });
    }
}
export default EmployeeAssignmentRepository;
