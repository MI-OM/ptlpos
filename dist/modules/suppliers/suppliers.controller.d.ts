import { AuthContext } from '../../core/types/request-context';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    findAll(user: AuthContext): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        tenantId: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(user: AuthContext, id: string): Promise<{
        id: string;
        tenantId: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(user: AuthContext, dto: CreateSupplierDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthContext, id: string, dto: UpdateSupplierDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(user: AuthContext, id: string): Promise<{
        id: string;
    }>;
}
