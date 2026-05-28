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
exports.CreditService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
let CreditService = class CreditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addCredit(context, customerId, amount, note) {
        return this.prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findFirst({
                where: {
                    id: customerId,
                    tenantId: context.tenantId,
                },
            });
            if (!customer) {
                throw new common_1.NotFoundException('Customer not found');
            }
            if (amount <= 0) {
                throw new common_1.BadRequestException('Credit amount must be positive');
            }
            const newBalance = new client_1.Prisma.Decimal(customer.creditBalance).add(amount);
            const transaction = await tx.creditTransaction.create({
                data: {
                    tenantId: context.tenantId,
                    customerId,
                    amount: new client_1.Prisma.Decimal(amount),
                    balanceAfter: newBalance,
                    type: client_1.CreditTransactionType.CREDIT,
                    note,
                },
            });
            await tx.customer.update({
                where: { id: customerId },
                data: {
                    creditBalance: newBalance,
                },
            });
            return {
                transaction,
                newBalance,
            };
        });
    }
    async deductCredit(context, customerId, amount, referenceType, referenceId, note) {
        return this.prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findFirst({
                where: {
                    id: customerId,
                    tenantId: context.tenantId,
                },
            });
            if (!customer) {
                throw new common_1.NotFoundException('Customer not found');
            }
            if (amount <= 0) {
                throw new common_1.BadRequestException('Deduction amount must be positive');
            }
            if (new client_1.Prisma.Decimal(customer.creditBalance).lessThan(amount)) {
                throw new common_1.BadRequestException('Insufficient credit balance');
            }
            const newBalance = new client_1.Prisma.Decimal(customer.creditBalance).sub(amount);
            const transaction = await tx.creditTransaction.create({
                data: {
                    tenantId: context.tenantId,
                    customerId,
                    amount: new client_1.Prisma.Decimal(amount),
                    balanceAfter: newBalance,
                    type: client_1.CreditTransactionType.DEBIT,
                    referenceType,
                    referenceId,
                    note,
                },
            });
            await tx.customer.update({
                where: { id: customerId },
                data: {
                    creditBalance: newBalance,
                },
            });
            return {
                transaction,
                newBalance,
            };
        });
    }
    async getCreditBalance(context, customerId) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                tenantId: context.tenantId,
            },
            select: {
                id: true,
                name: true,
                creditBalance: true,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        return customer;
    }
    async getCreditTransactions(context, customerId) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                tenantId: context.tenantId,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        const transactions = await this.prisma.creditTransaction.findMany({
            where: {
                customerId,
                tenantId: context.tenantId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50,
        });
        return {
            customer,
            transactions,
        };
    }
    async adjustCredit(context, customerId, amount, note) {
        return this.prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findFirst({
                where: {
                    id: customerId,
                    tenantId: context.tenantId,
                },
            });
            if (!customer) {
                throw new common_1.NotFoundException('Customer not found');
            }
            const newBalance = new client_1.Prisma.Decimal(customer.creditBalance).add(amount);
            const transaction = await tx.creditTransaction.create({
                data: {
                    tenantId: context.tenantId,
                    customerId,
                    amount: new client_1.Prisma.Decimal(amount),
                    balanceAfter: newBalance,
                    type: client_1.CreditTransactionType.ADJUSTMENT,
                    note: note || 'Manual adjustment',
                },
            });
            await tx.customer.update({
                where: { id: customerId },
                data: {
                    creditBalance: newBalance,
                },
            });
            return {
                transaction,
                newBalance,
            };
        });
    }
};
exports.CreditService = CreditService;
exports.CreditService = CreditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreditService);
//# sourceMappingURL=credit.service.js.map