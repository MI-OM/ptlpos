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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSubscriptionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var BillingCycle;
(function (BillingCycle) {
    BillingCycle["MONTHLY"] = "MONTHLY";
    BillingCycle["YEARLY"] = "YEARLY";
})(BillingCycle || (BillingCycle = {}));
class CreateSubscriptionDto {
    name;
    description;
    price;
    billingCycle;
    limits;
    features;
    isActive;
}
exports.CreateSubscriptionDto = CreateSubscriptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Plan name',
        example: 'Pro Plan',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Plan description',
        example: 'Advanced features for growing businesses',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Monthly price',
        example: 99.99,
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSubscriptionDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Billing cycle',
        enum: BillingCycle,
        example: BillingCycle.MONTHLY,
    }),
    (0, class_validator_1.IsEnum)(BillingCycle),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "billingCycle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Plan limits as JSON',
        example: { users: 50, branches: 10, products: 5000 },
    }),
    (0, class_validator_1.IsJSON)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "limits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Plan features as JSON array',
        example: ['inventory', 'reports', 'api_access', 'multi_branch'],
    }),
    (0, class_validator_1.IsJSON)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "features", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the plan is active',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateSubscriptionDto.prototype, "isActive", void 0);
//# sourceMappingURL=create-subscription.dto.js.map