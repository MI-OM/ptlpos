import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { RedisService } from '../../core/database/redis.service';
import { AuditService } from '../audit/audit.service';
export declare class CategoriesService {
    private readonly prisma;
    private readonly redis;
    private readonly audit;
    constructor(prisma: PrismaService, redis: RedisService, audit: AuditService);
    findAll(tenantId: string, query: QueryCategoriesDto): Promise<any>;
    findOne(tenantId: string, id: string): Promise<{
        _count: {
            products: number;
        };
    } & {
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(context: AuthContext, dto: CreateCategoryDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(context: AuthContext, id: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(context: AuthContext, id: string): Promise<{
        success: boolean;
    }>;
}
