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
exports.ShiftsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../../modules/audit/audit.service");
let ShiftsService = class ShiftsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async openShift(context, dto) {
        const existingOpenShift = await this.prisma.shift.findFirst({
            where: {
                tenantId: context.tenantId,
                userId: context.userId,
                status: client_1.ShiftStatus.OPEN,
            },
        });
        if (existingOpenShift) {
            throw new common_1.BadRequestException('You already have an open shift. Close it first before opening a new one.');
        }
        const shift = await this.prisma.shift.create({
            data: {
                tenantId: context.tenantId,
                branchId: context.branchId,
                userId: context.userId,
                openingBalance: new client_1.Prisma.Decimal(dto.openingBalance),
                drawerType: dto.drawerType || client_1.DrawerType.OFFLINE,
                notes: dto.notes,
                status: client_1.ShiftStatus.OPEN,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                branch: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        return {
            id: shift.id,
            user: shift.user,
            branch: shift.branch,
            openedAt: shift.openedAt,
            openingBalance: shift.openingBalance,
            drawerType: shift.drawerType,
            status: shift.status,
            notes: shift.notes,
        };
    }
    async closeShift(context, shiftId, dto) {
        const shift = await this.prisma.shift.findFirst({
            where: {
                id: shiftId,
                tenantId: context.tenantId,
                userId: context.userId,
                status: client_1.ShiftStatus.OPEN,
            },
            include: {
                sales: {
                    where: {
                        status: 'COMPLETED',
                    },
                    include: {
                        payments: true,
                    },
                },
            },
        });
        if (!shift) {
            throw new common_1.NotFoundException('Open shift not found');
        }
        let cashSales = new client_1.Prisma.Decimal(0);
        let cardSales = new client_1.Prisma.Decimal(0);
        let transferSales = new client_1.Prisma.Decimal(0);
        let otherSales = new client_1.Prisma.Decimal(0);
        for (const sale of shift.sales) {
            for (const payment of sale.payments) {
                if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
                    if (payment.method === 'CASH') {
                        cashSales = cashSales.add(payment.amount);
                    }
                    else if (payment.method === 'CARD') {
                        cardSales = cardSales.add(payment.amount);
                    }
                    else if (payment.method === 'TRANSFER') {
                        transferSales = transferSales.add(payment.amount);
                    }
                    else {
                        otherSales = otherSales.add(payment.amount);
                    }
                }
            }
        }
        const closingBalance = new client_1.Prisma.Decimal(dto.closingBalance);
        const discrepancy = closingBalance.sub(shift.openingBalance).sub(cashSales);
        const updatedShift = await this.prisma.shift.update({
            where: { id: shiftId },
            data: {
                closedAt: new Date(),
                closingBalance,
                cashSales,
                cardSales,
                otherSales,
                offlineDrawerBalance: shift.drawerType === client_1.DrawerType.OFFLINE || shift.drawerType === client_1.DrawerType.MIXED ? closingBalance : null,
                onlineDrawerBalance: shift.drawerType === client_1.DrawerType.ONLINE || shift.drawerType === client_1.DrawerType.MIXED ? cardSales : null,
                discrepancy,
                notes: dto.notes || shift.notes,
                status: client_1.ShiftStatus.CLOSED,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                branch: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        return {
            id: updatedShift.id,
            user: updatedShift.user,
            branch: updatedShift.branch,
            openedAt: updatedShift.openedAt,
            closedAt: updatedShift.closedAt,
            openingBalance: updatedShift.openingBalance,
            closingBalance: updatedShift.closingBalance,
            drawerType: updatedShift.drawerType,
            cashSales: updatedShift.cashSales,
            cardSales: updatedShift.cardSales,
            transferSales: transferSales,
            otherSales: updatedShift.otherSales,
            totalSales: updatedShift.cashSales.add(updatedShift.cardSales).add(transferSales).add(updatedShift.otherSales),
            discrepancy: updatedShift.discrepancy,
            status: updatedShift.status,
            notes: updatedShift.notes,
        };
    }
    async getActiveShift(context) {
        const shift = await this.prisma.shift.findFirst({
            where: {
                tenantId: context.tenantId,
                userId: context.userId,
                status: client_1.ShiftStatus.OPEN,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                branch: {
                    select: {
                        name: true,
                    },
                },
                sales: {
                    where: {
                        status: 'COMPLETED',
                    },
                    include: {
                        payments: true,
                    },
                },
            },
        });
        if (!shift) {
            return null;
        }
        let cashSales = new client_1.Prisma.Decimal(0);
        let cardSales = new client_1.Prisma.Decimal(0);
        let transferSales = new client_1.Prisma.Decimal(0);
        let otherSales = new client_1.Prisma.Decimal(0);
        for (const sale of shift.sales) {
            for (const payment of sale.payments) {
                if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
                    if (payment.method === 'CASH') {
                        cashSales = cashSales.add(payment.amount);
                    }
                    else if (payment.method === 'CARD') {
                        cardSales = cardSales.add(payment.amount);
                    }
                    else if (payment.method === 'TRANSFER') {
                        transferSales = transferSales.add(payment.amount);
                    }
                    else {
                        otherSales = otherSales.add(payment.amount);
                    }
                }
            }
        }
        return {
            id: shift.id,
            user: shift.user,
            branch: shift.branch,
            openedAt: shift.openedAt,
            openingBalance: shift.openingBalance,
            cashSales,
            cardSales,
            transferSales,
            otherSales,
            totalSales: cashSales.add(cardSales).add(transferSales).add(otherSales),
            status: shift.status,
            notes: shift.notes,
            salesCount: shift.sales.length,
        };
    }
    async findAll(context, query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            tenantId: context.tenantId,
        };
        if (query.status) {
            where.status = query.status;
        }
        if (query.branchId) {
            where.branchId = query.branchId;
        }
        else if (context.branchId) {
            where.branchId = context.branchId;
        }
        if (query.fromDate || query.toDate) {
            where.openedAt = {};
            if (query.fromDate) {
                where.openedAt.gte = new Date(query.fromDate);
            }
            if (query.toDate) {
                where.openedAt.lte = new Date(query.toDate);
            }
        }
        const [shifts, total] = await Promise.all([
            this.prisma.shift.findMany({
                where,
                skip,
                take: limit,
                orderBy: { openedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    branch: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
            this.prisma.shift.count({ where }),
        ]);
        return {
            data: shifts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(context, shiftId) {
        const shift = await this.prisma.shift.findFirst({
            where: {
                id: shiftId,
                tenantId: context.tenantId,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                branch: {
                    select: {
                        name: true,
                    },
                },
                sales: {
                    include: {
                        payments: true,
                    },
                },
            },
        });
        if (!shift) {
            throw new common_1.NotFoundException('Shift not found');
        }
        return shift;
    }
    async getCashDrawerSummary(context) {
        const shift = await this.getActiveShift(context);
        if (!shift) {
            throw new common_1.NotFoundException('No active shift found for the current user');
        }
        return {
            shiftId: shift.id,
            openedAt: shift.openedAt,
            openingBalance: shift.openingBalance,
            cashSales: shift.cashSales,
            cardSales: shift.cardSales,
            otherSales: shift.otherSales,
            totalSales: shift.totalSales,
            salesCount: shift.salesCount,
            status: shift.status,
            user: shift.user,
            branch: shift.branch,
        };
    }
    async reconcileShift(context, shiftId, dto) {
        const shift = await this.prisma.shift.findFirst({
            where: {
                id: shiftId,
                tenantId: context.tenantId,
            },
            include: {
                sales: {
                    where: {
                        status: 'COMPLETED',
                    },
                    include: {
                        payments: true,
                    },
                },
            },
        });
        if (!shift) {
            throw new common_1.NotFoundException('Shift not found');
        }
        let expectedCash = new client_1.Prisma.Decimal(0);
        let expectedCard = new client_1.Prisma.Decimal(0);
        let expectedTransfer = new client_1.Prisma.Decimal(0);
        let expectedMobile = new client_1.Prisma.Decimal(0);
        for (const sale of shift.sales) {
            for (const payment of sale.payments) {
                if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
                    if (payment.method === 'CASH') {
                        expectedCash = expectedCash.add(payment.amount);
                    }
                    else if (payment.method === 'CARD') {
                        expectedCard = expectedCard.add(payment.amount);
                    }
                    else if (payment.method === 'TRANSFER') {
                        expectedTransfer = expectedTransfer.add(payment.amount);
                    }
                }
            }
        }
        const actualCash = new client_1.Prisma.Decimal(dto.actualCash);
        const actualCard = dto.actualCard ? new client_1.Prisma.Decimal(dto.actualCard) : expectedCard;
        const actualTransfer = dto.actualTransfer ? new client_1.Prisma.Decimal(dto.actualTransfer) : expectedTransfer;
        const actualMobile = dto.actualMobile ? new client_1.Prisma.Decimal(dto.actualMobile) : new client_1.Prisma.Decimal(0);
        const expectedTotal = expectedCash.add(expectedCard).add(expectedTransfer).add(new client_1.Prisma.Decimal(0));
        const actualTotal = actualCash.add(actualCard).add(actualTransfer).add(actualMobile);
        const cashDiscrepancy = actualCash.sub(expectedCash);
        const cardDiscrepancy = actualCard.sub(expectedCard);
        const transferDiscrepancy = actualTransfer.sub(expectedTransfer);
        const mobileDiscrepancy = actualMobile.sub(new client_1.Prisma.Decimal(0));
        const totalDiscrepancy = actualTotal.sub(expectedTotal);
        const reconciliation = await this.prisma.shiftReconciliation.create({
            data: {
                tenantId: context.tenantId,
                shiftId: shiftId,
                expectedCash,
                expectedCard,
                expectedTransfer,
                expectedMobile: new client_1.Prisma.Decimal(0),
                expectedTotal,
                actualCash,
                actualCard,
                actualTransfer,
                actualMobile,
                actualTotal,
                cashDiscrepancy,
                cardDiscrepancy,
                transferDiscrepancy,
                mobileDiscrepancy,
                totalDiscrepancy,
                notes: dto.notes,
                reconciledBy: context.userId,
                reconciledAt: new Date(),
            },
        });
        await this.prisma.shift.update({
            where: { id: shiftId },
            data: {
                actualCashCount: actualCash,
                discrepancy: totalDiscrepancy,
            },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'SHIFT_RECONCILED',
            entity: 'Shift',
            entityId: shiftId,
            metadata: {
                expectedTotal: expectedTotal.toNumber(),
                actualTotal: actualTotal.toNumber(),
                discrepancy: totalDiscrepancy.toNumber(),
                notes: dto.notes,
            },
        });
        return reconciliation;
    }
    async getEndOfDayReport(context, date, branchId) {
        const reportDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(reportDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(reportDate);
        endOfDay.setHours(23, 59, 59, 999);
        const shifts = await this.prisma.shift.findMany({
            where: {
                tenantId: context.tenantId,
                ...(branchId ? { branchId } : {}),
                openedAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                sales: {
                    where: {
                        status: 'COMPLETED',
                    },
                    include: {
                        payments: true,
                    },
                },
                reconciliations: true,
            },
            orderBy: {
                openedAt: 'asc',
            },
        });
        const shiftReports = shifts.map((shift) => {
            let totalSales = new client_1.Prisma.Decimal(0);
            let totalRevenue = new client_1.Prisma.Decimal(0);
            let totalRefunds = 0;
            let totalRefundAmount = new client_1.Prisma.Decimal(0);
            let cashPayments = new client_1.Prisma.Decimal(0);
            let cardPayments = new client_1.Prisma.Decimal(0);
            let transferPayments = new client_1.Prisma.Decimal(0);
            let mobilePayments = new client_1.Prisma.Decimal(0);
            for (const sale of shift.sales) {
                if (sale.status === 'COMPLETED') {
                    totalSales = totalSales.add(1);
                    totalRevenue = totalRevenue.add(sale.totalAmount);
                    for (const payment of sale.payments) {
                        if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
                            if (payment.method === 'CASH') {
                                cashPayments = cashPayments.add(payment.amount);
                            }
                            else if (payment.method === 'CARD') {
                                cardPayments = cardPayments.add(payment.amount);
                            }
                            else if (payment.method === 'TRANSFER') {
                                transferPayments = transferPayments.add(payment.amount);
                            }
                        }
                    }
                }
                else if (sale.status === 'REFUNDED') {
                    totalRefunds = totalRefunds + 1;
                    totalRefundAmount = totalRefundAmount.add(sale.totalAmount);
                }
            }
            const latestReconciliation = shift.reconciliations[shift.reconciliations.length - 1];
            return {
                shiftId: shift.id,
                userId: shift.user.id,
                userName: shift.user.name,
                branchId: shift.branch?.id,
                branchName: shift.branch?.name,
                openTime: shift.openedAt,
                closeTime: shift.closedAt,
                sales: {
                    totalSales: totalSales.toNumber(),
                    totalRevenue: totalRevenue.toNumber(),
                    totalRefunds,
                    totalRefundAmount: totalRefundAmount.toNumber(),
                },
                payments: {
                    cash: cashPayments.toNumber(),
                    card: cardPayments.toNumber(),
                    transfer: transferPayments.toNumber(),
                    mobile: mobilePayments.toNumber(),
                    storeCredit: new client_1.Prisma.Decimal(0).toNumber(),
                },
                drawer: {
                    openingBalance: shift.openingBalance.toNumber(),
                    expectedCash: shift.cashSales.add(shift.openingBalance).toNumber(),
                    actualCash: latestReconciliation?.actualCash?.toNumber() || null,
                    discrepancy: latestReconciliation?.totalDiscrepancy?.toNumber() || null,
                },
            };
        });
        const totals = shiftReports.reduce((acc, shift) => ({
            totalSales: acc.totalSales + shift.sales.totalSales,
            totalRevenue: acc.totalRevenue + shift.sales.totalRevenue,
            totalCash: acc.totalCash + shift.payments.cash,
            totalCard: acc.totalCard + shift.payments.card,
            totalTransfer: acc.totalTransfer + shift.payments.transfer,
            totalMobile: acc.totalMobile + shift.payments.mobile,
            totalDiscrepancy: acc.totalDiscrepancy + (shift.drawer.discrepancy || 0),
        }), {
            totalSales: 0,
            totalRevenue: 0,
            totalCash: 0,
            totalCard: 0,
            totalTransfer: 0,
            totalMobile: 0,
            totalDiscrepancy: 0,
        });
        return {
            date: reportDate.toISOString().split('T')[0],
            branchId,
            shifts: shiftReports,
            totals,
        };
    }
    async getEndOfShiftReport(context, shiftId) {
        const shift = await this.prisma.shift.findFirst({
            where: {
                id: shiftId,
                tenantId: context.tenantId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                sales: {
                    include: {
                        payments: true,
                    },
                },
                reconciliations: {
                    orderBy: {
                        reconciledAt: 'desc',
                    },
                    take: 1,
                },
            },
        });
        if (!shift) {
            throw new common_1.NotFoundException('Shift not found');
        }
        let totalSales = 0;
        let totalRevenue = new client_1.Prisma.Decimal(0);
        let totalRefunds = 0;
        let totalRefundAmount = new client_1.Prisma.Decimal(0);
        let cashPayments = new client_1.Prisma.Decimal(0);
        let cardPayments = new client_1.Prisma.Decimal(0);
        let transferPayments = new client_1.Prisma.Decimal(0);
        let mobilePayments = new client_1.Prisma.Decimal(0);
        for (const sale of shift.sales) {
            if (sale.status === 'COMPLETED') {
                totalSales = totalSales + 1;
                totalRevenue = totalRevenue.add(sale.totalAmount);
                for (const payment of sale.payments) {
                    if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
                        if (payment.method === 'CASH') {
                            cashPayments = cashPayments.add(payment.amount);
                        }
                        else if (payment.method === 'CARD') {
                            cardPayments = cardPayments.add(payment.amount);
                        }
                        else if (payment.method === 'TRANSFER') {
                            transferPayments = transferPayments.add(payment.amount);
                        }
                    }
                }
            }
            else if (sale.status === 'REFUNDED') {
                totalRefunds = totalRefunds + 1;
                totalRefundAmount = totalRefundAmount.add(sale.totalAmount);
            }
        }
        const latestReconciliation = shift.reconciliations[0];
        return {
            shiftId: shift.id,
            userId: shift.user.id,
            userName: shift.user.name,
            branchId: shift.branch?.id,
            branchName: shift.branch?.name,
            openTime: shift.openedAt,
            closeTime: shift.closedAt,
            sales: {
                totalSales,
                totalRevenue: totalRevenue.toNumber(),
                totalRefunds,
                totalRefundAmount: totalRefundAmount.toNumber(),
            },
            payments: {
                cash: cashPayments.toNumber(),
                card: cardPayments.toNumber(),
                transfer: transferPayments.toNumber(),
                mobile: mobilePayments.toNumber(),
                storeCredit: new client_1.Prisma.Decimal(0).toNumber(),
            },
            drawer: {
                openingBalance: shift.openingBalance.toNumber(),
                expectedCash: shift.cashSales.add(shift.openingBalance).toNumber(),
                actualCash: latestReconciliation?.actualCash?.toNumber() || null,
                discrepancy: latestReconciliation?.totalDiscrepancy?.toNumber() || null,
            },
            reconciliation: latestReconciliation || null,
        };
    }
    async getSalesPerformance(context, userId, fromDate, toDate, branchId) {
        const startDate = fromDate ? new Date(fromDate) : new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = toDate ? new Date(toDate) : new Date();
        endDate.setHours(23, 59, 59, 999);
        const where = {
            tenantId: context.tenantId,
            status: 'COMPLETED',
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            ...(branchId ? { branchId } : {}),
        };
        if (userId) {
            where.shift = {
                userId,
            };
        }
        const sales = await this.prisma.sale.findMany({
            where,
            include: {
                payments: true,
                shift: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const groupedByUser = sales.reduce((acc, sale) => {
            const userId = sale.shift?.userId || 'unassigned';
            const userName = sale.shift?.user?.name || 'Unassigned';
            if (!acc[userId]) {
                acc[userId] = {
                    userId,
                    userName,
                    totalSales: 0,
                    totalRevenue: 0,
                    totalRefunds: 0,
                    totalRefundAmount: 0,
                    payments: {
                        cash: 0,
                        card: 0,
                        transfer: 0,
                        mobile: 0,
                    },
                };
            }
            acc[userId].totalSales = acc[userId].totalSales + 1;
            acc[userId].totalRevenue = acc[userId].totalRevenue + Number(sale.totalAmount);
            for (const payment of sale.payments) {
                if (payment.direction === 'SALE' && payment.status === 'COMPLETED') {
                    if (payment.method === 'CASH') {
                        acc[userId].payments.cash = acc[userId].payments.cash + Number(payment.amount);
                    }
                    else if (payment.method === 'CARD') {
                        acc[userId].payments.card = acc[userId].payments.card + Number(payment.amount);
                    }
                    else if (payment.method === 'TRANSFER') {
                        acc[userId].payments.transfer = acc[userId].payments.transfer + Number(payment.amount);
                    }
                }
            }
            return acc;
        }, {});
        return {
            period: {
                from: startDate.toISOString(),
                to: endDate.toISOString(),
            },
            users: Object.values(groupedByUser),
            totals: {
                totalSales: sales.length,
                totalRevenue: sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0),
            },
        };
    }
};
exports.ShiftsService = ShiftsService;
exports.ShiftsService = ShiftsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ShiftsService);
//# sourceMappingURL=shifts.service.js.map