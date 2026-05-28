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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const admin_jwt_auth_guard_1 = require("../../core/guards/admin-jwt-auth.guard");
const admin_roles_guard_1 = require("../../core/guards/admin-roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const update_tenant_status_dto_1 = require("./dto/update-tenant-status.dto");
const create_subscription_dto_1 = require("./dto/create-subscription.dto");
const update_subscription_dto_1 = require("./dto/update-subscription.dto");
const create_support_ticket_dto_1 = require("./dto/create-support-ticket.dto");
const assign_ticket_dto_1 = require("./dto/assign-ticket.dto");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getTenants(page, limit, status, search) {
        return this.adminService.getTenants({
            page: page || 1,
            limit: limit || 20,
            status,
            search,
        });
    }
    async getTenant(id) {
        return this.adminService.getTenant(id);
    }
    async updateTenantStatus(id, updateTenantStatusDto) {
        return this.adminService.updateTenantStatus(id, updateTenantStatusDto);
    }
    async getTenantUsage(id) {
        return this.adminService.getTenantUsage(id);
    }
    async getPlans() {
        return this.adminService.getPlans();
    }
    async getPlan(id) {
        return this.adminService.getPlan(id);
    }
    async createPlan(createPlanDto) {
        return this.adminService.createPlan(createPlanDto);
    }
    async updatePlan(id, updatePlanDto) {
        return this.adminService.updatePlan(id, updatePlanDto);
    }
    async deletePlan(id) {
        return this.adminService.deletePlan(id);
    }
    async getSubscriptions(page, limit, status) {
        return this.adminService.getSubscriptions({
            page: page || 1,
            limit: limit || 20,
            status,
        });
    }
    async getSubscription(id) {
        return this.adminService.getSubscription(id);
    }
    async changeSubscription(id, changeSubscriptionDto) {
        return this.adminService.changeSubscription(id, changeSubscriptionDto);
    }
    async cancelSubscription(id) {
        return this.adminService.cancelSubscription(id);
    }
    async getTickets(page, limit, status, assignedTo) {
        return this.adminService.getTickets({
            page: page || 1,
            limit: limit || 20,
            status,
            assignedTo,
        });
    }
    async getTicket(id) {
        return this.adminService.getTicket(id);
    }
    async createTicket(createTicketDto) {
        return this.adminService.createTicket(createTicketDto);
    }
    async assignTicket(id, assignTicketDto) {
        return this.adminService.assignTicket(id, assignTicketDto);
    }
    async updateTicketStatus(id, updateStatusDto) {
        return this.adminService.updateTicketStatus(id, updateStatusDto);
    }
    async getOverview() {
        return this.adminService.getOverview();
    }
    async getUsageAnalytics(period) {
        return this.adminService.getUsageAnalytics(period || '30d');
    }
    async getRevenueAnalytics(period) {
        return this.adminService.getRevenueAnalytics(period || '30d');
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('tenants'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tenants' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenants retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTenants", null);
__decorate([
    (0, common_1.Get)('tenants/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenant details retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTenant", null);
__decorate([
    (0, common_1.Put)('tenants/:id/status'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update tenant status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tenant status updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tenant_status_dto_1.UpdateTenantStatusDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateTenantStatus", null);
__decorate([
    (0, common_1.Get)('tenants/:id/usage'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant usage metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage metrics retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTenantUsage", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'BILLING_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all subscription plans' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plans retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Get)('plans/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'BILLING_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get subscription plan by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPlan", null);
__decorate([
    (0, common_1.Post)('plans'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'BILLING_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new subscription plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Plan created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_subscription_dto_1.CreateSubscriptionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Put)('plans/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'BILLING_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update subscription plan' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_subscription_dto_1.UpdateSubscriptionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('plans/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'BILLING_ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete subscription plan' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plan deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'BILLING_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all subscriptions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscriptions retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSubscriptions", null);
__decorate([
    (0, common_1.Get)('subscriptions/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'BILLING_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get subscription details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription details retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Subscription not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSubscription", null);
__decorate([
    (0, common_1.Put)('subscriptions/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'BILLING_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Change tenant subscription' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_subscription_dto_1.UpdateSubscriptionDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changeSubscription", null);
__decorate([
    (0, common_1.Post)('subscriptions/:id/cancel'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'BILLING_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel tenant subscription' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription cancelled' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "cancelSubscription", null);
__decorate([
    (0, common_1.Get)('tickets'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'SUPPORT_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get support tickets' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tickets retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('assignedTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTickets", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'SUPPORT_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get ticket details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ticket details retrieved' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTicket", null);
__decorate([
    (0, common_1.Post)('tickets'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'SUPPORT_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create support ticket' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Ticket created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_support_ticket_dto_1.CreateSupportTicketDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Put)('tickets/:id/assign'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'SUPPORT_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign ticket to admin' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ticket assigned' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_ticket_dto_1.AssignTicketDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignTicket", null);
__decorate([
    (0, common_1.Put)('tickets/:id/status'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'SUPPORT_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update ticket status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ticket status updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateTicketStatus", null);
__decorate([
    (0, common_1.Get)('analytics/overview'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system overview analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('analytics/usage'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get usage analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage analytics retrieved' }),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsageAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/revenue'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'BILLING_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get revenue analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Revenue analytics retrieved' }),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRevenueAnalytics", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(admin_jwt_auth_guard_1.AdminJwtAuthGuard, admin_roles_guard_1.AdminRolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map