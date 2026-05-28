import { PrismaService } from '../../core/database/prisma.service';
import { AuthContext } from '../../core/types/request-context';
import { ImportProductsDto } from './dto/import-products.dto';
import { ImportCustomersDto } from './dto/import-customers.dto';
import { ImportSuppliersDto } from './dto/import-suppliers.dto';
export declare class ImportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    importProducts(context: AuthContext, dto: ImportProductsDto): Promise<{
        success: boolean;
        message: string;
        importedCount: number;
        failedCount: number;
        errors: {
            rowIndex: number;
            message: string;
        }[];
    }>;
    importCustomers(context: AuthContext, dto: ImportCustomersDto): Promise<{
        success: boolean;
        message: string;
        importedCount: number;
        failedCount: number;
        errors: {
            rowIndex: number;
            message: string;
        }[];
    }>;
    importSuppliers(context: AuthContext, dto: ImportSuppliersDto): Promise<{
        success: boolean;
        message: string;
        importedCount: number;
        failedCount: number;
        errors: {
            rowIndex: number;
            message: string;
        }[];
    }>;
}
