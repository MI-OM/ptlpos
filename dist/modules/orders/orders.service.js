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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let OrdersService = class OrdersService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(tenantId, query) {
        const page = query.page || 1;
        const limit = query.limit || 15;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            ...(query.status && { status: query.status }),
        };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true, sku: true },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);
        return { data, meta: { page, limit, total } };
    }
    async findOne(tenantId, id) {
        const order = await this.prisma.order.findFirst({
            where: { id, tenantId },
            include: {
                customer: true,
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, sku: true },
                        },
                    },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async create(context, dto) {
        const { tenantId, branchId, userId } = context;
        if (dto.customerId) {
            const customer = await this.prisma.customer.findFirst({
                where: { id: dto.customerId, tenantId },
            });
            if (!customer) {
                throw new common_1.NotFoundException('Customer not found');
            }
        }
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                id: { in: dto.items.map((i) => i.productId) },
            },
            select: { id: true, price: true, taxRate: true },
        });
        if (products.length !== dto.items.length) {
            throw new common_1.NotFoundException('One or more products not found');
        }
        const order = await this.prisma.$transaction(async (tx) => {
            const orderNumber = await this.generateOrderNumber(tx, tenantId);
            const subtotal = dto.items.reduce((sum, item) => {
                const product = products.find((p) => p.id === item.productId);
                return sum + item.unitPrice * item.quantity;
            }, 0);
            const taxAmount = dto.items.reduce((sum, item) => {
                const product = products.find((p) => p.id === item.productId);
                return sum + item.unitPrice * item.quantity * Number(product.taxRate) / 100;
            }, 0);
            const total = subtotal + taxAmount;
            return tx.order.create({
                data: {
                    tenantId,
                    branchId: dto.branchId ?? branchId,
                    customerId: dto.customerId,
                    orderNumber,
                    status: client_1.OrderStatus.PENDING,
                    subtotal,
                    taxAmount,
                    total,
                    items: {
                        create: dto.items.map((item) => {
                            const product = products.find((p) => p.id === item.productId);
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                total: item.unitPrice * item.quantity,
                            };
                        }),
                    },
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: { select: { id: true, name: true, sku: true } },
                        },
                    },
                },
            });
        });
        await this.audit.log({
            tenantId,
            userId,
            action: 'ORDER_CREATED',
            entity: 'Order',
            entityId: order.id,
            metadata: { orderNumber: order.orderNumber },
        });
        return order;
    }
    async update(tenantId, id, dto) {
        const order = await this.prisma.order.findFirst({
            where: { id, tenantId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status !== client_1.OrderStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending orders can be updated');
        }
        return this.prisma.$transaction(async (tx) => {
            if (dto.items) {
                await tx.orderItem.deleteMany({ where: { orderId: id } });
            }
            const products = dto.items
                ? await this.prisma.product.findMany({
                    where: {
                        tenantId,
                        id: { in: dto.items.map((i) => i.productId) },
                    },
                    select: { id: true, taxRate: true },
                })
                : [];
            const subtotal = dto.items
                ? dto.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
                : Number(order.subtotal);
            const taxAmount = dto.items
                ? dto.items.reduce((s, i) => {
                    const product = products.find((p) => p.id === i.productId);
                    return s + i.unitPrice * i.quantity * Number(product?.taxRate ?? 0) / 100;
                }, 0)
                : Number(order.taxAmount);
            const total = subtotal + taxAmount;
            return tx.order.update({
                where: { id },
                data: {
                    customerId: dto.customerId ?? order.customerId,
                    ...(dto.items && { subtotal, taxAmount, total }),
                    items: dto.items
                        ? {
                            create: dto.items.map((item) => ({
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                total: item.unitPrice * item.quantity,
                            })),
                        }
                        : undefined,
                },
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: { select: { id: true, name: true, sku: true } },
                        },
                    },
                },
            });
        });
    }
    async cancel(tenantId, id) {
        const order = await this.prisma.order.findFirst({
            where: { id, tenantId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status === client_1.OrderStatus.CANCELLED) {
            throw new common_1.BadRequestException('Order is already cancelled');
        }
        if (order.status === client_1.OrderStatus.FULFILLED) {
            throw new common_1.BadRequestException('Cannot cancel a fulfilled order');
        }
        return this.prisma.order.update({
            where: { id },
            data: { status: client_1.OrderStatus.CANCELLED },
            include: {
                customer: true,
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } },
                    },
                },
            },
        });
    }
    async fulfill(tenantId, id) {
        const order = await this.prisma.order.findFirst({
            where: { id, tenantId },
            include: { items: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status === client_1.OrderStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot fulfill a cancelled order');
        }
        if (order.status === client_1.OrderStatus.FULFILLED) {
            throw new common_1.BadRequestException('Order is already fulfilled');
        }
        const allFulfilled = order.items.every((item) => item.fulfilledQuantity >= item.quantity);
        const status = allFulfilled ? client_1.OrderStatus.FULFILLED : client_1.OrderStatus.PARTIAL;
        return this.prisma.order.update({
            where: { id },
            data: {
                status,
                items: {
                    updateMany: {
                        where: { orderId: id },
                        data: { fulfilledQuantity: { increment: 1 } },
                    },
                },
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } },
                    },
                },
            },
        });
    }
    async generateOrderNumber(tx, tenantId) {
        const now = new Date();
        const datePart = `${now.getFullYear()}${(now.getMonth() + 1)
            .toString()
            .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(now);
        dayEnd.setHours(23, 59, 59, 999);
        const count = await tx.order.count({
            where: {
                tenantId,
                createdAt: { gte: dayStart, lte: dayEnd },
            },
        });
        return `ORD-${datePart}-${(count + 1).toString().padStart(4, '0')}`;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map