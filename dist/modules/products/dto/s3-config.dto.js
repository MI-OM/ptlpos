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
exports.S3ConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class S3ConfigDto {
    bucket;
    region;
    cdnBaseUrl;
}
exports.S3ConfigDto = S3ConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'S3 bucket configuration',
        example: {
            bucket: 'my-app-products',
            region: 'us-east-1',
            accessKeyId: 'AKIA...',
            secretAccessKey: '...',
        },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], S3ConfigDto.prototype, "bucket", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'S3 region',
        example: 'us-east-1',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], S3ConfigDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CDN base URL for image delivery',
        example: 'https://cdn.example.com',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], S3ConfigDto.prototype, "cdnBaseUrl", void 0);
//# sourceMappingURL=s3-config.dto.js.map