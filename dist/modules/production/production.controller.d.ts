import { AuthContext } from '../../core/types/request-context';
import { RunProductionDto } from './dto/run-production.dto';
import { ProductionService } from './production.service';
export declare class ProductionController {
    private readonly productionService;
    constructor(productionService: ProductionService);
    run(user: AuthContext, dto: RunProductionDto): Promise<{
        id: string;
        tenantId: string;
        productId: string;
        quantityProduced: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
    }>;
    getOrders(user: AuthContext): Promise<{
        id: string;
        product: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        status: string;
        progress: number;
        startDate: Date;
        expectedDate: Date;
    }[]>;
    getRecipes(user: AuthContext): Promise<{
        id: string;
        productId: string;
        productName: string;
        productSku: string;
        productPrice: number;
        materialCost: number;
        margin: number;
        marginPercent: number;
        materials: {
            materialId: string;
            materialName: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitCost: number | import("@prisma/client/runtime/library").Decimal;
            totalCost: number;
        }[];
    }[]>;
    getMaterials(user: AuthContext): Promise<{
        id: string;
        name: string;
        stock: import("@prisma/client/runtime/library").Decimal;
        unit: string;
        reorderLevel: number;
    }[]>;
    getMachines(user: AuthContext): Promise<{
        id: string;
        name: string;
        status: string;
        uptime: number;
        lastMaintenance: Date;
    }[]>;
}
