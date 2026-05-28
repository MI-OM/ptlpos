"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PerformanceInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let PerformanceInterceptor = PerformanceInterceptor_1 = class PerformanceInterceptor {
    logger = new common_1.Logger(PerformanceInterceptor_1.name);
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const url = request.url;
        const startTime = Date.now();
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                const duration = Date.now() - startTime;
                if (duration > 1000) {
                    this.logger.warn(`Slow Request: ${method} ${url} - ${duration}ms`, {
                        method,
                        url,
                        duration,
                        responseSize: JSON.stringify(data).length,
                        userAgent: request.get('user-agent'),
                        ip: request.ip,
                    });
                }
                else {
                    this.logger.debug(`Request: ${method} ${url} - ${duration}ms`, {
                        method,
                        url,
                        duration,
                    });
                }
                if (duration > 3000) {
                    this.logger.error(`Very Slow Request Alert: ${method} ${url} took ${duration}ms`, {
                        method,
                        url,
                        duration,
                        timestamp: new Date().toISOString(),
                    });
                }
            },
            error: (error) => {
                const duration = Date.now() - startTime;
                this.logger.error(`Request Failed: ${method} ${url} - ${duration}ms - ${error.message}`, {
                    method,
                    url,
                    duration,
                    error: error.message,
                    stack: error.stack,
                });
            },
        }));
    }
};
exports.PerformanceInterceptor = PerformanceInterceptor;
exports.PerformanceInterceptor = PerformanceInterceptor = PerformanceInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], PerformanceInterceptor);
//# sourceMappingURL=performance.interceptor.js.map