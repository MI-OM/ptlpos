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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const redis_service_1 = require("../../core/database/redis.service");
const audit_service_1 = require("../audit/audit.service");
let CategoriesService = class CategoriesService {
    prisma;
    redis;
    audit;
    constructor(prisma, redis, audit) {
        this.prisma = prisma;
        this.redis = redis;
        this.audit = audit;
    }
    async checkCircularReference(categoryId, newParentId) {
        let currentId = newParentId;
        const visited = new Set();
        while (currentId) {
            if (currentId === categoryId) {
                return true;
            }
            if (visited.has(currentId)) {
                return true;
            }
            visited.add(currentId);
            const parent = await this.prisma.category.findUnique({
                where: { id: currentId },
                select: { parentId: true },
            });
            currentId = parent?.parentId ?? null;
        }
        return false;
    }
    async findAll(tenantId, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const normalizedQuery = query.q?.trim();
        const cacheKey = [
            `tenant:${tenantId}:categories`,
            `page:${page}`,
            `limit:${limit}`,
            `q:${normalizedQuery ?? ''}`,
            `isActive:${query.isActive ?? ''}`,
        ].join(':');
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            isActive: query.isActive,
            name: normalizedQuery
                ? {
                    contains: normalizedQuery,
                    mode: 'insensitive',
                }
                : undefined,
        };
        const [categories, total] = await Promise.all([
            this.prisma.category.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    parent: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            products: true,
                            children: true,
                        },
                    },
                },
            }),
            this.prisma.category.count({ where }),
        ]);
        const result = {
            data: categories,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
        await this.redis.set(cacheKey, JSON.stringify(result), 300);
        return result;
    }
    async findOne(tenantId, id) {
        const category = await this.prisma.category.findFirst({
            where: { id, tenantId },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                children: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                    },
                },
                _count: {
                    select: {
                        products: true,
                        children: true,
                    },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        return category;
    }
    async create(context, dto) {
        const existingCategory = await this.prisma.category.findFirst({
            where: {
                tenantId: context.tenantId,
                name: dto.name,
            },
        });
        if (existingCategory) {
            throw new common_1.ConflictException('Category with this name already exists');
        }
        if (dto.parentId) {
            const parentCategory = await this.prisma.category.findFirst({
                where: {
                    id: dto.parentId,
                    tenantId: context.tenantId,
                },
            });
            if (!parentCategory) {
                throw new common_1.NotFoundException('Parent category not found');
            }
        }
        const category = await this.prisma.category.create({
            data: {
                tenantId: context.tenantId,
                name: dto.name,
                parentId: dto.parentId,
                description: dto.description,
                isActive: dto.isActive ?? true,
            },
        });
        await this.redis.del(`tenant:${context.tenantId}:categories:page:1:limit:20`);
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'CATEGORY_CREATED',
            entity: 'Category',
            entityId: category.id,
            metadata: {
                name: category.name,
            },
        });
        return category;
    }
    async update(context, id, dto) {
        const existingCategory = await this.prisma.category.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
            },
        });
        if (!existingCategory) {
            throw new common_1.NotFoundException('Category not found');
        }
        if (dto.name && dto.name !== existingCategory.name) {
            const nameConflict = await this.prisma.category.findFirst({
                where: {
                    tenantId: context.tenantId,
                    name: dto.name,
                    id: { not: id },
                },
            });
            if (nameConflict) {
                throw new common_1.ConflictException('Category with this name already exists');
            }
        }
        if (dto.parentId !== undefined) {
            if (dto.parentId === id) {
                throw new common_1.BadRequestException('A category cannot be its own parent');
            }
            if (dto.parentId) {
                const parentCategory = await this.prisma.category.findFirst({
                    where: {
                        id: dto.parentId,
                        tenantId: context.tenantId,
                    },
                });
                if (!parentCategory) {
                    throw new common_1.NotFoundException('Parent category not found');
                }
                const isCircular = await this.checkCircularReference(id, dto.parentId);
                if (isCircular) {
                    throw new common_1.BadRequestException('Cannot set parent: would create circular reference');
                }
            }
        }
        const updatedCategory = await this.prisma.category.update({
            where: { id },
            data: {
                name: dto.name,
                parentId: dto.parentId,
                description: dto.description,
                isActive: dto.isActive,
            },
        });
        await this.redis.del(`tenant:${context.tenantId}:categories:page:1:limit:20`);
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'CATEGORY_UPDATED',
            entity: 'Category',
            entityId: updatedCategory.id,
            metadata: {
                changes: dto,
            },
        });
        return updatedCategory;
    }
    async remove(context, id) {
        const existingCategory = await this.prisma.category.findFirst({
            where: {
                id,
                tenantId: context.tenantId,
            },
            include: {
                _count: {
                    select: {
                        products: true,
                        children: true,
                    },
                },
            },
        });
        if (!existingCategory) {
            throw new common_1.NotFoundException('Category not found');
        }
        if (existingCategory._count.products > 0) {
            throw new common_1.BadRequestException('Cannot delete category with associated products');
        }
        if (existingCategory._count.children > 0) {
            throw new common_1.BadRequestException('Cannot delete category with subcategories');
        }
        await this.prisma.category.delete({
            where: { id },
        });
        await this.redis.del(`tenant:${context.tenantId}:categories:page:1:limit:20`);
        await this.audit.log({
            tenantId: context.tenantId,
            userId: context.userId,
            action: 'CATEGORY_DELETED',
            entity: 'Category',
            entityId: id,
        });
        return { success: true };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        audit_service_1.AuditService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map