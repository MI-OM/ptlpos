"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContextGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const client_1 = require("@prisma/client");
const jwt = __importStar(require("jsonwebtoken"));
const public_decorator_1 = require("../decorators/public.decorator");
let RequestContextGuard = class RequestContextGuard {
    reflector;
    configService;
    constructor(reflector, configService) {
        this.reflector = reflector;
        this.configService = configService;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const request = context.switchToHttp().getRequest();
        const requestPath = request.originalUrl?.split('?')[0] || request.url?.split('?')[0];
        if (requestPath && (requestPath.startsWith('/api/admin/') || requestPath.startsWith('/admin/'))) {
            return true;
        }
        const authHeader = request.header('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const secret = this.configService.get('JWT_SECRET') || 'your-secret-key-change-in-production';
                const payload = jwt.verify(token, secret);
                const { sub, tenantId, role, type } = payload;
                const branchId = payload.branchId || request.header('x-branch-id');
                if (type === 'admin') {
                    request.auth = {
                        tenantId: null,
                        userId: sub,
                        role: role || 'SUPER_ADMIN',
                        branchId: null,
                    };
                    return true;
                }
                if (sub && tenantId && role && Object.values(client_1.RoleName).includes(role)) {
                    request.auth = {
                        tenantId,
                        userId: sub,
                        role: role,
                        branchId,
                    };
                    return true;
                }
            }
            catch (error) {
            }
        }
        if (request.user) {
            const user = request.user;
            const { sub, tenantId, role, branchId } = user;
            if (sub && tenantId && role && Object.values(client_1.RoleName).includes(role)) {
                request.auth = {
                    tenantId,
                    userId: sub,
                    role: role,
                    branchId,
                };
                return true;
            }
        }
        if (isPublic) {
            return true;
        }
        throw new common_1.UnauthorizedException('Missing authentication: provide JWT Bearer token');
    }
};
exports.RequestContextGuard = RequestContextGuard;
exports.RequestContextGuard = RequestContextGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        config_1.ConfigService])
], RequestContextGuard);
//# sourceMappingURL=request-context.guard.js.map