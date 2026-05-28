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
exports.CreditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const credit_service_1 = require("./credit.service");
const client_1 = require("@prisma/client");
let CreditController = class CreditController {
    creditService;
    constructor(creditService) {
        this.creditService = creditService;
    }
    addCredit(user, id, body) {
        return this.creditService.addCredit(user, id, body.amount, body.note);
    }
    deductCredit(user, id, body) {
        return this.creditService.deductCredit(user, id, body.amount, body.referenceType, body.referenceId, body.note);
    }
    adjustCredit(user, id, body) {
        return this.creditService.adjustCredit(user, id, body.amount, body.note);
    }
    getCreditBalance(user, id) {
        return this.creditService.getCreditBalance(user, id);
    }
    getCreditTransactions(user, id) {
        return this.creditService.getCreditTransactions(user, id);
    }
};
exports.CreditController = CreditController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Add credit to customer account' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Credit added successfully',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(':id/credit/add'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "addCredit", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Deduct credit from customer account' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Credit deducted successfully',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(':id/credit/deduct'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "deductCredit", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Adjust customer credit balance' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Credit adjusted successfully',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN),
    (0, common_1.Post)(':id/credit/adjust'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "adjustCredit", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get customer credit balance' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Credit balance retrieved',
    }),
    (0, common_1.Get)(':id/credit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "getCreditBalance", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get customer credit transaction history' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Credit transactions retrieved',
    }),
    (0, common_1.Get)(':id/credit/transactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "getCreditTransactions", null);
exports.CreditController = CreditController = __decorate([
    (0, swagger_1.ApiTags)('customers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [credit_service_1.CreditService])
], CreditController);
//# sourceMappingURL=credit.controller.js.map