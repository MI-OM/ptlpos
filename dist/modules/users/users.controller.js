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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    findAll(user) {
        return this.usersService.findAll(user.tenantId);
    }
    findOne(user, id) {
        return this.usersService.findOne(user.tenantId, id);
    }
    create(user, dto) {
        return this.usersService.create(user, dto);
    }
    update(user, id, dto) {
        return this.usersService.update(user, id, dto);
    }
    delete(user, id) {
        return this.usersService.delete(user, id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all users in organization',
        description: 'Get all users for the current tenant. Requires ADMIN or MANAGER role.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of users',
        schema: {
            example: [
                {
                    id: 'clh7x1q0b0000qa20f0f0f0f0',
                    name: 'John Doe',
                    email: 'john@example.com',
                    tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
                    role: { name: 'ADMIN' },
                    createdAt: '2025-12-01T10:00:00Z',
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Insufficient permissions',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'User ID',
        example: 'clh7x1q0b0000qa20f0f0f0f0',
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user by ID',
        description: 'Retrieve a specific user. Requires ADMIN or MANAGER role.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User details',
        schema: {
            example: {
                id: 'clh7x1q0b0000qa20f0f0f0f0',
                name: 'John Doe',
                email: 'john@example.com',
                tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
                role: { name: 'ADMIN' },
                createdAt: '2025-12-01T10:00:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'User not found',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new user',
        description: 'Create a new user in the organization. Requires ADMIN role.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User created successfully',
        schema: {
            example: {
                id: 'clh7x1q0c0000qa30f0f0f0f0',
                name: 'Jane Smith',
                email: 'jane@example.com',
                tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
                role: 'MANAGER',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Validation error or email already exists',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Only ADMIN can create users',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN),
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'User ID to update',
        example: 'clh7x1q0b0000qa20f0f0f0f0',
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Update user',
        description: 'Update user details (name, email, password, or role). Requires ADMIN role.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User updated successfully',
        schema: {
            example: {
                id: 'clh7x1q0b0000qa20f0f0f0f0',
                name: 'John Doe Updated',
                email: 'john.new@example.com',
                tenantId: 'clh7x1q0a0000qa10f0f0f0f0',
                role: 'MANAGER',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'User not found',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Email already in use by another user',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN),
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'User ID to delete',
        example: 'clh7x1q0b0000qa20f0f0f0f0',
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete user',
        description: 'Permanently delete a user. Requires ADMIN role.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User deleted successfully',
        schema: {
            example: {
                message: 'User deleted successfully',
                id: 'clh7x1q0b0000qa20f0f0f0f0',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'User not found',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "delete", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map