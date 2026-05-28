import { AuthContext } from '../../core/types/request-context';
import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(user: AuthContext, page?: string, limit?: string, action?: string, entity?: string, entityId?: string, userId?: string, from?: string, to?: string): Promise<{
        data: {
            id: string;
            userId: string;
            userName: string;
            userEmail: string;
            action: string;
            entity: string;
            entityId: string;
            entityName: any;
            timestamp: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
}
