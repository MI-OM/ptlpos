import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { ImportProductsDto } from './dto/import-products.dto';
import { ImportCustomersDto } from './dto/import-customers.dto';
import { ImportSuppliersDto } from './dto/import-suppliers.dto';

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bulk import products into inventory
   * This is a placeholder for future bulk data import features
   */
  async importProducts(context: AuthContext, dto: ImportProductsDto) {
    if (!dto.products || dto.products.length === 0) {
      return {
        success: false,
        message: 'No products provided for import',
        importedCount: 0,
        failedCount: 0,
        errors: [],
      };
    }

    const errors: Array<{ rowIndex: number; message: string }> = [];
    let importedCount = 0;

    for (let i = 0; i < dto.products.length; i++) {
      try {
        const product = dto.products[i];

        // Validate required fields
        if (!product.name || !product.sku || !product.price) {
          errors.push({
            rowIndex: i + 1,
            message: 'Missing required fields: name, sku, price',
          });
          continue;
        }

        // Create or update product
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
      } catch (error) {
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

  /**
   * Bulk import customers
   */
  async importCustomers(context: AuthContext, dto: ImportCustomersDto) {
    if (!dto.customers || dto.customers.length === 0) {
      return {
        success: false,
        message: 'No customers provided for import',
        importedCount: 0,
        failedCount: 0,
        errors: [],
      };
    }

    const errors: Array<{ rowIndex: number; message: string }> = [];
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

        // Check for duplicates
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
      } catch (error) {
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

  /**
   * Bulk import suppliers
   */
  async importSuppliers(context: AuthContext, dto: ImportSuppliersDto) {
    if (!dto.suppliers || dto.suppliers.length === 0) {
      return {
        success: false,
        message: 'No suppliers provided for import',
        importedCount: 0,
        failedCount: 0,
        errors: [],
      };
    }

    const errors: Array<{ rowIndex: number; message: string }> = [];
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

        // Check for duplicates
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
      } catch (error) {
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
}
