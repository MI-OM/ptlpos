import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AuditService } from '../audit/audit.service';
// Using string literals instead of Prisma enums to avoid import issues
const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

const TenantStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DEACTIVATED: 'DEACTIVATED',
  TRIAL: 'TRIAL',
} as const;

const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

const BillingCycle = {
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;

const TicketCategory = {
  BILLING: 'BILLING',
  TECHNICAL: 'TECHNICAL',
  FEATURE_REQUEST: 'FEATURE_REQUEST',
  BUG_REPORT: 'BUG_REPORT',
  ACCOUNT_ISSUE: 'ACCOUNT_ISSUE',
  OTHER: 'OTHER',
} as const;

const TicketPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // TENANT MANAGEMENT
  async getTenants(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }) {
    const where: any = {};
    
    if (params.status) {
      where.status = params.status as any;
    }
    
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const skip = (params.page - 1) * params.limit;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: params.limit,
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
          _count: {
            select: {
              users: true,
              branches: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        branches: {
          select: {
            id: true,
            name: true,
            address: true,
            createdAt: true,
          },
          take: 10,
        },
        supportTickets: {
          select: {
            id: true,
            subject: true,
            status: true,
            priority: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateTenantStatus(id: string, updateTenantStatusDto: UpdateTenantStatusDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updatedTenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: updateTenantStatusDto.status as any,
      },
    });

    // Update subscription status if tenant is suspended/deactivated
    if (updateTenantStatusDto.status === TenantStatus.SUSPENDED) {
      await this.prisma.subscription.update({
        where: { tenantId: id },
        data: { status: SubscriptionStatus.SUSPENDED as any },
      });
    }

    await this.audit.log({
      tenantId: id,
      userId: null, // Admin action
      action: 'UPDATE_TENANT_STATUS',
      entity: 'Tenant',
      entityId: id,
      metadata: updateTenantStatusDto as any,
    });

    return updatedTenant;
  }

  async getTenantUsage(id: string) {
    const usage = await this.prisma.usageMetrics.findMany({
      where: { tenantId: id },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });

    const currentUsage = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            users: true,
            branches: true,
            products: true,
            customers: true,
          },
        },
      },
    });

    return {
      currentUsage,
      historicalUsage: usage,
    };
  }

  // SUBSCRIPTION MANAGEMENT
  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async getPlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return this.prisma.subscriptionPlan.delete({
      where: { id },
    });
  }

  async createPlan(createPlanDto: CreateSubscriptionDto) {
    return this.prisma.subscriptionPlan.create({
      data: createPlanDto,
    });
  }

  async updatePlan(id: string, updatePlanDto: UpdateSubscriptionDto) {
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: updatePlanDto,
    });
  }

  async getSubscriptions(params: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const where: any = {};
    
    if (params.status) {
      where.status = params.status as any;
    }

    const skip = (params.page - 1) * params.limit;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: params.limit,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      data: subscriptions,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  async getSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async changeSubscription(id: string, changeSubscriptionDto: UpdateSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        planId: changeSubscriptionDto.planId,
        status: SubscriptionStatus.ACTIVE as any,
        startDate: new Date(),
        endDate: changeSubscriptionDto.endDate,
      },
    });

    await this.audit.log({
      tenantId: subscription.tenantId,
      userId: null,
      action: 'CHANGE_SUBSCRIPTION',
      entity: 'Subscription',
      entityId: id,
      metadata: changeSubscriptionDto as any,
    });

    return updatedSubscription;
  }

  async cancelSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        endDate: new Date(),
      },
    });

    await this.audit.log({
      tenantId: subscription.tenantId,
      userId: null,
      action: 'CANCEL_SUBSCRIPTION',
      entity: 'Subscription',
      entityId: id,
      metadata: {
        planId: subscription.planId,
        planName: subscription.plan?.name,
      },
    });

    return updatedSubscription;
  }

  // SUPPORT SYSTEM
  async getTickets(params: {
    page: number;
    limit: number;
    status?: string;
    assignedTo?: string;
  }) {
    const where: any = {};
    
    if (params.status) {
      where.status = params.status as any;
    }
    
    if (params.assignedTo) {
      where.assignedTo = params.assignedTo;
    }

    const skip = (params.page - 1) * params.limit;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: params.limit,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data: tickets,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  async getTicket(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async createTicket(createTicketDto: CreateSupportTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        ...createTicketDto,
        status: TicketStatus.OPEN as any,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async assignTicket(id: string, assignTicketDto: AssignTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updatedTicket = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        assignedTo: assignTicketDto.assignedTo,
        status: TicketStatus.IN_PROGRESS as any,
      },
    });

    await this.audit.log({
      tenantId: ticket.tenantId,
      userId: null,
      action: 'ASSIGN_TICKET',
      entity: 'SupportTicket',
      entityId: id,
      metadata: assignTicketDto as any,
    });

    return updatedTicket;
  }

  async updateTicketStatus(id: string, updateStatusDto: { status: string; note?: string }) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updateData: any = {
      status: updateStatusDto.status as any,
    };

    if (updateStatusDto.status === TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }

    const updatedTicket = await this.prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    await this.audit.log({
      tenantId: ticket.tenantId,
      userId: null,
      action: 'UPDATE_TICKET_STATUS',
      entity: 'SupportTicket',
      entityId: id,
      metadata: updateStatusDto as any,
    });

    return updatedTicket;
  }

  // ANALYTICS
  async getOverview() {
    const [
      totalTenants,
      activeTenants,
      totalSubscriptions,
      activeSubscriptions,
      openTickets,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE as any } }),
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE as any } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN as any } }),
    ]);

    // Get total revenue using raw query to avoid TypeScript issues
    const revenueResult = await this.prisma.$queryRaw`
      SELECT COALESCE(SUM(p."price"), 0) as total 
      FROM "Subscription" s 
      JOIN "SubscriptionPlan" p ON s."planId" = p."id"
      WHERE s.status = ${SubscriptionStatus.ACTIVE}::text::"SubscriptionStatus"
    ` as any[];

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
      },
      support: {
        openTickets,
      },
      revenue: Number(revenueResult[0]?.total || 0),
    };
  }

  async getUsageAnalytics(period: string) {
    const startDate = this.parsePeriod(period);

    const usageMetrics = await this.prisma.usageMetrics.groupBy({
      by: ['metric'],
      where: {
        recordedAt: {
          gte: startDate,
        },
      },
      _sum: {
        value: true,
      },
    });

    return usageMetrics;
  }

  async getRevenueAnalytics(period: string) {
    const startDate = this.parsePeriod(period);

    // Use raw query to avoid TypeScript issues
    const revenueData = await this.prisma.$queryRaw`
      SELECT 
        s."planId",
        COUNT(*) as count,
        COALESCE(SUM(p."price"), 0) as total
      FROM "Subscription" s
      JOIN "SubscriptionPlan" p ON s."planId" = p."id"
      WHERE s."startDate" >= ${startDate}
        AND s.status = ${SubscriptionStatus.ACTIVE}::text::"SubscriptionStatus"
      GROUP BY s."planId"
    ` as any[];

    return revenueData;
  }

  private parsePeriod(period: string): Date {
    const now = new Date();
    const match = period.match(/^(\d+)([dwmy])$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      const days = unit === 'd' ? value : unit === 'w' ? value * 7 : unit === 'm' ? value * 30 : value * 365;
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}
