"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const errorResponse = this.buildErrorResponse(exception, status);
        if (!(exception instanceof common_1.HttpException)) {
            this.logger.error(JSON.stringify({
                event: 'unhandled_exception',
                method: request.method,
                path: request.originalUrl ?? request.url,
                statusCode: status,
                message: errorResponse.message,
            }));
        }
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.originalUrl ?? request.url,
            error: errorResponse.error,
            message: errorResponse.message,
            details: errorResponse.details,
        });
    }
    buildErrorResponse(exception, status) {
        if (!(exception instanceof common_1.HttpException)) {
            return {
                error: 'Internal Server Error',
                message: 'An unexpected error occurred',
            };
        }
        const response = exception.getResponse();
        if (typeof response === 'string') {
            return {
                error: this.resolveErrorLabel(status),
                message: response,
            };
        }
        if (typeof response === 'object' && response !== null) {
            const payload = response;
            return {
                error: payload.error ?? this.resolveErrorLabel(status),
                message: payload.message ?? exception.message,
                details: payload.details,
            };
        }
        return {
            error: this.resolveErrorLabel(status),
            message: exception.message,
        };
    }
    resolveErrorLabel(status) {
        return common_1.HttpStatus[status] ?? 'Error';
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map