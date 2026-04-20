import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SaleStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(context: AuthContext, dto: CreateInvoiceDto) {
    const existing = await this.prisma.invoice.findFirst({
      where: {
        tenantId: context.tenantId,
        saleId: dto.saleId,
      },
    });

    if (existing) {
      throw new ConflictException('Invoice already exists for this sale');
    }

    const sale = await this.prisma.sale.findFirst({
      where: {
        id: dto.saleId,
        tenantId: context.tenantId,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        payments: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    if (sale.status !== SaleStatus.COMPLETED) {
      throw new BadRequestException('Only completed sales can be invoiced');
    }

    const invoice = await this.prisma.$transaction(async tx => {
      const invoiceNumber = await this.generateInvoiceNumber(tx, context.tenantId);

      return tx.invoice.create({
        data: {
          tenantId: context.tenantId,
          saleId: sale.id,
          invoiceNumber,
          subtotalAmount: sale.subtotalAmount,
          discountAmount: sale.discountAmount,
          taxAmount: sale.taxAmount,
          totalAmount: sale.totalAmount,
        },
        include: {
          sale: {
            include: {
              customer: true,
              items: {
                include: {
                  product: true,
                  productVariant: true,
                },
              },
              payments: true,
            },
          },
        },
      });
    });

    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'INVOICE_CREATED',
      entity: 'Invoice',
      entityId: invoice.id,
      metadata: {
        saleId: dto.saleId,
        note: dto.note,
      },
    });

    return this.toInvoiceResponse(invoice);
  }

  async findAll(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where: {
          tenantId,
        },
        include: {
          sale: {
            include: {
              customer: true,
              items: {
                include: {
                  product: { select: { name: true } },
                  productVariant: { select: { name: true } },
                },
              },
              payments: { select: { method: true, amount: true, direction: true } },
            },
          },
        },
        orderBy: {
          issuedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({
        where: {
          tenantId,
        },
      }),
    ]);

    return {
      data: data.map(invoice => this.toInvoiceResponse(invoice)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        sale: {
          include: {
            customer: true,
            items: {
              include: {
                product: true,
                productVariant: true,
              },
            },
            payments: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.toInvoiceResponse(invoice);
  }

  private async generateInvoiceNumber(tx: Prisma.TransactionClient, tenantId: string) {
    const now = new Date();
    const datePart = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const count = await tx.invoice.count({
      where: {
        tenantId,
        issuedAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    return `INV-${datePart}-${String(count + 1).padStart(4, '0')}`;
  }

  private toInvoiceResponse(invoice: {
    id: string;
    saleId: string;
    invoiceNumber: string;
    issuedAt: Date;
    subtotalAmount: Prisma.Decimal;
    discountAmount: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    sale?: {
      id: string;
      customer: { id: string; name: string; email?: string | null; phone?: string | null } | null;
      items: Array<{
        quantity: Prisma.Decimal;
        price: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        product: { name: string };
        productVariant: { name: string } | null;
      }>;
      payments: Array<{
        method: string;
        amount: Prisma.Decimal;
        direction: string;
      }>;
    };
  }) {
    return {
      id: invoice.id,
      saleId: invoice.saleId,
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      totals: {
        subtotal: invoice.subtotalAmount,
        discount: invoice.discountAmount,
        tax: invoice.taxAmount,
        total: invoice.totalAmount,
      },
      customer: invoice.sale?.customer ?? null,
      items:
        invoice.sale?.items.map(item => ({
          name: item.product.name,
          variant: item.productVariant?.name ?? null,
          quantity: item.quantity,
          price: item.price,
          discount: item.discountAmount,
          tax: item.taxAmount,
          total: item.lineTotal,
        })) ?? [],
      payments:
        invoice.sale?.payments.map(payment => ({
          method: payment.method,
          amount: payment.amount,
          direction: payment.direction,
        })) ?? [],
    };
  }
}
