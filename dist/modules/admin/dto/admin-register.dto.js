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
exports.AdminRegisterDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var AdminRole;
(function (AdminRole) {
    AdminRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    AdminRole["SUPPORT_ADMIN"] = "SUPPORT_ADMIN";
    AdminRole["BILLING_ADMIN"] = "BILLING_ADMIN";
})(AdminRole || (AdminRole = {}));
class AdminRegisterDto {
    email;
    password;
    firstName;
    lastName;
    role;
}
exports.AdminRegisterDto = AdminRegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Admin email address',
        example: 'admin@ptlpos.com',
        required: true,
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], AdminRegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Admin password',
        example: 'Admin123!',
        required: true,
        minLength: 8,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], AdminRegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Admin first name',
        example: 'John',
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminRegisterDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Admin last name',
        example: 'Doe',
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminRegisterDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Admin role',
        example: 'SUPER_ADMIN',
        enum: ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'BILLING_ADMIN'],
        required: true,
    }),
    (0, class_validator_1.IsEnum)(AdminRole),
    __metadata("design:type", String)
], AdminRegisterDto.prototype, "role", void 0);
//# sourceMappingURL=admin-register.dto.js.map