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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const create_sale_dto_1 = require("./dto/create-sale.dto");
const sales_service_1 = require("./sales.service");
const receipt_settings_dto_1 = require("./dto/receipt-settings.dto");
const return_exchange_dto_1 = require("./dto/return-exchange.dto");
const client_1 = require("@prisma/client");
let SalesController = class SalesController {
    salesService;
    constructor(salesService) {
        this.salesService = salesService;
    }
    create(user, dto) {
        return this.salesService.create(user, dto);
    }
    findAll(user, query) {
        return this.salesService.findAll(user.tenantId, user.branchId, query);
    }
    getReceiptSettings(user) {
        return this.salesService.getReceiptSettings(user);
    }
    updateReceiptSettings(user, dto) {
        return this.salesService.updateReceiptSettings(user, dto);
    }
    findOne(user, id) {
        return this.salesService.findOne(user.tenantId, id, user.branchId);
    }
    addItem(user, id, dto) {
        return this.salesService.addItem(user, id, dto);
    }
    removeItem(user, id, saleItemId) {
        return this.salesService.removeItem(user, id, saleItemId);
    }
    updateItem(user, id, itemId, dto) {
        return this.salesService.updateItem(user, id, itemId, dto);
    }
    addPayment(user, id, dto) {
        return this.salesService.addPayment(user, id, dto);
    }
    hold(user, id) {
        return this.salesService.hold(user, id);
    }
    resume(user, id) {
        return this.salesService.resume(user, id);
    }
    complete(user, id, dto) {
        return this.salesService.complete(user, id, dto);
    }
    cancel(user, id) {
        return this.salesService.cancel(user, id);
    }
    refund(user, id, dto) {
        return this.salesService.refund(user, id, dto);
    }
    returnExchange(user, id, dto) {
        return this.salesService.returnExchange(user, id, dto);
    }
    receipt(user, id) {
        return this.salesService.receipt(user, id);
    }
    printableReceipt(user, id) {
        return this.salesService.printableReceipt(user, id);
    }
    receiptPrintJob(user, id) {
        return this.salesService.receiptPrintJob(user, id);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new sale' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Sale created successfully',
        schema: {
            example: {
                id: 'sale-123',
                status: 'OPEN',
                totalAmount: 99.99,
                subtotal: 89.99,
                tax: 10.00,
                discount: 0.00,
                items: [],
                tenantId: 'tenant-123',
                branchId: 'branch-123',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            },
        },
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_sale_dto_1.CreateSaleDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List sales with pagination and filtering' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 15 }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['OPEN', 'HELD', 'COMPLETED', 'CANCELLED', 'REFUNDED'], example: 'COMPLETED' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of sales with pagination metadata',
        schema: {
            example: {
                data: [
                    {
                        id: 'sale-123',
                        status: 'COMPLETED',
                        totalAmount: 99.99,
                        subtotal: 89.99,
                        tax: 10.00,
                        discount: 0.00,
                        saleNumber: 'SAL-20240101-0001',
                        createdAt: '2024-01-01T00:00:00Z',
                        items: [],
                        customer: null,
                    },
                ],
                meta: {
                    page: 1,
                    limit: 15,
                    total: 100,
                    totalPages: 7,
                },
            },
        },
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_sale_dto_1.QuerySalesDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get receipt settings for tenant' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Receipt settings retrieved successfully',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Get)('settings/receipt'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "getReceiptSettings", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update receipt settings for tenant' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Receipt settings updated successfully',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Patch)('settings/receipt'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, receipt_settings_dto_1.ReceiptSettingsDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "updateReceiptSettings", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get sale by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sale details',
        schema: {
            example: {
                id: 'sale-123',
                status: 'COMPLETED',
                totalAmount: 99.99,
                subtotal: 89.99,
                tax: 10.00,
                discount: 0.00,
                items: [
                    {
                        id: 'item-123',
                        productId: 'product-123',
                        quantity: 2,
                        unitPrice: 44.99,
                        totalPrice: 89.98,
                        product: { name: 'Bread Loaf', sku: 'BREAD-001' },
                    },
                ],
                tenantId: 'tenant-123',
                branchId: 'branch-123',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Add item to sale' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Item added to sale',
        schema: {
            example: {
                id: 'item-123',
                productId: 'product-123',
                quantity: 2,
                unitPrice: 44.99,
                totalPrice: 89.98,
                saleId: 'sale-123',
                product: { name: 'Bread Loaf', sku: 'BREAD-001' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Post)(':id/items'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_sale_dto_1.AddSaleItemDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "addItem", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Remove item from sale' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiParam)({ name: 'saleItemId', description: 'Sale Item ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Item removed from sale' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale or item not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Delete)(':id/items/:saleItemId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('saleItemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "removeItem", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update sale item quantity or price' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiParam)({ name: 'itemId', description: 'Sale Item ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Item updated successfully',
        schema: {
            example: {
                id: 'item-123',
                productId: 'product-123',
                quantity: 3,
                unitPrice: 49.99,
                totalPrice: 149.97,
                product: { name: 'Bread Loaf', sku: 'BREAD-001' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale or item not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Patch)(':id/items/:itemId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('itemId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, create_sale_dto_1.UpdateSaleItemDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "updateItem", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Add payment to sale' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Payment added successfully',
        schema: {
            example: {
                id: 'payment-123',
                saleId: 'sale-123',
                method: 'CASH',
                amount: 50.00,
                reference: 'CASH-001',
                createdAt: '2024-01-01T00:00:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Post)(':id/payments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_sale_dto_1.SalePaymentDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "addPayment", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Hold a sale' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sale held successfully',
        schema: {
            example: {
                id: 'sale-123',
                status: 'HELD',
                totalAmount: 99.99,
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Post)(':id/hold'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "hold", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Resume a held sale' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sale resumed successfully',
        schema: {
            example: {
                id: 'sale-123',
                status: 'OPEN',
                totalAmount: 99.99,
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Post)(':id/resume'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "resume", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Complete a sale' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sale completed successfully',
        schema: {
            example: {
                id: 'sale-123',
                status: 'COMPLETED',
                totalAmount: 99.99,
                paymentMethod: 'CASH',
                completedAt: '2024-01-01T00:00:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_sale_dto_1.CompleteSaleDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "complete", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a sale' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sale cancelled successfully',
        schema: {
            example: {
                id: 'sale-123',
                status: 'CANCELLED',
                cancelledAt: '2024-01-01T00:00:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(':id/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "cancel", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Refund a sale' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sale refunded successfully',
        schema: {
            example: {
                id: 'sale-123',
                status: 'REFUNDED',
                refundAmount: 99.99,
                refundReason: 'Customer request',
                refundedAt: '2024-01-01T00:00:00Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(':id/refund'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_sale_dto_1.RefundSaleDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "refund", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Return or exchange sale items' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Return/exchange processed successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Post)(':id/return-exchange'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, return_exchange_dto_1.ReturnExchangeDto]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "returnExchange", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get sale receipt' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sale receipt data',
        schema: {
            example: {
                sale: {
                    id: 'sale-123',
                    totalAmount: 99.99,
                    status: 'COMPLETED',
                    completedAt: '2024-01-01T00:00:00Z',
                },
                items: [
                    {
                        name: 'Bread Loaf',
                        quantity: 2,
                        unitPrice: 44.99,
                        totalPrice: 89.98,
                    },
                ],
                tenant: { name: 'OM Mart' },
                branch: { name: 'Main Store' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, common_1.Get)(':id/receipt'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "receipt", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get printable receipt HTML' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'HTML receipt for printing',
        content: { 'text/html': {} },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, common_1.Get)(':id/receipt/print'),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "printableReceipt", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get receipt print job data' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Sale ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Print job formatted receipt',
        content: { 'text/html': {} },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Sale not found' }),
    (0, common_1.Get)(':id/receipt/print-job'),
    (0, common_1.Header)('Content-Type', 'text/html; charset=utf-8'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "receiptPrintJob", null);
exports.SalesController = SalesController = __decorate([
    (0, swagger_1.ApiTags)('sales'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map