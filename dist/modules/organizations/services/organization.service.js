import AppError from "../../../common/errors/app-error.js";
import mongoose from "mongoose";
export class OrganizationService {
    orgRepository;
    constructor(orgRepository) {
        this.orgRepository = orgRepository;
    }
    async getOrganization(orgId) {
        const org = await this.orgRepository.findById(orgId);
        if (!org) {
            throw new AppError(404, "NOT_FOUND", "Organization not found");
        }
        return org;
    }
    async updateOrganization(orgId, updateData) {
        const org = await this.orgRepository.update(orgId, updateData);
        if (!org) {
            throw new AppError(404, "NOT_FOUND", "Organization not found");
        }
        return org;
    }
    async updateBranding(orgId, branding) {
        const org = await this.getOrganization(orgId);
        const updatedBranding = {
            ...(org.branding || {}),
            ...branding,
        };
        return this.updateOrganization(orgId, { branding: updatedBranding });
    }
    async updateSecurity(orgId, securitySettings) {
        const org = await this.getOrganization(orgId);
        const updatedSecurity = {
            ...(org.securitySettings || {}),
            ...securitySettings,
        };
        return this.updateOrganization(orgId, { securitySettings: updatedSecurity });
    }
    // Department services
    async createDepartment(orgId, deptData) {
        const org = await this.getOrganization(orgId);
        // Check for duplicate code within tenant
        if (deptData.code) {
            const normalizedCode = deptData.code.trim().toUpperCase();
            const codeExists = org.departments?.some((d) => d.active !== false && d.code?.toUpperCase() === normalizedCode);
            if (codeExists) {
                throw new AppError(400, "DEPARTMENT_CODE_EXISTS", `Department with code '${deptData.code}' already exists`);
            }
        }
        // Check for duplicate name within tenant
        const normalizedName = deptData.name.trim().toLowerCase();
        const nameExists = org.departments?.some((d) => d.active !== false && d.name.trim().toLowerCase() === normalizedName);
        if (nameExists) {
            throw new AppError(400, "DEPARTMENT_NAME_EXISTS", `Department with name '${deptData.name}' already exists`);
        }
        const dept = {
            _id: new mongoose.Types.ObjectId(),
            name: deptData.name.trim(),
            code: deptData.code ? deptData.code.trim().toUpperCase() : deptData.name.trim().substring(0, 3).toUpperCase(),
            description: deptData.description,
            color: deptData.color,
            active: true,
        };
        const updatedOrg = await this.orgRepository.addDepartment(orgId, dept);
        if (!updatedOrg) {
            throw new AppError(404, "NOT_FOUND", "Organization not found");
        }
        return dept;
    }
    async updateDepartment(orgId, deptId, updateData) {
        const org = await this.orgRepository.updateDepartment(orgId, deptId, updateData);
        if (!org) {
            throw new AppError(404, "NOT_FOUND", "Organization or Department not found");
        }
        return org.departments.find((d) => d._id.toString() === deptId.toString());
    }
    async deleteDepartment(orgId, deptId) {
        const updatedOrg = await this.orgRepository.deleteDepartment(orgId, deptId);
        if (!updatedOrg) {
            throw new AppError(404, "NOT_FOUND", "Organization or Department not found");
        }
        return true;
    }
    // Team services
    async createTeam(orgId, teamData) {
        const team = {
            _id: new mongoose.Types.ObjectId(),
            name: teamData.name,
            departmentId: teamData.departmentId ? new mongoose.Types.ObjectId(teamData.departmentId) : undefined,
            active: true,
        };
        const org = await this.orgRepository.addTeam(orgId, team);
        if (!org) {
            throw new AppError(404, "NOT_FOUND", "Organization not found");
        }
        return team;
    }
    async updateTeam(orgId, teamId, updateData) {
        if (updateData.departmentId) {
            updateData.departmentId = new mongoose.Types.ObjectId(updateData.departmentId);
        }
        const org = await this.orgRepository.updateTeam(orgId, teamId, updateData);
        if (!org) {
            throw new AppError(404, "NOT_FOUND", "Organization or Team not found");
        }
        return org.teams.find((t) => t._id.toString() === teamId.toString());
    }
    async deleteTeam(orgId, teamId) {
        return this.updateTeam(orgId, teamId, { active: false });
    }
}
export default OrganizationService;
