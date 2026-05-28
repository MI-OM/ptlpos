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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const adjust_inventory_dto_1 = require("./dto/adjust-inventory.dto");
const stocktake_dto_1 = require("./dto/stocktake.dto");
const transfer_inventory_dto_1 = require("./dto/transfer-inventory.dto");
const inventory_service_1 = require("./inventory.service");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    findAll(user) {
        return this.inventoryService.findAll(user.tenantId, user.branchId);
    }
    lowStock(user, threshold) {
        return this.inventoryService.lowStock(user.tenantId, Number(threshold ?? 10), user.branchId);
    }
    getAlerts(user, resolved) {
        const isResolved = resolved === 'true';
        return this.inventoryService.getAlerts(user.tenantId, isResolved);
    }
    checkAlerts(user, threshold) {
        return this.inventoryService.checkAndCreateAlerts(user.tenantId, Number(threshold ?? 10));
    }
    resolveAlert(user, alertId) {
        return this.inventoryService.resolveAlert(user.tenantId, alertId);
    }
    history(user, productId) {
        return this.inventoryService.history(user.tenantId, productId, user.branchId);
    }
    valuation(user) {
        return this.inventoryService.valuation(user.tenantId, user.branchId);
    }
    adjust(user, dto) {
        return this.inventoryService.adjust(user, dto);
    }
    transfer(user, dto) {
        return this.inventoryService.transfer(user, dto);
    }
    createStocktake(user, dto) {
        return this.inventoryService.createStocktake(user, dto);
    }
    listStocktakes(user, status) {
        return this.inventoryService.listStocktakes(user.tenantId, status);
    }
    getStocktake(user, id) {
        return this.inventoryService.getStocktake(user.tenantId, id);
    }
    startStocktake(user, id) {
        return this.inventoryService.startStocktake(user, id);
    }
    cancelStocktake(user, id) {
        return this.inventoryService.cancelStocktake(user, id);
    }
    recordCounts(user, id, dto) {
        return this.inventoryService.recordStocktakeCounts(user, id, dto);
    }
    completeStocktake(user, id) {
        return this.inventoryService.completeStocktake(user, id);
    }
    applyAdjustments(user, id) {
        return this.inventoryService.applyStocktakeAdjustments(user, id);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get all inventory items' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory items retrieved successfully' }),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get products with low stock' }),
    (0, swagger_1.ApiQuery)({ name: 'threshold', required: false, type: Number, example: 10, description: 'Minimum stock threshold (default: 10)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Low stock products retrieved successfully' }),
    (0, common_1.Get)('low-stock'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('threshold')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "lowStock", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory alerts' }),
    (0, swagger_1.ApiQuery)({ name: 'resolved', required: false, type: Boolean, example: false, description: 'Filter by resolved status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory alerts retrieved successfully' }),
    (0, common_1.Get)('alerts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('resolved')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getAlerts", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Check and create inventory alerts' }),
    (0, swagger_1.ApiQuery)({ name: 'threshold', required: false, type: Number, example: 10, description: 'Minimum stock threshold (default: 10)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alerts checked and created successfully' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)('alerts/check'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('threshold')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "checkAlerts", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Resolve an inventory alert' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Alert ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alert resolved successfully' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)('alerts/:id/resolve'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "resolveAlert", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory movement history' }),
    (0, swagger_1.ApiQuery)({ name: 'productId', required: false, type: String, example: 'prod-123', description: 'Filter by product ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory history retrieved successfully' }),
    (0, common_1.Get)('history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "history", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory valuation' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory valuation retrieved successfully' }),
    (0, common_1.Get)('valuation'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "valuation", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Adjust inventory quantity' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory adjusted successfully' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)('adjust'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, adjust_inventory_dto_1.AdjustInventoryDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "adjust", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Transfer inventory between branches' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory transferred successfully' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)('transfers'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transfer_inventory_dto_1.TransferInventoryDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "transfer", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new stocktake' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Stocktake created successfully' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)('stocktakes'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, stocktake_dto_1.CreateStocktakeDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createStocktake", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List all stocktakes' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String, example: 'IN_PROGRESS', description: 'Filter by status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stocktakes retrieved successfully' }),
    (0, common_1.Get)('stocktakes'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "listStocktakes", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get stocktake details' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Stocktake ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stocktake retrieved successfully' }),
    (0, common_1.Get)('stocktakes/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getStocktake", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Start a stocktake' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Stocktake ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stocktake started successfully' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)('stocktakes/:id/start'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "startStocktake", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a stocktake' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Stocktake ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stocktake cancelled successfully' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)('stocktakes/:id/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "cancelStocktake", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Record stocktake counts' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Stocktake ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stocktake counts recorded successfully' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)('stocktakes/:id/record-counts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, stocktake_dto_1.RecordStocktakeCountsDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "recordCounts", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Complete a stocktake' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Stocktake ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stocktake completed successfully' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)('stocktakes/:id/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "completeStocktake", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Apply stocktake adjustments to inventory' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Stocktake ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Adjustments applied successfully' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN),
    (0, common_1.Post)('stocktakes/:id/apply'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "applyAdjustments", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map