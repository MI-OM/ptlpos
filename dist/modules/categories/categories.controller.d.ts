import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { AuthContext } from '../../core/types/request-context';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(user: AuthContext, query: QueryCategoriesDto): Promise<any>;
    findOne(user: AuthContext, id: string): Promise<{
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
    create(user: AuthContext, createCategoryDto: CreateCategoryDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthContext, id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(user: AuthContext, id: string): Promise<{
        success: boolean;
    }>;
}
