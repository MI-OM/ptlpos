import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
interface AuditPayload {
    tenantId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId: string;
    metadata?: Record<string, unknown>;
}
interface AuditQuery {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    entityId?: string;
    userId?: string;
    from?: string;
    to?: string;
}
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(payload: AuditPayload): Promise<void>;
    findAll(tenantId: string, query: AuditQuery): Promise<{
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
            metadata: Prisma.JsonValue;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
}
export {};
