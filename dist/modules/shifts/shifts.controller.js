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
exports.ShiftsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const create_shift_dto_1 = require("./dto/create-shift.dto");
const reconcile_shift_dto_1 = require("./dto/reconcile-shift.dto");
const report_query_dto_1 = require("./dto/report-query.dto");
const shifts_service_1 = require("./shifts.service");
let ShiftsController = class ShiftsController {
    shiftsService;
    constructor(shiftsService) {
        this.shiftsService = shiftsService;
    }
    openShift(user, dto) {
        return this.shiftsService.openShift(user, dto);
    }
    closeShift(user, id, dto) {
        return this.shiftsService.closeShift(user, id, dto);
    }
    getActiveShift(user) {
        return this.shiftsService.getActiveShift(user);
    }
    findAll(user, query) {
        return this.shiftsService.findAll(user, query);
    }
    findOne(user, id) {
        return this.shiftsService.findOne(user, id);
    }
    getCashDrawerSummary(user) {
        return this.shiftsService.getCashDrawerSummary(user);
    }
    reconcileShift(user, id, dto) {
        return this.shiftsService.reconcileShift(user, id, dto);
    }
    getEndOfDayReport(user, query) {
        return this.shiftsService.getEndOfDayReport(user, query.date, query.branchId);
    }
    getEndOfShiftReport(user, query) {
        return this.shiftsService.getEndOfShiftReport(user, query.shiftId);
    }
    getSalesPerformance(user, query) {
        return this.shiftsService.getSalesPerformance(user, query.userId, query.from, query.to, query.branchId);
    }
};
exports.ShiftsController = ShiftsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Open a new shift' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Shift opened successfully',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER, client_1.RoleName.SALES_REP),
    (0, common_1.Post)('open'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_shift_dto_1.OpenShiftDto]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "openShift", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Close an open shift' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Shift ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Shift closed successfully',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(':id/close'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_shift_dto_1.CloseShiftDto]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "closeShift", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get active shift for current user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Active shift details',
    }),
    (0, common_1.Get)('active'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "getActiveShift", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List all shifts' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of shifts with pagination',
    }),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_shift_dto_1.QueryShiftsDto]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get shift by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Shift ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Shift details',
    }),
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get cash drawer summary for active shift' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Cash drawer summary',
    }),
    (0, common_1.Get)('cash-drawer/summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "getCashDrawerSummary", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Reconcile shift drawer' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Shift ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Shift reconciled successfully',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)(':id/reconcile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reconcile_shift_dto_1.ReconcileShiftDto]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "reconcileShift", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get end of day report' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', required: false }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'End of day report',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Get)('reports/end-of-day'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, report_query_dto_1.EndOfDayReportQueryDto]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "getEndOfDayReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get end of shift report' }),
    (0, swagger_1.ApiQuery)({ name: 'shiftId', required: true }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'End of shift report',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Get)('reports/end-of-shift'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, report_query_dto_1.EndOfShiftReportQueryDto]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "getEndOfShiftReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get sales performance report' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', required: false }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sales performance report',
    }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Get)('reports/sales-performance'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, report_query_dto_1.SalesPerformanceQueryDto]),
    __metadata("design:returntype", void 0)
], ShiftsController.prototype, "getSalesPerformance", null);
exports.ShiftsController = ShiftsController = __decorate([
    (0, swagger_1.ApiTags)('shifts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('shifts'),
    __metadata("design:paramtypes", [shifts_service_1.ShiftsService])
], ShiftsController);
//# sourceMappingURL=shifts.controller.js.map