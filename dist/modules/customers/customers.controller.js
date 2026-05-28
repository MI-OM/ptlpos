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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const create_customer_dto_1 = require("./dto/create-customer.dto");
const update_customer_dto_1 = require("./dto/update-customer.dto");
const customers_service_1 = require("./customers.service");
let CustomersController = class CustomersController {
    customersService;
    constructor(customersService) {
        this.customersService = customersService;
    }
    findAll(user) {
        return this.customersService.findAll(user.tenantId);
    }
    findOne(user, id) {
        return this.customersService.findOne(user.tenantId, id);
    }
    history(user, id, page, limit, from, to, minAmount) {
        return this.customersService.history(user.tenantId, id, Number(page ?? 1), Number(limit ?? 20), from, to, minAmount ? Number(minAmount) : undefined);
    }
    create(user, dto) {
        return this.customersService.create(user, dto);
    }
    update(user, id, dto) {
        return this.customersService.update(user, id, dto);
    }
    remove(user, id) {
        return this.customersService.remove(user.tenantId, id);
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List all customers' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of all customers for the current tenant',
        schema: {
            example: [
                {
                    id: 'customer-123',
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1234567890',
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
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get customer by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Customer details',
        schema: {
            example: {
                id: 'customer-123',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890',
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
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get customer purchase history' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Customer ID' }),
    (0, swagger_1.ApiQuery)({ name: 'page', description: 'Page number', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: 'Items per page', required: false, example: 20 }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Customer purchase history',
        schema: {
            example: {
                data: [
                    {
                        id: 'sale-123',
                        customerId: 'customer-123',
                        totalAmount: 99.99,
                        status: 'COMPLETED',
                        createdAt: '2024-01-01T00:00:00Z',
                    },
                ],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 100,
                    totalPages: 5,
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, common_1.Get)(':id/history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('from')),
    __param(5, (0, common_1.Query)('to')),
    __param(6, (0, common_1.Query)('minAmount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "history", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new customer' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Customer created successfully',
        schema: {
            example: {
                id: 'customer-123',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890',
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
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_customer_dto_1.CreateCustomerDto]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update customer information' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Customer updated successfully',
        schema: {
            example: {
                id: 'customer-123',
                name: 'John Updated',
                email: 'john.updated@example.com',
                phone: '+1234567890',
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
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_customer_dto_1.UpdateCustomerDto]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete a customer' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Customer deleted successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "remove", null);
exports.CustomersController = CustomersController = __decorate([
    (0, swagger_1.ApiTags)('customers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map