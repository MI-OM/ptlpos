import { AuthContext } from '../../core/types/request-context';
import { CreateBranchDto, UpdateBranchDto } from './dto/create-branch.dto';
import { BranchesService } from './branches.service';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    findAll(user: AuthContext): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        country: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(user: AuthContext, id: string): Promise<{
        _count: {
            inventories: number;
            sales: number;
            purchaseOrders: number;
        };
    } & {
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        country: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(user: AuthContext, dto: CreateBranchDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        country: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthContext, id: string, dto: UpdateBranchDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        country: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(user: AuthContext, id: string): Promise<{
        success: boolean;
    }>;
}
