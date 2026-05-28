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
exports.UploadProductImageResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UploadProductImageResponseDto {
    success;
    imageUrl;
    metadata;
}
exports.UploadProductImageResponseDto = UploadProductImageResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Upload success status',
        example: true,
    }),
    __metadata("design:type", Boolean)
], UploadProductImageResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Image URL after upload',
        example: 'https://cdn.example.com/products/laptop-pro.jpg',
    }),
    __metadata("design:type", String)
], UploadProductImageResponseDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Image metadata',
        example: {
            filename: 'laptop-pro.jpg',
            size: 1024000,
            format: 'jpeg',
            cdnUrl: 'https://cdn.example.com/products/laptop-pro.jpg',
        },
    }),
    __metadata("design:type", Object)
], UploadProductImageResponseDto.prototype, "metadata", void 0);
//# sourceMappingURL=upload-product-image-response.dto.js.map