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
exports.SuppliersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const create_supplier_dto_1 = require("./dto/create-supplier.dto");
const update_supplier_dto_1 = require("./dto/update-supplier.dto");
const suppliers_service_1 = require("./suppliers.service");
let SuppliersController = class SuppliersController {
    suppliersService;
    constructor(suppliersService) {
        this.suppliersService = suppliersService;
    }
    findAll(user) {
        return this.suppliersService.findAll(user.tenantId);
    }
    findOne(user, id) {
        return this.suppliersService.findOne(user.tenantId, id);
    }
    create(user, dto) {
        return this.suppliersService.create(user, dto);
    }
    update(user, id, dto) {
        return this.suppliersService.update(user, id, dto);
    }
    remove(user, id) {
        return this.suppliersService.remove(user.tenantId, id);
    }
};
exports.SuppliersController = SuppliersController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List all suppliers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suppliers list' }),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get supplier by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Supplier ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Supplier details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Supplier not found' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new supplier' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Supplier created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_supplier_dto_1.CreateSupplierDto]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update supplier information' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Supplier ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Supplier updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Supplier not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_supplier_dto_1.UpdateSupplierDto]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete a supplier' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Supplier ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Supplier deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Supplier not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "remove", null);
exports.SuppliersController = SuppliersController = __decorate([
    (0, swagger_1.ApiTags)('suppliers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('suppliers'),
    __metadata("design:paramtypes", [suppliers_service_1.SuppliersService])
], SuppliersController);
//# sourceMappingURL=suppliers.controller.js.map