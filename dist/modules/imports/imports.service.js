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
exports.ImportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
let ImportsService = class ImportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async importProducts(context, dto) {
        if (!dto.products || dto.products.length === 0) {
            return {
                success: false,
                message: 'No products provided for import',
                importedCount: 0,
                failedCount: 0,
                errors: [],
            };
        }
        const errors = [];
        let importedCount = 0;
        for (let i = 0; i < dto.products.length; i++) {
            try {
                const product = dto.products[i];
                if (!product.name || !product.sku || !product.price) {
                    errors.push({
                        rowIndex: i + 1,
                        message: 'Missing required fields: name, sku, price',
                    });
                    continue;
                }
                await this.prisma.product.upsert({
                    where: { tenantId_sku: { tenantId: context.tenantId, sku: product.sku } },
                    update: {
                        name: product.name,
                        price: parseFloat(product.price.toString()),
                        cost: product.cost ? parseFloat(product.cost.toString()) : 0,
                        taxRate: product.taxRate ? parseFloat(product.taxRate.toString()) : 0,
                    },
                    create: {
                        tenantId: context.tenantId,
                        name: product.name,
                        sku: product.sku,
                        price: parseFloat(product.price.toString()),
                        cost: product.cost ? parseFloat(product.cost.toString()) : 0,
                        taxRate: product.taxRate ? parseFloat(product.taxRate.toString()) : 0,
                        type: 'SIMPLE',
                    },
                });
                importedCount++;
            }
            catch (error) {
                errors.push({
                    rowIndex: i + 1,
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return {
            success: errors.length === 0,
            message: `Import completed: ${importedCount} imported, ${errors.length} failed`,
            importedCount,
            failedCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    async importCustomers(context, dto) {
        if (!dto.customers || dto.customers.length === 0) {
            return {
                success: false,
                message: 'No customers provided for import',
                importedCount: 0,
                failedCount: 0,
                errors: [],
            };
        }
        const errors = [];
        let importedCount = 0;
        for (let i = 0; i < dto.customers.length; i++) {
            try {
                const customer = dto.customers[i];
                if (!customer.name) {
                    errors.push({
                        rowIndex: i + 1,
                        message: 'Missing required field: name',
                    });
                    continue;
                }
                const normalizedEmail = customer.email?.trim().toLowerCase();
                const phone = customer.phone?.trim();
                const duplicateEmail = normalizedEmail
                    ? await this.prisma.customer.findFirst({
                        where: {
                            tenantId: context.tenantId,
                            email: normalizedEmail,
                        },
                    })
                    : null;
                const duplicatePhone = phone
                    ? await this.prisma.customer.findFirst({
                        where: {
                            tenantId: context.tenantId,
                            phone,
                        },
                    })
                    : null;
                if (duplicateEmail) {
                    errors.push({
                        rowIndex: i + 1,
                        message: `Customer with email ${normalizedEmail} already exists`,
                    });
                    continue;
                }
                if (duplicatePhone) {
                    errors.push({
                        rowIndex: i + 1,
                        message: `Customer with phone ${phone} already exists`,
                    });
                    continue;
                }
                await this.prisma.customer.create({
                    data: {
                        tenantId: context.tenantId,
                        name: customer.name,
                        email: normalizedEmail,
                        phone,
                    },
                });
                importedCount++;
            }
            catch (error) {
                errors.push({
                    rowIndex: i + 1,
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return {
            success: errors.length === 0,
            message: `Import completed: ${importedCount} imported, ${errors.length} failed`,
            importedCount,
            failedCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    async importSuppliers(context, dto) {
        if (!dto.suppliers || dto.suppliers.length === 0) {
            return {
                success: false,
                message: 'No suppliers provided for import',
                importedCount: 0,
                failedCount: 0,
                errors: [],
            };
        }
        const errors = [];
        let importedCount = 0;
        for (let i = 0; i < dto.suppliers.length; i++) {
            try {
                const supplier = dto.suppliers[i];
                if (!supplier.name) {
                    errors.push({
                        rowIndex: i + 1,
                        message: 'Missing required field: name',
                    });
                    continue;
                }
                const normalizedEmail = supplier.email?.trim().toLowerCase();
                const phone = supplier.phone?.trim();
                const duplicateEmail = normalizedEmail
                    ? await this.prisma.supplier.findFirst({
                        where: {
                            tenantId: context.tenantId,
                            email: normalizedEmail,
                        },
                    })
                    : null;
                const duplicatePhone = phone
                    ? await this.prisma.supplier.findFirst({
                        where: {
                            tenantId: context.tenantId,
                            phone,
                        },
                    })
                    : null;
                if (duplicateEmail) {
                    errors.push({
                        rowIndex: i + 1,
                        message: `Supplier with email ${normalizedEmail} already exists`,
                    });
                    continue;
                }
                if (duplicatePhone) {
                    errors.push({
                        rowIndex: i + 1,
                        message: `Supplier with phone ${phone} already exists`,
                    });
                    continue;
                }
                await this.prisma.supplier.create({
                    data: {
                        tenantId: context.tenantId,
                        name: supplier.name,
                        email: normalizedEmail,
                        phone,
                    },
                });
                importedCount++;
            }
            catch (error) {
                errors.push({
                    rowIndex: i + 1,
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        return {
            success: errors.length === 0,
            message: `Import completed: ${importedCount} imported, ${errors.length} failed`,
            importedCount,
            failedCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
};
exports.ImportsService = ImportsService;
exports.ImportsService = ImportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ImportsService);
//# sourceMappingURL=imports.service.js.map