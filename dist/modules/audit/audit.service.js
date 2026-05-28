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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(payload) {
        await this.prisma.auditLog.create({
            data: {
                tenantId: payload.tenantId,
                userId: payload.userId,
                action: payload.action,
                entity: payload.entity,
                entityId: payload.entityId,
                metadata: payload.metadata,
            },
        });
    }
    async findAll(tenantId, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            action: query.action,
            entity: query.entity,
            entityId: query.entityId,
            userId: query.userId,
            timestamp: query.from || query.to
                ? {
                    gte: query.from ? new Date(query.from) : undefined,
                    lte: query.to ? new Date(query.to) : undefined,
                }
                : undefined,
        };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    timestamp: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.auditLog.count({
                where,
            }),
        ]);
        const transformedData = data.map((log) => ({
            id: log.id,
            userId: log.userId,
            userName: log.user?.name || 'Unknown User',
            userEmail: log.user?.email || null,
            action: log.action,
            entity: log.entity,
            entityId: log.entityId,
            entityName: log.metadata?.entityName || log.metadata?.name || null,
            timestamp: log.timestamp,
            metadata: log.metadata,
        }));
        return {
            data: transformedData,
            meta: {
                page,
                limit,
                total,
            },
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map