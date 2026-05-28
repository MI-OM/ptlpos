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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const public_decorator_1 = require("../../core/decorators/public.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const create_tenant_dto_1 = require("./dto/create-tenant.dto");
const update_tenant_dto_1 = require("./dto/update-tenant.dto");
const update_tenant_details_dto_1 = require("./dto/update-tenant-details.dto");
const update_tenant_settings_dto_1 = require("./dto/update-tenant-settings.dto");
const tenants_service_1 = require("./tenants.service");
let TenantsController = class TenantsController {
    tenantsService;
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    create(dto) {
        return this.tenantsService.create(dto);
    }
    me(user) {
        return this.tenantsService.me(user);
    }
    update(user, dto) {
        return this.tenantsService.update(user, dto);
    }
    updateDetails(user, dto) {
        return this.tenantsService.updateDetails(user, dto);
    }
    updateSettings(user, dto) {
        return this.tenantsService.updateSettings(user, dto);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create new organization (tenant)',
        description: 'Create a new tenant/organization. Use /auth/register instead for complete setup with admin user.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Tenant created successfully',
        schema: {
            example: {
                id: 'clh7x1q0a0000qa10f0f0f0f0',
                name: 'Acme Corporation',
                createdAt: '2025-12-01T10:00:00Z',
                updatedAt: '2025-12-01T10:00:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Tenant with this name already exists',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tenant_dto_1.CreateTenantDto]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get current organization details',
        description: 'Retrieve details of the current tenant. Requires authentication.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Organization details',
        schema: {
            example: {
                id: 'clh7x1q0a0000qa10f0f0f0f0',
                name: 'Acme Corporation',
                createdAt: '2025-12-01T10:00:00Z',
                updatedAt: '2025-12-01T10:00:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - missing or invalid token',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "me", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Update current organization',
        description: 'Update organization details (name). Requires authentication.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Organization updated successfully',
        schema: {
            example: {
                id: 'clh7x1q0a0000qa10f0f0f0f0',
                name: 'Acme Corporation Updated',
                createdAt: '2025-12-01T10:00:00Z',
                updatedAt: '2025-12-01T11:30:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Organization name already in use',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_tenant_dto_1.UpdateTenantDto]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('me/details'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Update organization profile details',
        description: 'Update detailed organization information including email, phone, website, logo, address, etc. Requires authentication.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Organization details updated successfully',
        schema: {
            example: {
                id: 'clh7x1q0a0000qa10f0f0f0f0',
                name: 'Acme Corporation',
                email: 'contact@acme.com',
                phone: '+1-800-ACME-123',
                website: 'https://acme.com',
                logoUrl: 'https://cdn.example.com/logo.png',
                industry: 'Technology',
                address: '123 Tech Street',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94102',
                country: 'United States',
                isEmailVerified: false,
                createdAt: '2025-12-01T10:00:00Z',
                updatedAt: '2025-12-01T11:30:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Email already in use by another organization',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_tenant_details_dto_1.UpdateTenantDetailsDto]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "updateDetails", null);
__decorate([
    (0, common_1.Patch)('me/settings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Update organization settings',
        description: 'Update organization settings including tax rate and other configuration. Requires ADMIN role.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Organization settings updated successfully',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_tenant_settings_dto_1.UpdateTenantSettingsDto]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "updateSettings", null);
exports.TenantsController = TenantsController = __decorate([
    (0, common_1.Controller)('tenants'),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map