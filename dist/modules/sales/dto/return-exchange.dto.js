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
exports.ReturnExchangeDto = exports.ExchangeItemDto = exports.ReturnItemDto = exports.ReturnExchangeType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var ReturnExchangeType;
(function (ReturnExchangeType) {
    ReturnExchangeType["RETURN"] = "RETURN";
    ReturnExchangeType["EXCHANGE"] = "EXCHANGE";
    ReturnExchangeType["RETURN_AND_EXCHANGE"] = "RETURN_AND_EXCHANGE";
})(ReturnExchangeType || (exports.ReturnExchangeType = ReturnExchangeType = {}));
class ReturnItemDto {
    saleItemId;
    quantity;
}
exports.ReturnItemDto = ReturnItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sale item ID to return',
        example: 'sale-item-123',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReturnItemDto.prototype, "saleItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantity to return',
        example: 1,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], ReturnItemDto.prototype, "quantity", void 0);
class ExchangeItemDto {
    productId;
    productVariantId;
    quantity;
}
exports.ExchangeItemDto = ExchangeItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Product ID to exchange for',
        example: 'product-456',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExchangeItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Product variant ID (if variant product)',
        example: 'variant-789',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExchangeItemDto.prototype, "productVariantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantity to exchange for',
        example: 1,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], ExchangeItemDto.prototype, "quantity", void 0);
class ReturnExchangeDto {
    type;
    returnItems;
    exchangeItems;
    reason;
    notes;
}
exports.ReturnExchangeDto = ReturnExchangeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type of return/exchange',
        enum: ReturnExchangeType,
        example: ReturnExchangeType.EXCHANGE,
    }),
    (0, class_validator_1.IsEnum)(ReturnExchangeType),
    __metadata("design:type", String)
], ReturnExchangeDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Items to return',
        type: [ReturnItemDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ReturnItemDto),
    __metadata("design:type", Array)
], ReturnExchangeDto.prototype, "returnItems", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Items to exchange for (required for EXCHANGE and RETURN_AND_EXCHANGE)',
        type: [ExchangeItemDto],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExchangeItemDto),
    __metadata("design:type", Array)
], ReturnExchangeDto.prototype, "exchangeItems", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Reason for return/exchange',
        example: 'Wrong size',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReturnExchangeDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Additional notes',
        example: 'Customer wants a larger size',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReturnExchangeDto.prototype, "notes", void 0);
//# sourceMappingURL=return-exchange.dto.js.map