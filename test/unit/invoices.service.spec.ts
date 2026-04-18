import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentDirection, PaymentMethod, Prisma, SaleStatus } from '@prisma/client';
import { InvoicesService } from 'src/modules/invoices/invoices.service';

describe('InvoicesService', () => {
  const context = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    role: 'ADMIN',
  } as const;

  let prisma: {
    invoice: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    sale: {
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let audit: {
    log: jest.Mock;
  };
  let service: InvoicesService;

  beforeEach(() => {
    prisma = {
      invoice: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      sale: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    audit = {
      log: jest.fn(),
    };

    service = new InvoicesService(prisma as never, audit as never);
  });

  it('returns a single invoice by id', async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: 'invoice-1',
      saleId: 'sale-1',
      invoiceNumber: 'INV-20260417-0001',
      issuedAt: new Date('2026-04-17T10:00:00.000Z'),
      subtotalAmount: new Prisma.Decimal(100),
      discountAmount: new Prisma.Decimal(10),
      taxAmount: new Prisma.Decimal(5),
      totalAmount: new Prisma.Decimal(95),
      sale: {
        id: 'sale-1',
        customer: { id: 'customer-1', name: 'Ada', email: null, phone: null },
        items: [],
        payments: [],
      },
    });

    const result = await service.findOne('tenant-1', 'invoice-1');

    expect(prisma.invoice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'invoice-1',
          tenantId: 'tenant-1',
        },
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'invoice-1',
        invoiceNumber: 'INV-20260417-0001',
      }),
    );
  });

  it('rejects duplicate invoices for the same sale', async () => {
    prisma.invoice.findFirst.mockResolvedValue({ id: 'invoice-1', saleId: 'sale-1' });

    await expect(
      service.create(context, {
        saleId: 'sale-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invoice generation for missing sales', async () => {
    prisma.invoice.findFirst.mockResolvedValue(null);
    prisma.sale.findFirst.mockResolvedValue(null);

    await expect(
      service.create(context, {
        saleId: 'sale-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invoice generation for non-completed sales', async () => {
    prisma.invoice.findFirst.mockResolvedValue(null);
    prisma.sale.findFirst.mockResolvedValue({
      id: 'sale-1',
      status: SaleStatus.OPEN,
    });

    await expect(
      service.create(context, {
        saleId: 'sale-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates an invoice for a completed sale and returns the generated payload', async () => {
    prisma.invoice.findFirst.mockResolvedValue(null);
    prisma.sale.findFirst.mockResolvedValue({
      id: 'sale-1',
      status: SaleStatus.COMPLETED,
      subtotalAmount: new Prisma.Decimal(100),
      discountAmount: new Prisma.Decimal(10),
      taxAmount: new Prisma.Decimal(5),
      totalAmount: new Prisma.Decimal(95),
      customer: { id: 'customer-1', name: 'Ada', email: null, phone: null },
      items: [],
      payments: [],
    });

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        invoice: {
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockResolvedValue({
            id: 'invoice-1',
            saleId: 'sale-1',
            invoiceNumber: 'INV-20260417-0001',
            issuedAt: new Date('2026-04-17T10:00:00.000Z'),
            subtotalAmount: new Prisma.Decimal(100),
            discountAmount: new Prisma.Decimal(10),
            taxAmount: new Prisma.Decimal(5),
            totalAmount: new Prisma.Decimal(95),
            sale: {
              id: 'sale-1',
              customer: { id: 'customer-1', name: 'Ada', email: null, phone: null },
              items: [
                {
                  quantity: new Prisma.Decimal(2),
                  price: new Prisma.Decimal(50),
                  lineTotal: new Prisma.Decimal(95),
                  discountAmount: new Prisma.Decimal(10),
                  taxAmount: new Prisma.Decimal(5),
                  product: { name: 'Bread' },
                  productVariant: null,
                },
              ],
              payments: [
                {
                  method: PaymentMethod.CASH,
                  amount: new Prisma.Decimal(95),
                  direction: PaymentDirection.SALE,
                },
              ],
            },
          }),
        },
      }),
    );

    const result = await service.create(context, { saleId: 'sale-1' });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'invoice-1',
        saleId: 'sale-1',
        invoiceNumber: 'INV-20260417-0001',
        items: [
          expect.objectContaining({
            name: 'Bread',
          }),
        ],
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'INVOICE_CREATED',
        entityId: 'invoice-1',
      }),
    );
  });

  it('returns paginated invoices', async () => {
    prisma.$transaction.mockResolvedValue([
      [
        {
          id: 'invoice-1',
          saleId: 'sale-1',
          invoiceNumber: 'INV-20260417-0001',
          issuedAt: new Date('2026-04-17T10:00:00.000Z'),
          subtotalAmount: new Prisma.Decimal(100),
          discountAmount: new Prisma.Decimal(10),
          taxAmount: new Prisma.Decimal(5),
          totalAmount: new Prisma.Decimal(95),
          sale: {
            id: 'sale-1',
            customer: { id: 'customer-1', name: 'Ada', email: null, phone: null },
            items: [],
            payments: [],
          },
        },
      ],
      1,
    ]);

    const result = await service.findAll('tenant-1', 1, 20);

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        invoiceNumber: 'INV-20260417-0001',
      }),
    );
  });
});
