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
exports.QuerySalesDto = exports.UpdateSaleItemDto = exports.RemoveSaleItemDto = exports.AddSaleItemDto = exports.RefundSaleDto = exports.RefundSaleItemDto = exports.CompleteSaleDto = exports.CreateSaleDto = exports.SalePaymentDto = exports.CreateSaleItemDto = void 0;
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateSaleItemDto {
    productId;
    productVariantId;
    quantity;
    price;
    discountAmount;
    taxRate;
}
exports.CreateSaleItemDto = CreateSaleItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Product ID',
        example: 'prod-123',
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSaleItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Product variant ID (if product has variants)',
        example: 'variant-456',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSaleItemDto.prototype, "productVariantId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantity of items',
        example: 2,
        required: true,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateSaleItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Unit price (overrides default product price)',
        example: 49.99,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateSaleItemDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Discount amount per item',
        example: 5.00,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSaleItemDto.prototype, "discountAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Tax rate for this item (as decimal, e.g., 0.08 for 8%)',
        example: 0.08,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSaleItemDto.prototype, "taxRate", void 0);
class SalePaymentDto {
    method;
    amount;
    reference;
}
exports.SalePaymentDto = SalePaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Payment method',
        enum: client_1.PaymentMethod,
        example: 'CASH',
        required: true,
    }),
    (0, class_validator_1.IsEnum)(client_1.PaymentMethod),
    __metadata("design:type", String)
], SalePaymentDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Payment amount',
        example: 99.99,
        required: true,
        minimum: 0.01,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], SalePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Payment reference number (for checks, cards, etc.)',
        example: 'CHK-12345',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SalePaymentDto.prototype, "reference", void 0);
class CreateSaleDto {
    customerId;
    discountAmount;
    note;
    taxRate;
    items;
    payments;
}
exports.CreateSaleDto = CreateSaleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Customer ID (optional for anonymous sales)',
        example: 'customer-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Discount amount for the entire sale',
        example: 10.00,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSaleDto.prototype, "discountAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sale notes or comments',
        example: 'Customer requested gift wrapping',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Tax rate for the entire sale (as decimal, e.g., 0.08 for 8%)',
        example: 0.08,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSaleDto.prototype, "taxRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'List of items in the sale',
        type: [CreateSaleItemDto],
        required: true,
        minItems: 1,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateSaleItemDto),
    __metadata("design:type", Array)
], CreateSaleDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Payment information (optional for creating draft sales)',
        type: [SalePaymentDto],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SalePaymentDto),
    __metadata("design:type", Array)
], CreateSaleDto.prototype, "payments", void 0);
class CompleteSaleDto {
    payments;
}
exports.CompleteSaleDto = CompleteSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Payment information to complete the sale',
        type: [SalePaymentDto],
        required: true,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SalePaymentDto),
    __metadata("design:type", Array)
], CompleteSaleDto.prototype, "payments", void 0);
class RefundSaleItemDto {
    saleItemId;
    quantity;
}
exports.RefundSaleItemDto = RefundSaleItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sale item ID to refund',
        example: 'sale-item-123',
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefundSaleItemDto.prototype, "saleItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantity to refund',
        example: 1,
        required: true,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], RefundSaleItemDto.prototype, "quantity", void 0);
class RefundSaleDto {
    reason;
    items;
}
exports.RefundSaleDto = RefundSaleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Reason for refund',
        example: 'Customer requested refund - product defective',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefundSaleDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Items to refund (if not specified, full sale is refunded)',
        type: [RefundSaleItemDto],
        minItems: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RefundSaleItemDto),
    __metadata("design:type", Array)
], RefundSaleDto.prototype, "items", void 0);
class AddSaleItemDto extends CreateSaleItemDto {
}
exports.AddSaleItemDto = AddSaleItemDto;
class RemoveSaleItemDto {
    saleItemId;
}
exports.RemoveSaleItemDto = RemoveSaleItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sale item ID to remove',
        example: 'sale-item-123',
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RemoveSaleItemDto.prototype, "saleItemId", void 0);
class UpdateSaleItemDto {
    quantity;
    price;
    discountAmount;
}
exports.UpdateSaleItemDto = UpdateSaleItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New quantity for the item',
        example: 3,
        required: true,
        minimum: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateSaleItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'New unit price (overrides default)',
        example: 49.99,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateSaleItemDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'New discount amount per item',
        example: 5.00,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateSaleItemDto.prototype, "discountAmount", void 0);
class QuerySalesDto {
    page = 1;
    limit = 15;
    status;
}
exports.QuerySalesDto = QuerySalesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Page number for pagination',
        example: 1,
        default: 1,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QuerySalesDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Number of items per page',
        example: 15,
        default: 15,
        minimum: 1,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QuerySalesDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by sale status',
        enum: client_1.SaleStatus,
        example: client_1.SaleStatus.COMPLETED,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SaleStatus),
    __metadata("design:type", String)
], QuerySalesDto.prototype, "status", void 0);
//# sourceMappingURL=create-sale.dto.js.map