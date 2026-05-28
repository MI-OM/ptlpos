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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let PaymentsService = class PaymentsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(context, dto) {
        const paymentStatus = dto.status ?? client_1.PaymentStatus.COMPLETED;
        if (paymentStatus !== client_1.PaymentStatus.PENDING &&
            paymentStatus !== client_1.PaymentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Payments can only be created as PENDING or COMPLETED');
        }
        if ((dto.method === client_1.PaymentMethod.CARD || dto.method === client_1.PaymentMethod.TRANSFER) &&
            !dto.externalRef?.trim()) {
            throw new common_1.BadRequestException('Card and transfer payments require an external reference');
        }
        if (dto.externalRef?.trim()) {
            const existing = await this.prisma.payment.findFirst({
                where: {
                    tenantId: context.tenantId,
                    externalRef: dto.externalRef.trim(),
                },
            });
            if (existing) {
                throw new common_1.ConflictException('A payment with this external reference already exists');
            }
        }
        const payment = await this.prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findFirst({
                where: {
                    id: dto.saleId,
                    tenantId: context.tenantId,
                },
            });
            if (!sale) {
                throw new common_1.NotFoundException('Sale not found');
            }
            const saleStatuses = [client_1.SaleStatus.CANCELLED, client_1.SaleStatus.REFUNDED];
            if (saleStatuses.includes(sale.status)) {
                throw new common_1.BadRequestException('Payments cannot be added to cancelled or refunded sales');
            }
            const paidAmountDelta = paymentStatus === client_1.PaymentStatus.COMPLETED ? new client_1.Prisma.Decimal(dto.amount) : new client_1.Prisma.Decimal(0);
            const nextPaidAmount = new client_1.Prisma.Decimal(sale.paidAmount).add(paidAmountDelta);
            if (nextPaidAmount.greaterThan(sale.totalAmount)) {
                throw new common_1.BadRequestException('Payments cannot exceed the sale total');
            }
            const created = await tx.payment.create({
                data: {
                    tenantId: context.tenantId,
                    saleId: dto.saleId,
                    method: dto.method,
                    amount: dto.amount,
                    reference: dto.reference,
                    externalRef: dto.externalRef?.trim(),
                    status: paymentStatus,
                },
            });
            if (!paidAmountDelta.equals(0)) {
                await tx.sale.update({
                    where: { id: sale.id },
                    data: {
                        paidAmount: nextPaidAmount,
                    },
                });
            }
            return created;
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'PAYMENT_CREATED',
            entity: 'Payment',
            entityId: payment.id,
            metadata: dto,
        });
        return payment;
    }
    async reconciliation(tenantId, query) {
        const range = query.from || query.to
            ? {
                gte: query.from ? new Date(query.from) : undefined,
                lte: query.to ? new Date(query.to) : undefined,
            }
            : undefined;
        const grouped = await this.prisma.payment.groupBy({
            by: ['method', 'direction'],
            where: {
                tenantId,
                createdAt: range,
            },
            _sum: {
                amount: true,
            },
            _count: {
                _all: true,
            },
        });
        const methods = Object.values(client_1.PaymentMethod).map(method => {
            const saleEntry = grouped.find(entry => entry.method === method && entry.direction === client_1.PaymentDirection.SALE);
            const refundEntry = grouped.find(entry => entry.method === method && entry.direction === client_1.PaymentDirection.REFUND);
            const salesAmount = Number(saleEntry?._sum.amount ?? 0);
            const refundAmount = Number(refundEntry?._sum.amount ?? 0);
            return {
                method,
                salesAmount,
                refundAmount,
                netAmount: salesAmount - refundAmount,
                salesCount: saleEntry?._count._all ?? 0,
                refundCount: refundEntry?._count._all ?? 0,
            };
        });
        return {
            range: {
                from: query.from ?? null,
                to: query.to ?? null,
            },
            totals: {
                salesAmount: methods.reduce((sum, entry) => sum + entry.salesAmount, 0),
                refundAmount: methods.reduce((sum, entry) => sum + entry.refundAmount, 0),
                netAmount: methods.reduce((sum, entry) => sum + entry.netAmount, 0),
                salesCount: methods.reduce((sum, entry) => sum + entry.salesCount, 0),
                refundCount: methods.reduce((sum, entry) => sum + entry.refundCount, 0),
            },
            methods,
        };
    }
    async cashDrawerSummary(tenantId, query) {
        const range = query.from || query.to
            ? {
                gte: query.from ? new Date(query.from) : undefined,
                lte: query.to ? new Date(query.to) : undefined,
            }
            : undefined;
        const branchFilter = query.branchId
            ? {
                sale: {
                    branchId: query.branchId,
                },
            }
            : undefined;
        const grouped = await this.prisma.payment.groupBy({
            by: ['direction'],
            where: {
                tenantId,
                method: client_1.PaymentMethod.CASH,
                status: client_1.PaymentStatus.COMPLETED,
                createdAt: range,
                ...branchFilter,
            },
            _sum: {
                amount: true,
            },
            _count: {
                _all: true,
            },
        });
        const salesEntry = grouped.find(entry => entry.direction === client_1.PaymentDirection.SALE);
        const refundEntry = grouped.find(entry => entry.direction === client_1.PaymentDirection.REFUND);
        const salesCash = Number(salesEntry?._sum.amount ?? 0);
        const refundCash = Number(refundEntry?._sum.amount ?? 0);
        const expectedCash = salesCash - refundCash;
        const countedCash = query.countedCash;
        return {
            range: {
                from: query.from ?? null,
                to: query.to ?? null,
            },
            branchId: query.branchId ?? null,
            currency: 'NGN',
            expectedCash,
            countedCash: countedCash ?? null,
            variance: countedCash === undefined ? null : countedCash - expectedCash,
            totals: {
                salesCash,
                refundCash,
                netCash: expectedCash,
                salesCount: salesEntry?._count._all ?? 0,
                refundCount: refundEntry?._count._all ?? 0,
            },
        };
    }
    async findByStatus(tenantId, status, limit = 50) {
        return this.prisma.payment.findMany({
            where: {
                tenantId,
                status,
            },
            include: {
                sale: {
                    select: {
                        id: true,
                        saleNumber: true,
                        totalAmount: true,
                        status: true,
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }
    async updateStatus(context, paymentId, newStatus) {
        const payment = await this.prisma.payment.findFirst({
            where: {
                id: paymentId,
                tenantId: context.tenantId,
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.status === newStatus) {
            return payment;
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const existingPayment = await tx.payment.findFirst({
                where: {
                    id: paymentId,
                    tenantId: context.tenantId,
                },
            });
            if (!existingPayment) {
                throw new common_1.NotFoundException('Payment not found');
            }
            if (existingPayment.direction === client_1.PaymentDirection.SALE) {
                const wasCompleted = existingPayment.status === client_1.PaymentStatus.COMPLETED;
                const willBeCompleted = newStatus === client_1.PaymentStatus.COMPLETED;
                if (wasCompleted !== willBeCompleted) {
                    const sale = await tx.sale.findFirst({
                        where: {
                            id: existingPayment.saleId,
                            tenantId: context.tenantId,
                        },
                    });
                    if (!sale) {
                        throw new common_1.NotFoundException('Sale not found');
                    }
                    const delta = new client_1.Prisma.Decimal(existingPayment.amount);
                    const nextPaidAmount = wasCompleted
                        ? new client_1.Prisma.Decimal(sale.paidAmount).sub(delta)
                        : new client_1.Prisma.Decimal(sale.paidAmount).add(delta);
                    if (nextPaidAmount.lessThan(0)) {
                        throw new common_1.BadRequestException('Sale paid amount cannot go below zero');
                    }
                    if (nextPaidAmount.greaterThan(sale.totalAmount)) {
                        throw new common_1.BadRequestException('Payments cannot exceed the sale total');
                    }
                    await tx.sale.update({
                        where: { id: sale.id },
                        data: {
                            paidAmount: nextPaidAmount,
                        },
                    });
                }
            }
            return tx.payment.update({
                where: { id: paymentId },
                data: { status: newStatus },
            });
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'PAYMENT_STATUS_UPDATED',
            entity: 'Payment',
            entityId: paymentId,
            metadata: {
                oldStatus: payment.status,
                newStatus,
            },
        });
        return updated;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map