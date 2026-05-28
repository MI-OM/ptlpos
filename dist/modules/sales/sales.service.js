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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let SalesService = class SalesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(context, dto) {
        const calculation = await this.buildSaleDraft(context.tenantId, dto);
        const incomingPaymentTotal = this.sumPayments(dto.payments);
        if (incomingPaymentTotal > calculation.total) {
            throw new common_1.BadRequestException('Payments cannot exceed the sale total');
        }
        if (dto.customerId) {
            const customer = await this.prisma.customer.findFirst({
                where: {
                    id: dto.customerId,
                    tenantId: context.tenantId,
                },
            });
            if (!customer) {
                throw new common_1.NotFoundException('Customer not found');
            }
        }
        const sale = await this.prisma.$transaction(async (tx) => {
            const saleNumber = await this.generateSaleNumber(tx, context.tenantId);
            const activeShift = await tx.shift.findFirst({
                where: {
                    tenantId: context.tenantId,
                    userId: context.userId,
                    status: 'OPEN',
                },
            });
            const createdSale = await tx.sale.create({
                data: {
                    tenantId: context.tenantId,
                    branchId: context.branchId,
                    customerId: dto.customerId,
                    shiftId: activeShift?.id,
                    saleNumber,
                    status: client_1.SaleStatus.OPEN,
                    taxRateOverride: dto.taxRate,
                    subtotalAmount: calculation.subtotal,
                    discountAmount: calculation.discount,
                    taxAmount: calculation.tax,
                    totalAmount: calculation.total,
                    paidAmount: 0,
                    note: dto.note,
                    items: {
                        create: calculation.items,
                    },
                },
                include: {
                    items: true,
                    payments: true,
                },
            });
            if (dto.payments?.length) {
                for (const payment of dto.payments) {
                    await tx.payment.create({
                        data: {
                            tenantId: context.tenantId,
                            saleId: createdSale.id,
                            method: payment.method,
                            amount: payment.amount,
                            reference: payment.reference,
                            status: 'COMPLETED',
                        },
                    });
                }
                const paidAmount = dto.payments.reduce((sum, payment) => sum + payment.amount, 0);
                await tx.sale.update({
                    where: { id: createdSale.id },
                    data: {
                        paidAmount,
                    },
                });
            }
            return tx.sale.findUniqueOrThrow({
                where: { id: createdSale.id },
                include: {
                    items: true,
                    payments: true,
                    customer: true,
                },
            });
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'SALE_CREATED',
            entity: 'Sale',
            entityId: sale.id,
            metadata: {
                entityName: `Sale #${sale.id}`,
            },
        });
        return sale;
    }
    async findOne(tenantId, id, branchId) {
        const sale = await this.prisma.sale.findFirst({
            where: {
                id,
                tenantId,
                branchId,
            },
            include: {
                items: {
                    include: {
                        product: true,
                        productVariant: true,
                    },
                },
                payments: true,
                customer: true,
            },
        });
        if (!sale) {
            throw new common_1.NotFoundException('Sale not found');
        }
        return sale;
    }
    async findAll(tenantId, branchId, query) {
        const page = query?.page || 1;
        const limit = query?.limit || 15;
        const skip = (page - 1) * limit;
        const status = query?.status;
        const where = {
            tenantId,
            ...(branchId && { branchId }),
            ...(status && { status }),
        };
        const [sales, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    customer: true,
                    payments: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.sale.count({ where }),
        ]);
        return {
            data: sales,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async addItem(context, saleId, dto) {
        const sale = await this.findOne(context.tenantId, saleId, context.branchId);
        this.ensureEditableSale(sale.status);
        const itemDraft = await this.buildSaleItemDraft(context.tenantId, dto, sale.taxRateOverride ? Number(sale.taxRateOverride) : undefined);
        const updatedSale = await this.prisma.$transaction(async (tx) => {
            await tx.saleItem.create({
                data: {
                    saleId,
                    ...itemDraft,
                },
            });
            return this.recalculateSaleTotals(tx, context.tenantId, saleId);
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'SALE_ITEM_ADDED',
            entity: 'Sale',
            entityId: saleId,
            metadata: {
                entityName: `Sale #${saleId}`,
                productId: dto.productId,
                productVariantId: dto.productVariantId ?? null,
                quantity: dto.quantity,
            },
        });
        return updatedSale;
    }
    async removeItem(context, saleId, saleItemId) {
        const sale = await this.findOne(context.tenantId, saleId, context.branchId);
        this.ensureEditableSale(sale.status);
        const existingItem = sale.items.find(item => item.id === saleItemId);
        if (!existingItem) {
            throw new common_1.NotFoundException('Sale item not found');
        }
        const updatedSale = await this.prisma.$transaction(async (tx) => {
            await tx.saleItem.delete({
                where: {
                    id: saleItemId,
                },
            });
            const remainingCount = await tx.saleItem.count({
                where: {
                    saleId,
                },
            });
            if (remainingCount === 0) {
                throw new common_1.BadRequestException('A sale must contain at least one item');
            }
            return this.recalculateSaleTotals(tx, context.tenantId, saleId);
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'SALE_ITEM_REMOVED',
            entity: 'Sale',
            entityId: saleId,
            metadata: {
                entityName: `Sale #${saleId}`,
                saleItemId,
            },
        });
        return updatedSale;
    }
    async updateItem(context, saleId, itemId, dto) {
        const sale = await this.findOne(context.tenantId, saleId, context.branchId);
        this.ensureEditableSale(sale.status);
        const existingItem = sale.items.find(item => item.id === itemId);
        if (!existingItem) {
            throw new common_1.NotFoundException('Sale item not found');
        }
        const updatedSale = await this.prisma.$transaction(async (tx) => {
            await tx.saleItem.update({
                where: {
                    id: itemId,
                },
                data: {
                    quantity: dto.quantity,
                    price: dto.price !== undefined ? dto.price : existingItem.price,
                    discountAmount: dto.discountAmount !== undefined ? dto.discountAmount : existingItem.discountAmount,
                },
            });
            return this.recalculateSaleTotals(tx, context.tenantId, saleId);
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'SALE_ITEM_UPDATED',
            entity: 'Sale',
            entityId: saleId,
            metadata: {
                entityName: `Sale #${saleId}`,
                saleItemId: itemId,
                newQuantity: dto.quantity,
            },
        });
        return updatedSale;
    }
    async addPayment(context, saleId, dto) {
        const sale = await this.findOne(context.tenantId, saleId, context.branchId);
        this.ensureEditableSale(sale.status);
        const currentPaid = Number(sale.paidAmount || 0);
        const total = Number(sale.totalAmount);
        const paymentAmount = Number(dto.amount);
        if (currentPaid + paymentAmount > total) {
            throw new common_1.BadRequestException('Payment amount exceeds sale total');
        }
        const payment = await this.prisma.payment.create({
            data: {
                tenantId: context.tenantId,
                saleId,
                method: dto.method,
                amount: dto.amount,
                reference: dto.reference,
                direction: 'SALE',
            },
        });
        const newPaidAmount = currentPaid + paymentAmount;
        const status = newPaidAmount >= total ? client_1.SaleStatus.COMPLETED : sale.status;
        const updatedSale = await this.prisma.sale.update({
            where: { id: saleId },
            data: {
                paidAmount: newPaidAmount,
                status,
                ...(status === client_1.SaleStatus.COMPLETED && { completedAt: new Date() }),
            },
            include: {
                items: {
                    include: {
                        product: true,
                        productVariant: true,
                    },
                },
                payments: true,
                customer: true,
            },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'PAYMENT_ADDED',
            entity: 'Sale',
            entityId: saleId,
            metadata: {
                entityName: `Sale #${saleId}`,
                paymentId: payment.id,
                amount: paymentAmount,
                method: dto.method,
            },
        });
        return updatedSale;
    }
    async hold(context, id) {
        const sale = await this.findOne(context.tenantId, id, context.branchId);
        if (sale.status !== client_1.SaleStatus.OPEN) {
            throw new common_1.BadRequestException('Only open sales can be held');
        }
        return this.updateStatus(context, id, client_1.SaleStatus.HELD, 'SALE_HELD', {
            heldAt: new Date(),
        });
    }
    async resume(context, id) {
        const sale = await this.findOne(context.tenantId, id, context.branchId);
        if (sale.status !== client_1.SaleStatus.HELD) {
            throw new common_1.BadRequestException('Only held sales can be resumed');
        }
        return this.updateStatus(context, id, client_1.SaleStatus.OPEN, 'SALE_RESUMED', {
            heldAt: null,
        });
    }
    async cancel(context, id) {
        const sale = await this.findOne(context.tenantId, id, context.branchId);
        if (sale.status === client_1.SaleStatus.COMPLETED || sale.status === client_1.SaleStatus.REFUNDED) {
            throw new common_1.BadRequestException('Completed sales cannot be cancelled');
        }
        return this.updateStatus(context, id, client_1.SaleStatus.CANCELLED, 'SALE_CANCELLED', {
            cancelledAt: new Date(),
        });
    }
    async complete(context, id, dto) {
        const result = await this.prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findFirst({
                where: {
                    id,
                    tenantId: context.tenantId,
                    branchId: context.branchId,
                },
                include: {
                    items: true,
                    payments: true,
                },
            });
            if (!sale) {
                throw new common_1.NotFoundException('Sale not found');
            }
            const completableStatuses = [client_1.SaleStatus.OPEN, client_1.SaleStatus.HELD];
            if (!completableStatuses.includes(sale.status)) {
                throw new common_1.BadRequestException('Only open or held sales can be completed');
            }
            for (const item of sale.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    include: {
                        compositeParent: true,
                    },
                });
                if (!product) {
                    throw new common_1.NotFoundException(`Product ${item.productId} not found`);
                }
                if (product.type === 'COMPOSITE' && product.compositeParent.length > 0) {
                    for (const component of product.compositeParent) {
                        const componentInventory = await this.lockInventoryRow(tx, context.tenantId, component.childProductId, null);
                        const totalToDeduct = new client_1.Prisma.Decimal(component.quantity).mul(item.quantity);
                        const nextQuantity = new client_1.Prisma.Decimal(componentInventory.quantity).sub(totalToDeduct);
                        if (nextQuantity.lessThan(0)) {
                            throw new common_1.ConflictException(`Insufficient stock for component. Need ${totalToDeduct}, have ${componentInventory.quantity}`);
                        }
                        await tx.inventory.update({
                            where: { id: componentInventory.id },
                            data: {
                                quantity: nextQuantity,
                            },
                        });
                        await tx.inventoryTransaction.create({
                            data: {
                                tenantId: context.tenantId,
                                productId: component.childProductId,
                                type: client_1.InventoryTransactionType.SALE,
                                quantity: totalToDeduct.mul(-1),
                                balanceAfter: nextQuantity,
                                referenceType: 'sale',
                                referenceId: sale.id,
                                note: `Component of composite product ${product.id}`,
                            },
                        });
                    }
                }
                else {
                    const inventory = await this.lockInventoryRow(tx, context.tenantId, item.productId, item.productVariantId);
                    const nextQuantity = new client_1.Prisma.Decimal(inventory.quantity).sub(item.quantity);
                    if (nextQuantity.lessThan(0)) {
                        throw new common_1.ConflictException(`Insufficient stock for product ${item.productId}`);
                    }
                    await tx.inventory.update({
                        where: { id: inventory.id },
                        data: {
                            quantity: nextQuantity,
                        },
                    });
                    await tx.inventoryTransaction.create({
                        data: {
                            tenantId: context.tenantId,
                            productId: item.productId,
                            productVariantId: item.productVariantId,
                            type: client_1.InventoryTransactionType.SALE,
                            quantity: new client_1.Prisma.Decimal(item.quantity).mul(-1),
                            balanceAfter: nextQuantity,
                            referenceType: 'sale',
                            referenceId: sale.id,
                        },
                    });
                }
            }
            if (dto.payments?.length) {
                for (const payment of dto.payments) {
                    if (payment.method === 'STORE_CREDIT' && sale.customerId) {
                        const customer = await tx.customer.findUnique({
                            where: { id: sale.customerId },
                        });
                        if (!customer) {
                            throw new common_1.NotFoundException('Customer not found for credit payment');
                        }
                        if (new client_1.Prisma.Decimal(customer.creditBalance).lessThan(payment.amount)) {
                            throw new common_1.BadRequestException('Insufficient store credit balance');
                        }
                        const newBalance = new client_1.Prisma.Decimal(customer.creditBalance).sub(payment.amount);
                        await tx.customer.update({
                            where: { id: sale.customerId },
                            data: { creditBalance: newBalance },
                        });
                        await tx.creditTransaction.create({
                            data: {
                                tenantId: context.tenantId,
                                customerId: sale.customerId,
                                amount: new client_1.Prisma.Decimal(payment.amount),
                                balanceAfter: newBalance,
                                type: 'DEBIT',
                                referenceType: 'sale',
                                referenceId: sale.id,
                                note: `Payment for sale ${sale.saleNumber}`,
                            },
                        });
                    }
                    await tx.payment.create({
                        data: {
                            tenantId: context.tenantId,
                            saleId: sale.id,
                            method: payment.method,
                            amount: payment.amount,
                            reference: payment.reference,
                            status: 'COMPLETED',
                        },
                    });
                }
            }
            const totalPaid = await tx.payment.aggregate({
                where: {
                    saleId: sale.id,
                    tenantId: context.tenantId,
                    direction: client_1.PaymentDirection.SALE,
                },
                _sum: {
                    amount: true,
                },
            });
            if (Number(totalPaid._sum.amount ?? 0) > Number(sale.totalAmount)) {
                throw new common_1.BadRequestException('Payments cannot exceed the sale total');
            }
            const updatedSale = await tx.sale.update({
                where: { id: sale.id },
                data: {
                    status: client_1.SaleStatus.COMPLETED,
                    completedAt: new Date(),
                    paidAmount: totalPaid._sum.amount ?? 0,
                },
                include: {
                    items: true,
                    payments: true,
                    customer: true,
                },
            });
            console.log(`[DEBUG] Sale ${id} status updated to: ${updatedSale.status}`);
            return updatedSale;
        });
        console.log(`[DEBUG] Transaction committed. Final status: ${result.status}`);
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'SALE_COMPLETED',
            entity: 'Sale',
            entityId: id,
            metadata: {
                entityName: `Sale #${id}`,
                paymentCount: dto.payments?.length ?? 0,
                finalStatus: result.status,
            },
        });
        return result;
    }
    async refund(context, id, dto) {
        const result = await this.prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findFirst({
                where: {
                    id,
                    tenantId: context.tenantId,
                    branchId: context.branchId,
                },
                include: {
                    items: true,
                    payments: true,
                },
            });
            if (!sale) {
                throw new common_1.NotFoundException('Sale not found');
            }
            if (sale.status !== client_1.SaleStatus.COMPLETED) {
                throw new common_1.BadRequestException('Only completed sales can be refunded');
            }
            const refundItems = await this.resolveRefundItems(tx, sale.items, dto.items);
            const refundTotal = refundItems.reduce((sum, item) => sum + item.refundLineTotal, 0);
            for (const item of refundItems) {
                const inventory = await this.lockInventoryRow(tx, context.tenantId, item.productId, item.productVariantId);
                const nextQuantity = new client_1.Prisma.Decimal(inventory.quantity).add(item.refundQuantity);
                await tx.inventory.update({
                    where: { id: inventory.id },
                    data: {
                        quantity: nextQuantity,
                    },
                });
                await tx.inventoryTransaction.create({
                    data: {
                        tenantId: context.tenantId,
                        productId: item.productId,
                        productVariantId: item.productVariantId,
                        type: client_1.InventoryTransactionType.REFUND,
                        quantity: item.refundQuantity,
                        balanceAfter: nextQuantity,
                        referenceType: 'sale_refund_item',
                        referenceId: item.id,
                        note: dto.reason,
                    },
                });
            }
            const salePayments = sale.payments.filter(entry => entry.direction === client_1.PaymentDirection.SALE);
            const refundRatio = Number(sale.totalAmount) === 0 ? 0 : refundTotal / Number(sale.totalAmount);
            for (const payment of salePayments) {
                const refundAmount = new client_1.Prisma.Decimal(payment.amount).mul(refundRatio);
                if (refundAmount.lessThanOrEqualTo(0)) {
                    continue;
                }
                await tx.payment.create({
                    data: {
                        tenantId: context.tenantId,
                        saleId: sale.id,
                        method: payment.method,
                        amount: refundAmount,
                        direction: client_1.PaymentDirection.REFUND,
                        reference: `refund:${payment.id}`,
                        status: 'COMPLETED',
                    },
                });
            }
            const fullyRefunded = refundItems.length === sale.items.length &&
                refundItems.every(item => Number(item.refundQuantity) === Number(item.quantity));
            return tx.sale.update({
                where: { id: sale.id },
                data: {
                    status: fullyRefunded ? client_1.SaleStatus.REFUNDED : client_1.SaleStatus.COMPLETED,
                    refundedAt: new Date(),
                },
                include: {
                    items: true,
                    payments: true,
                    customer: true,
                },
            });
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'SALE_REFUNDED',
            entity: 'Sale',
            entityId: id,
            metadata: {
                entityName: `Sale #${id}`,
                reason: dto.reason,
            },
        });
        return result;
    }
    async returnExchange(context, id, dto) {
        const result = await this.prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findFirst({
                where: {
                    id,
                    tenantId: context.tenantId,
                    branchId: context.branchId,
                },
                include: {
                    items: true,
                    payments: true,
                    customer: true,
                },
            });
            if (!sale) {
                throw new common_1.NotFoundException('Sale not found');
            }
            if (sale.status !== client_1.SaleStatus.COMPLETED) {
                throw new common_1.BadRequestException('Only completed sales can be returned or exchanged');
            }
            const returnItems = await this.resolveRefundItems(tx, sale.items, dto.returnItems);
            let returnTotal = new client_1.Prisma.Decimal(0);
            let exchangeTotal = new client_1.Prisma.Decimal(0);
            for (const item of returnItems) {
                returnTotal = returnTotal.add(item.refundLineTotal);
                const inventory = await this.lockInventoryRow(tx, context.tenantId, item.productId, item.productVariantId);
                const nextQuantity = new client_1.Prisma.Decimal(inventory.quantity).add(item.refundQuantity);
                await tx.inventory.update({
                    where: { id: inventory.id },
                    data: {
                        quantity: nextQuantity,
                    },
                });
                await tx.inventoryTransaction.create({
                    data: {
                        tenantId: context.tenantId,
                        productId: item.productId,
                        productVariantId: item.productVariantId,
                        type: client_1.InventoryTransactionType.REFUND,
                        quantity: item.refundQuantity,
                        balanceAfter: nextQuantity,
                        referenceType: 'sale_return_item',
                        referenceId: item.id,
                        note: dto.reason,
                    },
                });
            }
            let exchangeSaleId = null;
            if (dto.type !== 'RETURN' && dto.exchangeItems?.length) {
                for (const exchangeItem of dto.exchangeItems) {
                    const product = await tx.product.findUnique({
                        where: { id: exchangeItem.productId },
                        include: {
                            variants: exchangeItem.productVariantId
                                ? {
                                    where: { id: exchangeItem.productVariantId },
                                }
                                : undefined,
                        },
                    });
                    if (!product) {
                        throw new common_1.NotFoundException(`Product ${exchangeItem.productId} not found`);
                    }
                    const price = exchangeItem.productVariantId
                        ? product.variants?.[0]?.price || product.price
                        : product.price;
                    const itemTotal = new client_1.Prisma.Decimal(price).mul(exchangeItem.quantity);
                    exchangeTotal = exchangeTotal.add(itemTotal);
                }
                const saleNumber = await this.generateSaleNumber(tx, context.tenantId);
                const exchangeSale = await tx.sale.create({
                    data: {
                        tenantId: context.tenantId,
                        branchId: context.branchId,
                        customerId: sale.customerId,
                        shiftId: null,
                        saleNumber,
                        status: client_1.SaleStatus.COMPLETED,
                        subtotalAmount: exchangeTotal,
                        discountAmount: new client_1.Prisma.Decimal(0),
                        taxAmount: new client_1.Prisma.Decimal(0),
                        totalAmount: exchangeTotal,
                        paidAmount: exchangeTotal,
                        note: `Exchange from sale ${sale.saleNumber}. ${dto.notes || ''}`,
                        completedAt: new Date(),
                    },
                });
                exchangeSaleId = exchangeSale.id;
                for (const exchangeItem of dto.exchangeItems) {
                    const product = await tx.product.findUnique({
                        where: { id: exchangeItem.productId },
                        include: {
                            variants: exchangeItem.productVariantId
                                ? {
                                    where: { id: exchangeItem.productVariantId },
                                }
                                : undefined,
                        },
                    });
                    const price = exchangeItem.productVariantId
                        ? product?.variants?.[0]?.price || product.price
                        : product?.price;
                    const itemTotal = new client_1.Prisma.Decimal(price).mul(exchangeItem.quantity);
                    await tx.saleItem.create({
                        data: {
                            saleId: exchangeSale.id,
                            productId: exchangeItem.productId,
                            productVariantId: exchangeItem.productVariantId,
                            quantity: new client_1.Prisma.Decimal(exchangeItem.quantity),
                            price: new client_1.Prisma.Decimal(price),
                            taxRate: new client_1.Prisma.Decimal(0),
                            discountAmount: new client_1.Prisma.Decimal(0),
                            taxAmount: new client_1.Prisma.Decimal(0),
                            lineTotal: itemTotal,
                        },
                    });
                    const inventory = await this.lockInventoryRow(tx, context.tenantId, exchangeItem.productId, exchangeItem.productVariantId);
                    const nextQuantity = new client_1.Prisma.Decimal(inventory.quantity).sub(exchangeItem.quantity);
                    await tx.inventory.update({
                        where: { id: inventory.id },
                        data: {
                            quantity: nextQuantity,
                        },
                    });
                    await tx.inventoryTransaction.create({
                        data: {
                            tenantId: context.tenantId,
                            productId: exchangeItem.productId,
                            productVariantId: exchangeItem.productVariantId,
                            type: client_1.InventoryTransactionType.SALE,
                            quantity: new client_1.Prisma.Decimal(exchangeItem.quantity).neg(),
                            balanceAfter: nextQuantity,
                            referenceType: 'sale_exchange_item',
                            referenceId: exchangeSale.id,
                            note: `Exchange from sale ${sale.saleNumber}`,
                        },
                    });
                }
                const difference = exchangeTotal.sub(returnTotal);
                if (difference.greaterThan(0)) {
                    await tx.payment.create({
                        data: {
                            tenantId: context.tenantId,
                            saleId: exchangeSale.id,
                            method: 'CASH',
                            amount: difference,
                            direction: client_1.PaymentDirection.SALE,
                            status: 'COMPLETED',
                            reference: `exchange_payment:${sale.id}`,
                        },
                    });
                }
                else if (difference.lessThan(0)) {
                    await tx.payment.create({
                        data: {
                            tenantId: context.tenantId,
                            saleId: sale.id,
                            method: 'CASH',
                            amount: difference.abs(),
                            direction: client_1.PaymentDirection.REFUND,
                            status: 'COMPLETED',
                            reference: `exchange_refund:${exchangeSale.id}`,
                        },
                    });
                }
            }
            else {
                const salePayments = sale.payments.filter(entry => entry.direction === client_1.PaymentDirection.SALE);
                const refundRatio = Number(sale.totalAmount) === 0 ? 0 : Number(returnTotal) / Number(sale.totalAmount);
                for (const payment of salePayments) {
                    const refundAmount = new client_1.Prisma.Decimal(payment.amount).mul(refundRatio);
                    if (refundAmount.lessThanOrEqualTo(0)) {
                        continue;
                    }
                    await tx.payment.create({
                        data: {
                            tenantId: context.tenantId,
                            saleId: sale.id,
                            method: payment.method,
                            amount: refundAmount,
                            direction: client_1.PaymentDirection.REFUND,
                            reference: `return:${payment.id}`,
                            status: 'COMPLETED',
                        },
                    });
                }
            }
            return {
                originalSale: sale,
                returnTotal,
                exchangeTotal,
                exchangeSaleId,
                difference: exchangeTotal.sub(returnTotal),
            };
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'SALE_RETURN_EXCHANGE',
            entity: 'Sale',
            entityId: id,
            metadata: {
                entityName: `Sale #${id}`,
                type: dto.type,
                reason: dto.reason,
            },
        });
        return result;
    }
    async receipt(context, id) {
        const sale = await this.findOne(context.tenantId, id, context.branchId);
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: context.tenantId },
            select: {
                name: true,
                phone: true,
                email: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                settings: true,
            },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'RECEIPT_REPRINTED',
            entity: 'Sale',
            entityId: id,
            metadata: {
                entityName: `Sale #${id}`,
            },
        });
        return {
            format: '80mm',
            saleId: sale.id,
            saleNumber: sale.saleNumber,
            receiptNumber: sale.saleNumber,
            status: sale.status,
            createdAt: sale.createdAt,
            customer: sale.customer,
            tenant: tenant || {
                name: 'PTLPOS',
                phone: null,
                email: null,
                address: null,
                city: null,
                state: null,
                zipCode: null,
                country: null,
            },
            items: sale.items.map(item => ({
                name: item.product.name,
                variant: item.productVariant?.name ?? null,
                quantity: item.quantity,
                price: item.price,
                unitPrice: item.price,
                total: item.lineTotal,
            })),
            totals: {
                subtotal: sale.subtotalAmount,
                discount: sale.discountAmount,
                tax: sale.taxAmount,
                total: sale.totalAmount,
                paid: sale.paidAmount,
            },
            payments: sale.payments.map(payment => ({
                method: payment.method,
                amount: payment.amount,
                direction: payment.direction,
            })),
        };
    }
    async printableReceipt(context, id) {
        const receipt = await this.receipt(context, id);
        const createdAt = new Date(receipt.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
        const itemsMarkup = receipt.items
            .map(item => `
          <tr>
            <td class="item-name">
              ${this.escapeHtml(item.name)}
              ${item.variant ? `<div class="muted">${this.escapeHtml(item.variant)}</div>` : ''}
            </td>
            <td class="qty">${this.formatReceiptValue(item.quantity)}</td>
            <td class="money">${this.formatCurrency(item.total)}</td>
          </tr>
        `)
            .join('');
        const paymentsMarkup = receipt.payments
            .map(payment => `
          <tr>
            <td>${this.escapeHtml(String(payment.method))}</td>
            <td class="money">${this.formatCurrency(payment.amount)}</td>
          </tr>
        `)
            .join('');
        let businessInfo = '';
        if (receipt.tenant.name) {
            businessInfo += `<div><strong>${this.escapeHtml(receipt.tenant.name)}</strong></div>`;
        }
        if (receipt.tenant.phone) {
            businessInfo += `<div class="muted">${this.escapeHtml(receipt.tenant.phone)}</div>`;
        }
        if (receipt.tenant.address) {
            const addressParts = [
                receipt.tenant.address,
                receipt.tenant.city,
                receipt.tenant.state,
                receipt.tenant.zipCode,
                receipt.tenant.country,
            ].filter(Boolean);
            if (addressParts.length > 0) {
                businessInfo += `<div class="muted">${this.escapeHtml(addressParts.join(', '))}</div>`;
            }
        }
        return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt ${this.escapeHtml(receipt.receiptNumber)}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 16px;
        background: #f3f0ea;
        color: #1f1a17;
        font-family: "Courier New", Courier, monospace;
      }
      .receipt {
        width: 80mm;
        max-width: 100%;
        margin: 0 auto;
        background: #fffdfa;
        border: 1px solid #d9d0c3;
        padding: 14px 12px 18px;
      }
      .center { text-align: center; }
      .muted { color: #74685c; font-size: 12px; }
      .meta, .totals, .payments, .items { width: 100%; border-collapse: collapse; }
      .meta td, .totals td, .payments td, .items td {
        padding: 4px 0;
        vertical-align: top;
        font-size: 12px;
      }
      .items { margin-top: 8px; }
      .items td { border-top: 1px dashed #c8bfb2; }
      .item-name { width: 60%; padding-right: 8px; }
      .qty { width: 12%; text-align: center; }
      .money { width: 28%; text-align: right; white-space: nowrap; }
      .totals td:first-child, .payments td:first-child { padding-right: 8px; }
      .total-row td {
        border-top: 1px solid #1f1a17;
        font-weight: 700;
        padding-top: 6px;
      }
      .divider {
        margin: 10px 0;
        border-top: 1px dashed #c8bfb2;
      }
      @media print {
        body { background: #fff; padding: 0; }
        .receipt { border: 0; width: auto; max-width: none; margin: 0; }
      }
    </style>
  </head>
  <body>
    <main class="receipt">
      <section class="center">
        ${businessInfo || '<div><strong>PTLPOS RECEIPT</strong></div>'}
        <div class="muted">Receipt ${this.escapeHtml(receipt.receiptNumber)}</div>
        <div class="muted">${this.escapeHtml(createdAt)}</div>
      </section>
      <div class="divider"></div>
      <table class="meta">
        <tr>
          <td>Status</td>
          <td class="money">${this.escapeHtml(String(receipt.status))}</td>
        </tr>
        <tr>
          <td>Customer</td>
          <td class="money">${this.escapeHtml(receipt.customer?.name ?? 'Walk-in Customer')}</td>
        </tr>
      </table>
      <div class="divider"></div>
      <table class="items">
        <tbody>
          ${itemsMarkup}
        </tbody>
      </table>
      <div class="divider"></div>
      <table class="totals">
        <tr>
          <td>Subtotal</td>
          <td class="money">${this.formatCurrency(receipt.totals.subtotal)}</td>
        </tr>
        <tr>
          <td>Discount</td>
          <td class="money">${this.formatCurrency(receipt.totals.discount)}</td>
        </tr>
        <tr>
          <td>Tax</td>
          <td class="money">${this.formatCurrency(receipt.totals.tax)}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td class="money">${this.formatCurrency(receipt.totals.total)}</td>
        </tr>
        <tr>
          <td>Paid</td>
          <td class="money">${this.formatCurrency(receipt.totals.paid)}</td>
        </tr>
      </table>
      <div class="divider"></div>
      <table class="payments">
        <tbody>
          ${paymentsMarkup}
        </tbody>
      </table>
      <div class="divider"></div>
      <section class="center muted">
        <div>Thank you for your business!</div>
        ${receipt.tenant.email ? `<div>${this.escapeHtml(receipt.tenant.email)}</div>` : ''}
      </section>
    </main>
  </body>
</html>`;
    }
    async receiptPrintJob(context, id) {
        const printable = await this.printableReceipt(context, id);
        return printable.replace('</body>', `    <script>
      window.addEventListener('load', () => {
        window.print();
        window.setTimeout(() => window.close(), 300);
      });
    </script>
  </body>`);
    }
    async buildSaleDraft(tenantId, dto) {
        const items = await Promise.all(dto.items.map(item => this.buildSaleItemDraft(tenantId, item, dto.taxRate)));
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemDiscounts = items.reduce((sum, item) => sum + item.discountAmount, 0);
        const cartDiscount = dto.discountAmount ?? 0;
        const discount = itemDiscounts + cartDiscount;
        const tax = items.reduce((sum, item) => sum + item.taxAmount, 0);
        const total = subtotal - discount + tax;
        return {
            items,
            subtotal,
            discount,
            tax,
            total,
        };
    }
    sumPayments(payments) {
        return (payments ?? []).reduce((sum, payment) => sum + payment.amount, 0);
    }
    ensureEditableSale(status) {
        const editableStatuses = [client_1.SaleStatus.OPEN, client_1.SaleStatus.HELD];
        if (!editableStatuses.includes(status)) {
            throw new common_1.BadRequestException('Only open or held sales can be edited');
        }
    }
    async buildSaleItemDraft(tenantId, item, cartTaxRate) {
        const product = await this.prisma.product.findFirst({
            where: {
                id: item.productId,
                tenantId,
            },
            include: {
                variants: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product ${item.productId} not found`);
        }
        const variant = item.productVariantId
            ? product.variants.find(entry => entry.id === item.productVariantId)
            : undefined;
        if (item.productVariantId && !variant) {
            throw new common_1.NotFoundException(`Variant ${item.productVariantId} not found`);
        }
        return this.calculateSaleItem(product, variant, item, cartTaxRate);
    }
    calculateSaleItem(product, variant, item, cartTaxRate) {
        const unitPrice = item.price ?? Number(variant?.price ?? product.price);
        const lineSubtotal = unitPrice * item.quantity;
        const lineDiscount = item.discountAmount ?? 0;
        const effectiveTaxRate = item.taxRate ?? cartTaxRate ?? Number(product.taxRate);
        if (lineDiscount > lineSubtotal) {
            throw new common_1.BadRequestException('Item discount cannot exceed the line subtotal');
        }
        const taxableBase = lineSubtotal - lineDiscount;
        const lineTax = taxableBase * (effectiveTaxRate / 100);
        const lineTotal = taxableBase + lineTax;
        return {
            productId: item.productId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            price: unitPrice,
            taxRate: effectiveTaxRate,
            discountAmount: lineDiscount,
            taxAmount: lineTax,
            lineTotal,
        };
    }
    async recalculateSaleTotals(tx, tenantId, saleId) {
        const sale = await tx.sale.findFirst({
            where: {
                id: saleId,
                tenantId,
            },
            include: {
                items: true,
            },
        });
        if (!sale) {
            throw new common_1.NotFoundException('Sale not found');
        }
        const subtotal = sale.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
        const discount = sale.items.reduce((sum, item) => sum + Number(item.discountAmount), 0);
        const tax = sale.items.reduce((sum, item) => sum + Number(item.taxAmount), 0);
        const total = subtotal - discount + tax;
        return tx.sale.update({
            where: {
                id: saleId,
            },
            data: {
                subtotalAmount: subtotal,
                discountAmount: discount,
                taxAmount: tax,
                totalAmount: total,
            },
            include: {
                items: {
                    include: {
                        product: true,
                        productVariant: true,
                    },
                },
                payments: true,
                customer: true,
            },
        });
    }
    async resolveRefundItems(tx, saleItems, requestedItems) {
        const selectedItems = requestedItems?.length
            ? saleItems.filter(item => requestedItems.some(requested => requested.saleItemId === item.id))
            : saleItems;
        if (selectedItems.length === 0) {
            throw new common_1.BadRequestException('No refundable sale items were selected');
        }
        const priorRefunds = await tx.inventoryTransaction.findMany({
            where: {
                type: client_1.InventoryTransactionType.REFUND,
                referenceType: 'sale_refund_item',
                referenceId: {
                    in: selectedItems.map(item => item.id),
                },
            },
        });
        const refundedQuantityMap = new Map();
        for (const refund of priorRefunds) {
            refundedQuantityMap.set(refund.referenceId, (refundedQuantityMap.get(refund.referenceId) ?? 0) + Number(refund.quantity));
        }
        return selectedItems.map(item => {
            const requestedQuantity = requestedItems?.find(requested => requested.saleItemId === item.id)?.quantity ??
                Number(item.quantity);
            const alreadyRefundedQuantity = refundedQuantityMap.get(item.id) ?? 0;
            const remainingQuantity = Number(item.quantity) - alreadyRefundedQuantity;
            if (requestedQuantity > remainingQuantity) {
                throw new common_1.BadRequestException(`Refund quantity exceeds remaining quantity for sale item ${item.id}`);
            }
            const refundRatio = requestedQuantity / Number(item.quantity);
            return {
                ...item,
                refundQuantity: requestedQuantity,
                refundLineTotal: Number(item.lineTotal) * refundRatio,
            };
        });
    }
    async updateStatus(context, id, status, auditAction, extra) {
        const sale = await this.prisma.sale.update({
            where: { id },
            data: {
                status,
                ...extra,
            },
            include: {
                items: true,
                payments: true,
                customer: true,
            },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: auditAction,
            entity: 'Sale',
            entityId: id,
            metadata: {
                entityName: `Sale #${id}`,
            },
        });
        return sale;
    }
    async generateSaleNumber(tx, tenantId) {
        const now = new Date();
        const datePart = `${now.getFullYear()}${(now.getMonth() + 1)
            .toString()
            .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(now);
        dayEnd.setHours(23, 59, 59, 999);
        const count = await tx.sale.count({
            where: {
                tenantId,
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
        });
        return `SAL-${datePart}-${String(count + 1).padStart(4, '0')}`;
    }
    async lockInventoryRow(tx, tenantId, productId, productVariantId) {
        const rows = productVariantId
            ? await tx.$queryRaw(client_1.Prisma.sql `
            SELECT id, quantity
            FROM "Inventory"
            WHERE "tenantId" = ${tenantId}
              AND "productId" = ${productId}
              AND "productVariantId" = ${productVariantId}
            FOR UPDATE
          `)
            : await tx.$queryRaw(client_1.Prisma.sql `
            SELECT id, quantity
            FROM "Inventory"
            WHERE "tenantId" = ${tenantId}
              AND "productId" = ${productId}
              AND "productVariantId" IS NULL
            FOR UPDATE
          `);
        const inventory = rows[0];
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory row missing for product ${productId}`);
        }
        return inventory;
    }
    async getReceiptSettings(context) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: context.tenantId },
            select: { settings: true },
        });
        const defaultSettings = {
            showBusinessName: true,
            showPhone: true,
            showAddress: true,
            showEmail: false,
            showReceiptNumber: true,
            showCustomerName: true,
            showCustomerPhone: false,
            showUnitPrice: true,
            customHeader: null,
            customFooter: null,
            showPoweredBy: false,
        };
        const receiptSettings = tenant?.settings?.receiptSettings || {};
        return {
            ...defaultSettings,
            ...receiptSettings,
        };
    }
    async updateReceiptSettings(context, dto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: context.tenantId },
            select: { settings: true },
        });
        const currentSettings = tenant?.settings || {};
        const updatedSettings = {
            ...currentSettings,
            receiptSettings: {
                ...(currentSettings.receiptSettings || {}),
                ...dto,
            },
        };
        await this.prisma.tenant.update({
            where: { id: context.tenantId },
            data: { settings: updatedSettings },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'RECEIPT_SETTINGS_UPDATED',
            entity: 'Tenant',
            entityId: context.tenantId,
            metadata: {
                entityName: 'Tenant Settings',
                ...dto,
            },
        });
        return this.getReceiptSettings(context);
    }
    formatCurrency(value) {
        const amount = value instanceof client_1.Prisma.Decimal ? Number(value.toString()) : Number(value);
        return amount.toFixed(2);
    }
    formatReceiptValue(value) {
        if (value instanceof client_1.Prisma.Decimal) {
            return value.toFixed(2);
        }
        if (typeof value === 'number') {
            return value.toFixed(2);
        }
        return value;
    }
    escapeHtml(value) {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SalesService);
//# sourceMappingURL=sales.service.js.map