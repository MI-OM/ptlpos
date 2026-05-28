"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = LoggingInterceptor_1 = class LoggingInterceptor {
    logger = new common_1.Logger(LoggingInterceptor_1.name);
    intercept(context, next) {
        const now = Date.now();
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        return next.handle().pipe((0, operators_1.tap)(() => {
            this.logger.log(JSON.stringify({
                event: 'http_request_completed',
                method: request.method,
                path: request.originalUrl ?? request.url,
                statusCode: response.statusCode,
                durationMs: Date.now() - now,
                tenantId: request.auth?.tenantId ?? null,
                userId: request.auth?.userId ?? null,
                role: request.auth?.role ?? null,
            }));
        }), (0, operators_1.catchError)((error) => {
            this.logger.error(JSON.stringify({
                event: 'http_request_failed',
                method: request.method,
                path: request.originalUrl ?? request.url,
                statusCode: error.status ?? response.statusCode ?? 500,
                durationMs: Date.now() - now,
                tenantId: request.auth?.tenantId ?? null,
                userId: request.auth?.userId ?? null,
                role: request.auth?.role ?? null,
                message: error.message,
            }));
            return (0, rxjs_1.throwError)(() => error);
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = LoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map