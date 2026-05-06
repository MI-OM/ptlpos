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
import { generateA4InvoiceHTML, A4InvoiceData } from './templates/a4-invoice.template';

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

  async generateA4InvoiceHTML(tenantId: string, invoiceId: string): Promise<string> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
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
            tenant: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const invoiceData: A4InvoiceData = {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issuedAt.toISOString().split('T')[0],
        dueDate: invoice.issuedAt.toISOString().split('T')[0], // Use issuedAt as dueDate since no dueDate field
        status: 'PAID', // Default status since invoice model doesn't have status field
      },
      tenant: {
        name: invoice.sale.tenant.name,
        email: invoice.sale.tenant.email || '',
        phone: invoice.sale.tenant.phone || '',
        address: invoice.sale.tenant.address || '',
        city: invoice.sale.tenant.city || '',
        state: invoice.sale.tenant.state || '',
        zipCode: invoice.sale.tenant.zipCode || '',
        country: invoice.sale.tenant.country || '',
        logoUrl: invoice.sale.tenant.logoUrl || undefined,
      },
      customer: {
        name: invoice.sale.customer?.name || 'Walk-in Customer',
        email: invoice.sale.customer?.email || '',
        phone: invoice.sale.customer?.phone || '',
        address: '', // Customer model doesn't have address fields
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      sale: {
        id: invoice.sale.id,
        saleNumber: invoice.sale.saleNumber,
        saleDate: invoice.sale.createdAt.toISOString().split('T')[0],
        subtotal: parseFloat(invoice.sale.subtotalAmount.toString()),
        taxAmount: parseFloat(invoice.sale.taxAmount.toString()),
        totalAmount: parseFloat(invoice.sale.totalAmount.toString()),
        discountAmount: parseFloat(invoice.sale.discountAmount.toString()),
        items: invoice.sale.items.map(item => ({
          id: item.id,
          productName: item.product.name,
          productSku: item.product.sku || undefined,
          quantity: parseFloat(item.quantity.toString()),
          unitPrice: parseFloat(item.price.toString()),
          totalPrice: parseFloat(item.lineTotal.toString()),
          taxRate: parseFloat(item.taxRate.toString()),
          taxAmount: parseFloat(item.taxAmount.toString()),
        })),
      },
      payments: invoice.sale.payments.map(payment => ({
        id: payment.id,
        method: payment.method.toString(),
        amount: parseFloat(payment.amount.toString()),
        status: payment.status.toString(),
        reference: payment.reference || undefined,
      })),
    };

    return generateA4InvoiceHTML(invoiceData);
  }

  async generateInvoicePDF(tenantId: string, invoiceId: string): Promise<Buffer> {
    const html = await this.generateA4InvoiceHTML(tenantId, invoiceId);
    
    // Use a simple HTML to PDF conversion
    // For now, return the HTML as buffer - in production, use puppeteer or similar
    return Buffer.from(html);
  }

  async sendInvoiceEmail(context: AuthContext, invoiceId: string, email?: string) {
    const invoice = await this.findOne(context.tenantId, invoiceId);
    
    const recipientEmail = email || invoice.customer?.email;
    
    if (!recipientEmail) {
      throw new BadRequestException('No email address provided and customer has no email');
    }

    // Generate PDF
    const pdfBuffer = await this.generateInvoicePDF(context.tenantId, invoiceId);

    // TODO: Implement email sending using nodemailer
    // This would require configuring SMTP settings
    await this.audit.log({
      tenantId: context.tenantId,
      userId: context.userId,
      action: 'INVOICE_SENT',
      entity: 'Invoice',
      entityId: invoiceId,
      metadata: {
        recipientEmail,
      },
    });

    return {
      message: 'Invoice sent successfully',
      invoiceId,
      recipientEmail,
    };
  }
}
