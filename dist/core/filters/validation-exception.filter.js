"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ValidationExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
let ValidationExceptionFilter = ValidationExceptionFilter_1 = class ValidationExceptionFilter {
    logger = new common_1.Logger(ValidationExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const errors = this.formatValidationErrors(exception);
        this.logger.warn(`Validation failed for ${request.method} ${request.url}`, {
            errors,
            body: request.body,
        });
        response.status(common_1.HttpStatus.BAD_REQUEST).json({
            statusCode: common_1.HttpStatus.BAD_REQUEST,
            timestamp: new Date().toISOString(),
            path: request.url,
            error: 'Validation Error',
            message: 'Request validation failed',
            details: errors,
        });
    }
    formatValidationErrors(validationErrors) {
        return validationErrors.map((error) => {
            const constraints = error.constraints;
            const property = error.property;
            return {
                property,
                message: constraints ? Object.values(constraints)[0] : 'Invalid value',
                value: error.value,
                constraints: constraints || {},
            };
        });
    }
};
exports.ValidationExceptionFilter = ValidationExceptionFilter;
exports.ValidationExceptionFilter = ValidationExceptionFilter = ValidationExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(class_validator_1.ValidationError)
], ValidationExceptionFilter);
//# sourceMappingURL=validation-exception.filter.js.map