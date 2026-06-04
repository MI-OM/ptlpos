import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { AuditService } from '../audit/audit.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
export declare class RecipesService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(tenantId: string): Prisma.PrismaPromise<({
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: Prisma.Decimal;
            cost: Prisma.Decimal;
            taxRate: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            rawMaterial: {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            recipeId: string;
            rawMaterialId: string;
            quantity: Prisma.Decimal;
        })[];
    } & {
        id: string;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: Prisma.Decimal;
            cost: Prisma.Decimal;
            taxRate: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            rawMaterial: {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            recipeId: string;
            rawMaterialId: string;
            quantity: Prisma.Decimal;
        })[];
    } & {
        id: string;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(context: AuthContext, dto: CreateRecipeDto): Promise<{
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: Prisma.Decimal;
            cost: Prisma.Decimal;
            taxRate: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            rawMaterial: {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            recipeId: string;
            rawMaterialId: string;
            quantity: Prisma.Decimal;
        })[];
    } & {
        id: string;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(context: AuthContext, id: string, dto: UpdateRecipeDto): Promise<{
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: Prisma.Decimal;
            cost: Prisma.Decimal;
            taxRate: Prisma.Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            rawMaterial: {
                id: string;
                tenantId: string;
                categoryId: string | null;
                name: string;
                sku: string | null;
                barcode: string | null;
                imageUrl: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                price: Prisma.Decimal;
                cost: Prisma.Decimal;
                taxRate: Prisma.Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            recipeId: string;
            rawMaterialId: string;
            quantity: Prisma.Decimal;
        })[];
    } & {
        id: string;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private ensureProductsExist;
}
