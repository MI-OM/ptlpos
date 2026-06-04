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
exports.QueryShiftsDto = exports.CloseShiftDto = exports.OpenShiftDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class OpenShiftDto {
    openingBalance;
    drawerType;
    branchId;
    notes;
}
exports.OpenShiftDto = OpenShiftDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Opening cash balance in drawer',
        example: 100.00,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], OpenShiftDto.prototype, "openingBalance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Type of drawer being used',
        enum: client_1.DrawerType,
        example: client_1.DrawerType.OFFLINE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.DrawerType),
    __metadata("design:type", String)
], OpenShiftDto.prototype, "drawerType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Branch ID for this shift',
        example: 'branch-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OpenShiftDto.prototype, "branchId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notes about opening the shift',
        example: 'Starting morning shift',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OpenShiftDto.prototype, "notes", void 0);
class CloseShiftDto {
    closingBalance;
    notes;
}
exports.CloseShiftDto = CloseShiftDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Closing cash balance in drawer',
        example: 350.00,
        minimum: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CloseShiftDto.prototype, "closingBalance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Notes about closing the shift',
        example: 'End of day - cash count matches',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CloseShiftDto.prototype, "notes", void 0);
class QueryShiftsDto {
    page = 1;
    limit = 20;
    status;
    branchId;
    fromDate;
    toDate;
}
exports.QueryShiftsDto = QueryShiftsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Page number',
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryShiftsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Limit per page',
        example: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryShiftsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by status (OPEN or CLOSED)',
        example: 'OPEN',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryShiftsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by branch ID',
        example: 'branch-123',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryShiftsDto.prototype, "branchId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter shifts from this date (ISO)',
        example: '2026-01-01',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryShiftsDto.prototype, "fromDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter shifts to this date (ISO)',
        example: '2026-12-31',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryShiftsDto.prototype, "toDate", void 0);
//# sourceMappingURL=create-shift.dto.js.map