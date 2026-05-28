"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const create_branch_dto_1 = require("./dto/create-branch.dto");
const branches_service_1 = require("./branches.service");
let BranchesController = class BranchesController {
    branchesService;
    constructor(branchesService) {
        this.branchesService = branchesService;
    }
    findAll(user) {
        return this.branchesService.findAll(user.tenantId);
    }
    findOne(user, id) {
        return this.branchesService.findOne(user.tenantId, id);
    }
    create(user, dto) {
        return this.branchesService.create(user, dto);
    }
    update(user, id, dto) {
        return this.branchesService.update(user, id, dto);
    }
    delete(user, id) {
        return this.branchesService.delete(user, id);
    }
};
exports.BranchesController = BranchesController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List all branches' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of all branches for the current tenant',
        schema: {
            example: [
                {
                    id: 'branch-123',
                    name: 'Main Store',
                    address: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001',
                    country: 'USA',
                    tenantId: 'tenant-123',
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                },
            ],
        },
    }),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get branch by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Branch ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Branch details',
        schema: {
            example: {
                id: 'branch-123',
                name: 'Main Store',
                address: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'USA',
                tenantId: 'tenant-123',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Branch not found' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new branch' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Branch created successfully',
        schema: {
            example: {
                id: 'branch-123',
                name: 'Main Store',
                address: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'USA',
                tenantId: 'tenant-123',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_branch_dto_1.CreateBranchDto]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update a branch' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Branch ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Branch updated successfully',
        schema: {
            example: {
                id: 'branch-123',
                name: 'Updated Store',
                address: '456 Updated St',
                city: 'Boston',
                state: 'MA',
                zipCode: '02101',
                country: 'USA',
                tenantId: 'tenant-123',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-02T00:00:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Branch not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Put)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_branch_dto_1.UpdateBranchDto]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete a branch' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Branch ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Branch deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Branch not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN),
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "delete", null);
exports.BranchesController = BranchesController = __decorate([
    (0, swagger_1.ApiTags)('branches'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('branches'),
    __metadata("design:paramtypes", [branches_service_1.BranchesService])
], BranchesController);
//# sourceMappingURL=branches.controller.js.map