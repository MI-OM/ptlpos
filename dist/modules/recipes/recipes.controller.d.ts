import { AuthContext } from '../../core/types/request-context';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesService } from './recipes.service';
export declare class RecipesController {
    private readonly recipesService;
    constructor(recipesService: RecipesService);
    findAll(user: AuthContext): import(".prisma/client").Prisma.PrismaPromise<({
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
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
                price: import("@prisma/client/runtime/library").Decimal;
                cost: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            recipeId: string;
            rawMaterialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(user: AuthContext, id: string): Promise<{
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
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
                price: import("@prisma/client/runtime/library").Decimal;
                cost: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            recipeId: string;
            rawMaterialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(user: AuthContext, dto: CreateRecipeDto): Promise<{
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
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
                price: import("@prisma/client/runtime/library").Decimal;
                cost: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            recipeId: string;
            rawMaterialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthContext, id: string, dto: UpdateRecipeDto): Promise<{
        product: {
            id: string;
            tenantId: string;
            categoryId: string | null;
            name: string;
            sku: string | null;
            barcode: string | null;
            imageUrl: string | null;
            type: import(".prisma/client").$Enums.ProductType;
            price: import("@prisma/client/runtime/library").Decimal;
            cost: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
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
                price: import("@prisma/client/runtime/library").Decimal;
                cost: import("@prisma/client/runtime/library").Decimal;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            recipeId: string;
            rawMaterialId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        productId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
