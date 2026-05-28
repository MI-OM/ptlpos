import { DrawerType } from '@prisma/client';
export declare class OpenShiftDto {
    openingBalance: number;
    drawerType?: DrawerType;
    notes?: string;
}
export declare class CloseShiftDto {
    closingBalance: number;
    notes?: string;
}
export declare class QueryShiftsDto {
    page?: number;
    limit?: number;
    status?: string;
    branchId?: string;
    fromDate?: string;
    toDate?: string;
}
