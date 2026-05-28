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
exports.ReceiptSettingsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ReceiptSettingsDto {
    showBusinessName;
    showPhone;
    showAddress;
    showEmail;
    showReceiptNumber;
    showCustomerName;
    showCustomerPhone;
    showUnitPrice;
    customHeader;
    customFooter;
    showPoweredBy;
}
exports.ReceiptSettingsDto = ReceiptSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Show business name on receipt',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReceiptSettingsDto.prototype, "showBusinessName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Show business phone on receipt',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReceiptSettingsDto.prototype, "showPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Show business address on receipt',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReceiptSettingsDto.prototype, "showAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Show business email on receipt',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReceiptSettingsDto.prototype, "showEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Show receipt number',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReceiptSettingsDto.prototype, "showReceiptNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Show customer name on receipt',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReceiptSettingsDto.prototype, "showCustomerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Show customer phone on receipt',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReceiptSettingsDto.prototype, "showCustomerPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Show unit price on receipt line items',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReceiptSettingsDto.prototype, "showUnitPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Custom header text',
        example: 'Thank you for shopping with us!',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReceiptSettingsDto.prototype, "customHeader", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Custom footer text',
        example: 'Please come again!',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReceiptSettingsDto.prototype, "customFooter", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Show "Powered by PTLPOS" message',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReceiptSettingsDto.prototype, "showPoweredBy", void 0);
//# sourceMappingURL=receipt-settings.dto.js.map