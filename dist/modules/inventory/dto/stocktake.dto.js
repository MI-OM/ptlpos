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
exports.UpdateStocktakeStatusDto = exports.RecordStocktakeCountsDto = exports.StocktakeLineItemDto = exports.CreateStocktakeDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateStocktakeDto {
    name;
    notes;
}
exports.CreateStocktakeDto = CreateStocktakeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStocktakeDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStocktakeDto.prototype, "notes", void 0);
class StocktakeLineItemDto {
    productId;
    productVariantId;
    physicalCount;
    notes;
}
exports.StocktakeLineItemDto = StocktakeLineItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StocktakeLineItemDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StocktakeLineItemDto.prototype, "productVariantId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StocktakeLineItemDto.prototype, "physicalCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StocktakeLineItemDto.prototype, "notes", void 0);
class RecordStocktakeCountsDto {
    items;
}
exports.RecordStocktakeCountsDto = RecordStocktakeCountsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StocktakeLineItemDto),
    __metadata("design:type", Array)
], RecordStocktakeCountsDto.prototype, "items", void 0);
class UpdateStocktakeStatusDto {
    status;
}
exports.UpdateStocktakeStatusDto = UpdateStocktakeStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStocktakeStatusDto.prototype, "status", void 0);
//# sourceMappingURL=stocktake.dto.js.map