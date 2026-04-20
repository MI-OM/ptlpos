import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentDirection, PaymentMethod, PaymentStatus, Prisma, SaleStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(context: AuthContext, dto: CreatePaymentDto) {
    const paymentStatus = dto.status ?? PaymentStatus.COMPLETED;

    if (
      paymentStatus !== PaymentStatus.PENDING &&
      paymentStatus !== PaymentStatus.COMPLETED
    ) {
      throw new BadRequestException('Payments can only be created as PENDING or COMPLETED');
    }

    if (
      (dto.method === PaymentMethod.CARD || dto.method === PaymentMethod.TRANSFER) &&
      !dto.externalRef?.trim()
    ) {
      throw new BadRequestException('Card and transfer payments require an external reference');
    }

    if (dto.externalRef?.trim()) {
      const existing = await this.prisma.payment.findFirst({
        where: {
          tenantId: context.tenantId,
          externalRef: dto.externalRef.trim(),
        },
      });

      if (existing) {
        throw new ConflictException('A payment with this external reference already exists');
      }
    }

    const payment = await this.prisma.$transaction(async tx => {
      const sale = await tx.sale.findFirst({
        where: {
          id: dto.saleId,
          tenantId: context.tenantId,
        },
      });

      if (!sale) {
        throw new NotFoundException('Sale not found');
      }

      const saleStatuses: SaleStatus[] = [SaleStatus.CANCELLED, SaleStatus.REFUNDED];
      if (saleStatuses.includes(sale.status)) {
        throw new BadRequestException('Payments cannot be added to cancelled or refunded sales');
      }

      const paidAmountDelta =
        paymentStatus === PaymentStatus.COMPLETED ? new Prisma.Decimal(dto.amount) : new Prisma.Decimal(0);
      const nextPaidAmount = new Prisma.Decimal(sale.paidAmount).add(paidAmountDelta);

      if (nextPaidAmount.greaterThan(sale.totalAmount)) {
        throw new BadRequestException('Payments cannot exceed the sale total');
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
      metadata: dto as unknown as Record<string, unknown>,
    });

    return payment;
  }

  async reconciliation(
    tenantId: string,
    query: {
      from?: string;
      to?: string;
    }
  ) {
    const range =
      query.from || query.to
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

    const methods = Object.values(PaymentMethod).map(method => {
      const saleEntry = grouped.find(
        entry => entry.method === method && entry.direction === PaymentDirection.SALE
      );
      const refundEntry = grouped.find(
        entry => entry.method === method && entry.direction === PaymentDirection.REFUND
      );

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

  async cashDrawerSummary(
    tenantId: string,
    query: {
      from?: string;
      to?: string;
      countedCash?: number;
      branchId?: string;
    }
  ) {
    const range =
      query.from || query.to
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
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
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

    const salesEntry = grouped.find(entry => entry.direction === PaymentDirection.SALE);
    const refundEntry = grouped.find(entry => entry.direction === PaymentDirection.REFUND);

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

  /**
   * Find payments by status (e.g., PENDING, FAILED)
   */
  async findByStatus(tenantId: string, status: PaymentStatus, limit = 50) {
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

  /**
   * Update payment status (e.g., from PENDING to COMPLETED or FAILED)
   */
  async updateStatus(context: AuthContext, paymentId: string, newStatus: PaymentStatus) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId: context.tenantId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === newStatus) {
      return payment;
    }

    const updated = await this.prisma.$transaction(async tx => {
      const existingPayment = await tx.payment.findFirst({
        where: {
          id: paymentId,
          tenantId: context.tenantId,
        },
      });

      if (!existingPayment) {
        throw new NotFoundException('Payment not found');
      }

      if (existingPayment.direction === PaymentDirection.SALE) {
        const wasCompleted = existingPayment.status === PaymentStatus.COMPLETED;
        const willBeCompleted = newStatus === PaymentStatus.COMPLETED;

        if (wasCompleted !== willBeCompleted) {
          const sale = await tx.sale.findFirst({
            where: {
              id: existingPayment.saleId,
              tenantId: context.tenantId,
            },
          });

          if (!sale) {
            throw new NotFoundException('Sale not found');
          }

          const delta = new Prisma.Decimal(existingPayment.amount);
          const nextPaidAmount = wasCompleted
            ? new Prisma.Decimal(sale.paidAmount).sub(delta)
            : new Prisma.Decimal(sale.paidAmount).add(delta);

          if (nextPaidAmount.lessThan(0)) {
            throw new BadRequestException('Sale paid amount cannot go below zero');
          }

          if (nextPaidAmount.greaterThan(sale.totalAmount)) {
            throw new BadRequestException('Payments cannot exceed the sale total');
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
      } as Prisma.JsonObject,
    });

    return updated;
  }
}
