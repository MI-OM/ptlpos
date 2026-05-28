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
exports.RecipesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let RecipesService = class RecipesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    findAll(tenantId) {
        return this.prisma.recipe.findMany({
            where: {
                product: {
                    tenantId,
                },
            },
            include: {
                product: true,
                items: {
                    include: {
                        rawMaterial: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(tenantId, id) {
        const recipe = await this.prisma.recipe.findFirst({
            where: {
                id,
                product: {
                    tenantId,
                },
            },
            include: {
                product: true,
                items: {
                    include: {
                        rawMaterial: true,
                    },
                },
            },
        });
        if (!recipe) {
            throw new common_1.NotFoundException('Recipe not found');
        }
        return recipe;
    }
    async create(context, dto) {
        await this.ensureProductsExist(context.tenantId, dto.productId, dto.items.map(item => item.rawMaterialId));
        const existing = await this.prisma.recipe.findUnique({
            where: {
                productId: dto.productId,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Recipe already exists for this product');
        }
        const recipe = await this.prisma.recipe.create({
            data: {
                productId: dto.productId,
                items: {
                    create: dto.items.map(item => ({
                        rawMaterialId: item.rawMaterialId,
                        quantity: item.quantity,
                    })),
                },
            },
            include: {
                product: true,
                items: {
                    include: {
                        rawMaterial: true,
                    },
                },
            },
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'RECIPE_CREATED',
            entity: 'Recipe',
            entityId: recipe.id,
            metadata: dto,
        });
        return recipe;
    }
    async update(context, id, dto) {
        const existing = await this.findOne(context.tenantId, id);
        const productId = dto.productId ?? existing.productId;
        const rawMaterialIds = dto.items?.map(item => item.rawMaterialId) ?? existing.items.map(item => item.rawMaterialId);
        await this.ensureProductsExist(context.tenantId, productId, rawMaterialIds);
        const recipe = await this.prisma.$transaction(async (tx) => {
            await tx.recipeItem.deleteMany({
                where: {
                    recipeId: id,
                },
            });
            return tx.recipe.update({
                where: {
                    id,
                },
                data: {
                    productId,
                    items: dto.items
                        ? {
                            create: dto.items.map(item => ({
                                rawMaterialId: item.rawMaterialId,
                                quantity: item.quantity,
                            })),
                        }
                        : undefined,
                },
                include: {
                    product: true,
                    items: {
                        include: {
                            rawMaterial: true,
                        },
                    },
                },
            });
        });
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'RECIPE_UPDATED',
            entity: 'Recipe',
            entityId: recipe.id,
            metadata: dto,
        });
        return recipe;
    }
    async ensureProductsExist(tenantId, productId, rawMaterialIds) {
        const requiredIds = Array.from(new Set([productId, ...rawMaterialIds]));
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                id: {
                    in: requiredIds,
                },
            },
            select: {
                id: true,
            },
        });
        if (products.length !== requiredIds.length) {
            throw new common_1.NotFoundException('One or more recipe products were not found');
        }
    }
};
exports.RecipesService = RecipesService;
exports.RecipesService = RecipesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], RecipesService);
//# sourceMappingURL=recipes.service.js.map