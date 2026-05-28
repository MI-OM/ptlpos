import { AuthContext } from '../../core/types/request-context';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(user: AuthContext): Promise<{
        customers: number;
        products: number;
        sales: {
            total: number;
            today: number;
        };
        revenue: {
            total: number;
            today: number;
        };
        activeShifts: number;
        lowStockAlerts: number;
    }>;
}
