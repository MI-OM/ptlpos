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
exports.ExportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const exports_service_1 = require("./exports.service");
let ExportsController = class ExportsController {
    exportsService;
    constructor(exportsService) {
        this.exportsService = exportsService;
    }
    exportProducts(context) {
        return this.exportsService.exportProducts(context);
    }
    exportCustomers(context) {
        return this.exportsService.exportCustomers(context);
    }
    exportSuppliers(context) {
        return this.exportsService.exportSuppliers(context);
    }
    exportInventory(context, branchId) {
        return this.exportsService.exportInventory(context, branchId);
    }
    exportSales(context, from, to, branchId) {
        return this.exportsService.exportSales(context, from, to, branchId);
    }
};
exports.ExportsController = ExportsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Export products data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Products export file' }),
    (0, common_1.Get)('products'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExportsController.prototype, "exportProducts", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Export customers data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customers export file' }),
    (0, common_1.Get)('customers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExportsController.prototype, "exportCustomers", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Export suppliers data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suppliers export file' }),
    (0, common_1.Get)('suppliers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExportsController.prototype, "exportSuppliers", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Export inventory data' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', required: false, type: String, example: 'branch-123', description: 'Filter by branch ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory export file' }),
    (0, common_1.Get)('inventory'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ExportsController.prototype, "exportInventory", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Export sales data' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, type: String, description: 'Start date (ISO)' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, type: String, description: 'End date (ISO)' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', required: false, type: String, description: 'Filter by branch ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sales export data' }),
    (0, common_1.Get)('sales'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], ExportsController.prototype, "exportSales", null);
exports.ExportsController = ExportsController = __decorate([
    (0, swagger_1.ApiTags)('exports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('exports'),
    __metadata("design:paramtypes", [exports_service_1.ExportsService])
], ExportsController);
//# sourceMappingURL=exports.controller.js.map