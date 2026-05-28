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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const a4_invoice_template_1 = require("./templates/a4-invoice.template");
let InvoicesService = class InvoicesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(context, dto) {
        const existing = await this.prisma.invoice.findFirst({
            where: {
                tenantId: context.tenantId,
                saleId: dto.saleId,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Invoice already exists for this sale');
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
            throw new common_1.NotFoundException('Sale not found');
        }
        if (sale.status !== client_1.SaleStatus.COMPLETED) {
            throw new common_1.BadRequestException('Only completed sales can be invoiced');
        }
        const invoice = await this.prisma.$transaction(async (tx) => {
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
    async findAll(tenantId, page = 1, limit = 20) {
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
    async findOne(tenantId, id) {
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
            throw new common_1.NotFoundException('Invoice not found');
        }
        return this.toInvoiceResponse(invoice);
    }
    async generateInvoiceNumber(tx, tenantId) {
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
    toInvoiceResponse(invoice) {
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
            items: invoice.sale?.items.map(item => ({
                name: item.product.name,
                variant: item.productVariant?.name ?? null,
                quantity: item.quantity,
                price: item.price,
                discount: item.discountAmount,
                tax: item.taxAmount,
                total: item.lineTotal,
            })) ?? [],
            payments: invoice.sale?.payments.map(payment => ({
                method: payment.method,
                amount: payment.amount,
                direction: payment.direction,
            })) ?? [],
        };
    }
    async generateA4InvoiceHTML(tenantId, invoiceId) {
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
            throw new common_1.NotFoundException('Invoice not found');
        }
        const invoiceData = {
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                issueDate: invoice.issuedAt.toISOString().split('T')[0],
                dueDate: invoice.issuedAt.toISOString().split('T')[0],
                status: 'PAID',
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
                address: '',
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
        return (0, a4_invoice_template_1.generateA4InvoiceHTML)(invoiceData);
    }
    async generateInvoicePDF(tenantId, invoiceId) {
        const html = await this.generateA4InvoiceHTML(tenantId, invoiceId);
        return Buffer.from(html);
    }
    async sendInvoiceEmail(context, invoiceId, email) {
        const invoice = await this.findOne(context.tenantId, invoiceId);
        const recipientEmail = email || invoice.customer?.email;
        if (!recipientEmail) {
            throw new common_1.BadRequestException('No email address provided and customer has no email');
        }
        const pdfBuffer = await this.generateInvoicePDF(context.tenantId, invoiceId);
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
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map