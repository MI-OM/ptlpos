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
exports.MetricsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../core/decorators/public.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const metrics_service_1 = require("./metrics.service");
let MetricsController = class MetricsController {
    metricsService;
    constructor(metricsService) {
        this.metricsService = metricsService;
    }
    getHealthStatus() {
        return this.metricsService.getHealthStatus();
    }
    getMetricsSummary(name, duration) {
        const durationMinutes = duration ? parseInt(duration, 10) : 5;
        if (name) {
            return {
                metric: name,
                summary: this.metricsService.getMetricSummary(name, durationMinutes),
            };
        }
        const allMetrics = this.metricsService.getMetrics();
        const metricNames = [...new Set(allMetrics.map(m => m.name))];
        const summaries = metricNames.reduce((acc, metricName) => {
            acc[metricName] = this.metricsService.getMetricSummary(metricName, durationMinutes);
            return acc;
        }, {});
        return {
            duration: durationMinutes,
            metrics: summaries,
        };
    }
    getMetrics(name) {
        return {
            metrics: this.metricsService.getMetrics(name),
            timestamp: new Date(),
        };
    }
};
exports.MetricsController = MetricsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get application health status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Health status information' }),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], MetricsController.prototype, "getHealthStatus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get metrics summary' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Metrics summary' }),
    (0, swagger_1.ApiQuery)({ name: 'name', required: false, description: 'Metric name to filter by' }),
    (0, swagger_1.ApiQuery)({ name: 'duration', required: false, description: 'Duration in minutes (default: 5)' }),
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Query)('name')),
    __param(1, (0, common_1.Query)('duration')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getMetricsSummary", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get raw metrics data (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Raw metrics data' }),
    (0, swagger_1.ApiQuery)({ name: 'name', required: false, description: 'Metric name to filter by' }),
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "getMetrics", null);
exports.MetricsController = MetricsController = __decorate([
    (0, swagger_1.ApiTags)('Metrics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('metrics'),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService])
], MetricsController);
//# sourceMappingURL=metrics.controller.js.map