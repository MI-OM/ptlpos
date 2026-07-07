import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(
    tenantId: string,
    query: { page: number; limit: number; status?: string },
  ) {
    const page = query.page || 1;
    const limit = query.limit || 15;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      tenantId,
      ...(query.status && { status: query.status as OrderStatus }),
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

  async findOne(tenantId: string, id: string) {
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
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async create(context: AuthContext, dto: CreateOrderDto) {
    const { tenantId, branchId, userId } = context;

    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found');
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
      throw new NotFoundException('One or more products not found');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.generateOrderNumber(tx, tenantId);

      const subtotal = dto.items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        return sum + item.unitPrice * item.quantity;
      }, 0);

      const taxAmount = dto.items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        return sum + item.unitPrice * item.quantity * Number(product!.taxRate) / 100;
      }, 0);

      const total = subtotal + taxAmount;

      return tx.order.create({
        data: {
          tenantId,
          branchId: dto.branchId ?? branchId,
          customerId: dto.customerId,
          orderNumber,
          status: OrderStatus.PENDING,
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
      metadata: { orderNumber: order.orderNumber } as any,
    });

    return order;
  }

  async update(tenantId: string, id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be updated');
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

  async cancel(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === OrderStatus.FULFILLED) {
      throw new BadRequestException('Cannot cancel a fulfilled order');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
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

  async fulfill(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot fulfill a cancelled order');
    }

    if (order.status === OrderStatus.FULFILLED) {
      throw new BadRequestException('Order is already fulfilled');
    }

    const allFulfilled = order.items.every(
      (item) => item.fulfilledQuantity >= item.quantity,
    );
    const status = allFulfilled ? OrderStatus.FULFILLED : OrderStatus.PARTIAL;

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

  private async generateOrderNumber(tx: Prisma.TransactionClient, tenantId: string) {
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
}
