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
exports.CloudStorageConfigDto = exports.CloudStorageProvider = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var CloudStorageProvider;
(function (CloudStorageProvider) {
    CloudStorageProvider["AWS_S3"] = "AWS_S3";
    CloudStorageProvider["GOOGLE_CLOUD"] = "GOOGLE_CLOUD";
    CloudStorageProvider["AZURE_BLOB"] = "AZURE_BLOB";
    CloudStorageProvider["DIGITAL_OCEAN"] = "DIGITAL_OCEAN";
})(CloudStorageProvider || (exports.CloudStorageProvider = CloudStorageProvider = {}));
class CloudStorageConfigDto {
    provider;
    config;
    cdnBaseUrl;
}
exports.CloudStorageConfigDto = CloudStorageConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cloud storage provider',
        enum: CloudStorageProvider,
        example: CloudStorageProvider.AWS_S3,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CloudStorageProvider),
    __metadata("design:type", String)
], CloudStorageConfigDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Storage configuration',
        example: {
            bucket: 'my-app-products',
            region: 'us-east-1',
            accessKeyId: 'AKIA...',
            secretAccessKey: '...',
            projectId: 'my-project-id',
            connectionString: 'DefaultEndpointsProtocol=https://account.blob.core.windows.net;AccountName=myaccount;AccountKey=...',
        },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CloudStorageConfigDto.prototype, "config", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CDN base URL for image delivery',
        example: 'https://cdn.example.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CloudStorageConfigDto.prototype, "cdnBaseUrl", void 0);
//# sourceMappingURL=cloud-storage-config.dto.js.map