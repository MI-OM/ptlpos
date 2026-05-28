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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let BranchesService = class BranchesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(tenantId) {
        return this.prisma.branch.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(tenantId, id) {
        const branch = await this.prisma.branch.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                _count: {
                    select: {
                        inventories: true,
                        sales: true,
                        purchaseOrders: true,
                    },
                },
            },
        });
        if (!branch) {
            throw new common_1.NotFoundException('Branch not found');
        }
        return branch;
    }
    async create(context, dto) {
        const existing = await this.prisma.branch.findFirst({
            where: {
                tenantId: context.tenantId,
                name: dto.name,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('A branch with this name already exists for your tenant');
        }
        const branch = await this.prisma.branch.create({
            data: {
                tenantId: context.tenantId,
                ...dto,
            },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'BRANCH_CREATED',
            entity: 'Branch',
            entityId: branch.id,
            metadata: dto,
        });
        return branch;
    }
    async update(context, id, dto) {
        await this.findOne(context.tenantId, id);
        if (dto.name) {
            const existing = await this.prisma.branch.findFirst({
                where: {
                    tenantId: context.tenantId,
                    name: dto.name,
                    id: { not: id },
                },
            });
            if (existing) {
                throw new common_1.ConflictException('A branch with this name already exists for your tenant');
            }
        }
        const branch = await this.prisma.branch.update({
            where: { id },
            data: dto,
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'BRANCH_UPDATED',
            entity: 'Branch',
            entityId: id,
            metadata: dto,
        });
        return branch;
    }
    async delete(context, id) {
        const branch = await this.findOne(context.tenantId, id);
        const inventoryCount = await this.prisma.inventory.count({
            where: {
                tenantId: context.tenantId,
                branchId: id,
            },
        });
        const saleCount = await this.prisma.sale.count({
            where: {
                tenantId: context.tenantId,
                branchId: id,
            },
        });
        if (inventoryCount > 0 || saleCount > 0) {
            throw new common_1.ConflictException('Cannot delete branch with inventory or sales data. Transfer or archive data first.');
        }
        await this.prisma.branch.delete({
            where: { id },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'BRANCH_DELETED',
            entity: 'Branch',
            entityId: id,
        });
        return { success: true };
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map