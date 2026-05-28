import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
export declare class InvoicesService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    create(context: AuthContext, dto: CreateInvoiceDto): Promise<{
        id: string;
        saleId: string;
        invoiceNumber: string;
        issuedAt: Date;
        totals: {
            subtotal: Prisma.Decimal;
            discount: Prisma.Decimal;
            tax: Prisma.Decimal;
            total: Prisma.Decimal;
        };
        customer: {
            id: string;
            name: string;
            email?: string | null;
            phone?: string | null;
        };
        items: {
            name: string;
            variant: string;
            quantity: Prisma.Decimal;
            price: Prisma.Decimal;
            discount: Prisma.Decimal;
            tax: Prisma.Decimal;
            total: Prisma.Decimal;
        }[];
        payments: {
            method: string;
            amount: Prisma.Decimal;
            direction: string;
        }[];
    }>;
    findAll(tenantId: string, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            saleId: string;
            invoiceNumber: string;
            issuedAt: Date;
            totals: {
                subtotal: Prisma.Decimal;
                discount: Prisma.Decimal;
                tax: Prisma.Decimal;
                total: Prisma.Decimal;
            };
            customer: {
                id: string;
                name: string;
                email?: string | null;
                phone?: string | null;
            };
            items: {
                name: string;
                variant: string;
                quantity: Prisma.Decimal;
                price: Prisma.Decimal;
                discount: Prisma.Decimal;
                tax: Prisma.Decimal;
                total: Prisma.Decimal;
            }[];
            payments: {
                method: string;
                amount: Prisma.Decimal;
                direction: string;
            }[];
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        saleId: string;
        invoiceNumber: string;
        issuedAt: Date;
        totals: {
            subtotal: Prisma.Decimal;
            discount: Prisma.Decimal;
            tax: Prisma.Decimal;
            total: Prisma.Decimal;
        };
        customer: {
            id: string;
            name: string;
            email?: string | null;
            phone?: string | null;
        };
        items: {
            name: string;
            variant: string;
            quantity: Prisma.Decimal;
            price: Prisma.Decimal;
            discount: Prisma.Decimal;
            tax: Prisma.Decimal;
            total: Prisma.Decimal;
        }[];
        payments: {
            method: string;
            amount: Prisma.Decimal;
            direction: string;
        }[];
    }>;
    private generateInvoiceNumber;
    private toInvoiceResponse;
    generateA4InvoiceHTML(tenantId: string, invoiceId: string): Promise<string>;
    generateInvoicePDF(tenantId: string, invoiceId: string): Promise<Buffer>;
    sendInvoiceEmail(context: AuthContext, invoiceId: string, email?: string): Promise<{
        message: string;
        invoiceId: string;
        recipientEmail: string;
    }>;
}
