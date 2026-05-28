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
exports.ProductionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../core/decorators/current-user.decorator");
const roles_decorator_1 = require("../../core/decorators/roles.decorator");
const run_production_dto_1 = require("./dto/run-production.dto");
const production_service_1 = require("./production.service");
let ProductionController = class ProductionController {
    productionService;
    constructor(productionService) {
        this.productionService = productionService;
    }
    run(user, dto) {
        return this.productionService.run(user, dto);
    }
    getOrders(user) {
        return this.productionService.getOrders(user);
    }
    getRecipes(user) {
        return this.productionService.getRecipes(user);
    }
    getMaterials(user) {
        return this.productionService.getMaterials(user);
    }
    getMachines(user) {
        return this.productionService.getMachines(user);
    }
};
exports.ProductionController = ProductionController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleName.ADMIN, client_1.RoleName.MANAGER),
    (0, common_1.Post)('run'),
    (0, swagger_1.ApiOperation)({ summary: 'Run a production batch' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Production batch created successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, run_production_dto_1.RunProductionDto]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "run", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, swagger_1.ApiOperation)({ summary: 'Get production orders' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Production orders retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('recipes'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all production recipes with cost and margin calculations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Production recipes retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "getRecipes", null);
__decorate([
    (0, common_1.Get)('materials'),
    (0, swagger_1.ApiOperation)({ summary: 'Get production materials' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Production materials retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "getMaterials", null);
__decorate([
    (0, common_1.Get)('machines'),
    (0, swagger_1.ApiOperation)({ summary: 'Get production machines' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Production machines retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductionController.prototype, "getMachines", null);
exports.ProductionController = ProductionController = __decorate([
    (0, swagger_1.ApiTags)('production'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('production'),
    __metadata("design:paramtypes", [production_service_1.ProductionService])
], ProductionController);
//# sourceMappingURL=production.controller.js.map