import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(payload: AuditPayload): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId: payload.tenantId,
        userId: payload.userId,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId,
        metadata: payload.metadata as Prisma.JsonObject,
      },
    });
  }

  async findAll(tenantId: string, query: AuditQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      action: query.action,
      entity: query.entity,
      entityId: query.entityId,
      userId: query.userId,
      timestamp:
        query.from || query.to
          ? {
              gte: query.from ? new Date(query.from) : undefined,
              lte: query.to ? new Date(query.to) : undefined,
            }
          : undefined,
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({
        where,
      }),
    ]);

    // Transform data to include user-readable information
    const transformedData = data.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || 'Unknown User',
      userEmail: log.user?.email || null,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      entityName: (log.metadata as any)?.entityName || (log.metadata as any)?.name || null,
      timestamp: log.timestamp,
      metadata: log.metadata,
    }));

    return {
      data: transformedData,
      meta: {
        page,
        limit,
        total,
      },
    };
  }
}
