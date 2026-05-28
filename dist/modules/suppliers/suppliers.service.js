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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let SuppliersService = class SuppliersService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    findAll(tenantId) {
        return this.prisma.supplier.findMany({
            where: { tenantId },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(tenantId, id) {
        const supplier = await this.prisma.supplier.findFirst({
            where: {
                id,
                tenantId,
            },
        });
        if (!supplier) {
            throw new common_1.NotFoundException('Supplier not found');
        }
        return supplier;
    }
    async create(context, dto) {
        await this.ensureNoDuplicateSupplier(context.tenantId, dto);
        const supplier = await this.prisma.supplier.create({
            data: {
                tenantId: context.tenantId,
                name: dto.name,
                email: this.normalizeEmail(dto.email),
                phone: dto.phone?.trim(),
            },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'SUPPLIER_CREATED',
            entity: 'Supplier',
            entityId: supplier.id,
        });
        return supplier;
    }
    async update(context, id, dto) {
        await this.findOne(context.tenantId, id);
        await this.ensureNoDuplicateSupplier(context.tenantId, dto, id);
        const supplier = await this.prisma.supplier.update({
            where: { id },
            data: {
                name: dto.name,
                email: this.normalizeEmail(dto.email),
                phone: dto.phone?.trim(),
            },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'SUPPLIER_UPDATED',
            entity: 'Supplier',
            entityId: supplier.id,
            metadata: dto,
        });
        return supplier;
    }
    async remove(tenantId, id) {
        const supplier = await this.findOne(tenantId, id);
        await this.prisma.supplier.delete({
            where: { id },
        });
        await this.audit.log({
            tenantId,
            userId: null,
            action: 'SUPPLIER_DELETED',
            entity: 'Supplier',
            entityId: id,
            metadata: { name: supplier.name },
        });
        return { id };
    }
    async ensureNoDuplicateSupplier(tenantId, dto, excludeSupplierId) {
        const email = this.normalizeEmail(dto.email);
        const phone = dto.phone?.trim();
        const [duplicateEmail, duplicatePhone] = await Promise.all([
            email
                ? this.prisma.supplier.findFirst({
                    where: {
                        tenantId,
                        email,
                        id: excludeSupplierId ? { not: excludeSupplierId } : undefined,
                    },
                })
                : Promise.resolve(null),
            phone
                ? this.prisma.supplier.findFirst({
                    where: {
                        tenantId,
                        phone,
                        id: excludeSupplierId ? { not: excludeSupplierId } : undefined,
                    },
                })
                : Promise.resolve(null),
        ]);
        if (duplicateEmail) {
            throw new common_1.ConflictException('A supplier with this email already exists');
        }
        if (duplicatePhone) {
            throw new common_1.ConflictException('A supplier with this phone number already exists');
        }
    }
    normalizeEmail(email) {
        return email?.trim().toLowerCase();
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map