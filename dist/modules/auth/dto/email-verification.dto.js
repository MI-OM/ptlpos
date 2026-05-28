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
exports.ResetPasswordDto = exports.RequestPasswordResetDto = exports.VerifyEmailDto = exports.RequestEmailVerificationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RequestEmailVerificationDto {
    email;
}
exports.RequestEmailVerificationDto = RequestEmailVerificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Organization email for verification',
        example: 'contact@acme.com',
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RequestEmailVerificationDto.prototype, "email", void 0);
class VerifyEmailDto {
    token;
}
exports.VerifyEmailDto = VerifyEmailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Verification token received via email',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyEmailDto.prototype, "token", void 0);
class RequestPasswordResetDto {
    email;
    tenantId;
}
exports.RequestPasswordResetDto = RequestPasswordResetDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User email address for password reset',
        example: 'john@example.com',
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RequestPasswordResetDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tenant ID',
        example: 'clh7x1q0a0000qa10f0f0f0f0',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestPasswordResetDto.prototype, "tenantId", void 0);
class ResetPasswordDto {
    token;
    newPassword;
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Password reset token received via email',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New password (minimum 6 characters)',
        example: 'NewSecurePass123',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
//# sourceMappingURL=email-verification.dto.js.map