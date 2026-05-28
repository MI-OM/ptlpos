import { AuthContext } from '../../core/types/request-context';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';
import { Response } from 'express';
export declare class InvoicesController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
    findAll(user: AuthContext, page?: string, limit?: string): Promise<{
        data: {
            id: string;
            saleId: string;
            invoiceNumber: string;
            issuedAt: Date;
            totals: {
                subtotal: import("@prisma/client/runtime/library").Decimal;
                discount: import("@prisma/client/runtime/library").Decimal;
                tax: import("@prisma/client/runtime/library").Decimal;
                total: import("@prisma/client/runtime/library").Decimal;
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
                quantity: import("@prisma/client/runtime/library").Decimal;
                price: import("@prisma/client/runtime/library").Decimal;
                discount: import("@prisma/client/runtime/library").Decimal;
                tax: import("@prisma/client/runtime/library").Decimal;
                total: import("@prisma/client/runtime/library").Decimal;
            }[];
            payments: {
                method: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                direction: string;
            }[];
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    findOne(user: AuthContext, id: string): Promise<{
        id: string;
        saleId: string;
        invoiceNumber: string;
        issuedAt: Date;
        totals: {
            subtotal: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            price: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
        }[];
        payments: {
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            direction: string;
        }[];
    }>;
    create(user: AuthContext, dto: CreateInvoiceDto): Promise<{
        id: string;
        saleId: string;
        invoiceNumber: string;
        issuedAt: Date;
        totals: {
            subtotal: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
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
            quantity: import("@prisma/client/runtime/library").Decimal;
            price: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            tax: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
        }[];
        payments: {
            method: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            direction: string;
        }[];
    }>;
    generateA4Invoice(user: AuthContext, id: string, res: Response): Promise<void>;
    generateInvoicePDF(user: AuthContext, id: string, res: Response): Promise<void>;
    sendInvoice(user: AuthContext, id: string, body?: {
        email?: string;
    }): Promise<{
        message: string;
        invoiceId: string;
        recipientEmail: string;
    }>;
}
