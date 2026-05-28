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
exports.SalesPerformanceQueryDto = exports.EndOfShiftReportQueryDto = exports.EndOfDayReportQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class EndOfDayReportQueryDto {
    date;
    branchId;
}
exports.EndOfDayReportQueryDto = EndOfDayReportQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date for the report (YYYY-MM-DD)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], EndOfDayReportQueryDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Branch ID to filter', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EndOfDayReportQueryDto.prototype, "branchId", void 0);
class EndOfShiftReportQueryDto {
    shiftId;
}
exports.EndOfShiftReportQueryDto = EndOfShiftReportQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Shift ID for the report' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EndOfShiftReportQueryDto.prototype, "shiftId", void 0);
class SalesPerformanceQueryDto {
    userId;
    from;
    to;
    branchId;
}
exports.SalesPerformanceQueryDto = SalesPerformanceQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID to filter', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SalesPerformanceQueryDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start date (YYYY-MM-DD)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SalesPerformanceQueryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End date (YYYY-MM-DD)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SalesPerformanceQueryDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Branch ID to filter', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SalesPerformanceQueryDto.prototype, "branchId", void 0);
//# sourceMappingURL=report-query.dto.js.map