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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let CustomersService = class CustomersService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    findAll(tenantId) {
        return this.prisma.customer.findMany({
            where: { tenantId },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(tenantId, id) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                _count: {
                    select: {
                        sales: true,
                    },
                },
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        return customer;
    }
    async history(tenantId, id, page = 1, limit = 20, from, to, minAmount) {
        await this.findOne(tenantId, id);
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            customerId: id,
        };
        if (from || to) {
            where.createdAt = {};
            if (from) {
                where.createdAt.gte = new Date(from);
            }
            if (to) {
                where.createdAt.lte = new Date(to);
            }
        }
        if (minAmount !== undefined) {
            where.totalAmount = {
                gte: minAmount,
            };
        }
        const [sales, total] = await this.prisma.$transaction([
            this.prisma.sale.findMany({
                where,
                include: {
                    items: {
                        include: {
                            product: true,
                            productVariant: true,
                        },
                    },
                    payments: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.sale.count({
                where,
            }),
        ]);
        return {
            data: sales,
            meta: {
                page,
                limit,
                total,
            },
        };
    }
    async create(context, dto) {
        await this.ensureNoDuplicateCustomer(context.tenantId, dto);
        const customer = await this.prisma.customer.create({
            data: {
                tenantId: context.tenantId,
                ...dto,
                email: this.normalizeEmail(dto.email),
            },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'CUSTOMER_CREATED',
            entity: 'Customer',
            entityId: customer.id,
        });
        return customer;
    }
    async update(context, id, dto) {
        await this.findOne(context.tenantId, id);
        await this.ensureNoDuplicateCustomer(context.tenantId, dto, id);
        const customer = await this.prisma.customer.update({
            where: { id },
            data: {
                ...dto,
                email: this.normalizeEmail(dto.email),
            },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'CUSTOMER_UPDATED',
            entity: 'Customer',
            entityId: id,
            metadata: dto,
        });
        return customer;
    }
    async remove(tenantId, id) {
        const customer = await this.findOne(tenantId, id);
        await this.prisma.customer.delete({
            where: { id },
        });
        await this.audit.log({
            tenantId,
            userId: null,
            action: 'CUSTOMER_DELETED',
            entity: 'Customer',
            entityId: id,
            metadata: { name: customer.name },
        });
        return { id };
    }
    async ensureNoDuplicateCustomer(tenantId, dto, excludeCustomerId) {
        const normalizedEmail = this.normalizeEmail(dto.email);
        const phone = dto.phone?.trim();
        const duplicateChecks = [
            normalizedEmail
                ? this.prisma.customer.findFirst({
                    where: {
                        tenantId,
                        email: normalizedEmail,
                        id: excludeCustomerId ? { not: excludeCustomerId } : undefined,
                    },
                })
                : Promise.resolve(null),
            phone
                ? this.prisma.customer.findFirst({
                    where: {
                        tenantId,
                        phone,
                        id: excludeCustomerId ? { not: excludeCustomerId } : undefined,
                    },
                })
                : Promise.resolve(null),
        ];
        const [duplicateEmailCustomer, duplicatePhoneCustomer] = await Promise.all(duplicateChecks);
        if (duplicateEmailCustomer) {
            throw new common_1.ConflictException('A customer with this email already exists');
        }
        if (duplicatePhoneCustomer) {
            throw new common_1.ConflictException('A customer with this phone number already exists');
        }
    }
    normalizeEmail(email) {
        return email?.trim().toLowerCase();
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map