"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const SubscriptionStatus = {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
};
const TenantStatus = {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    DEACTIVATED: 'DEACTIVATED',
    TRIAL: 'TRIAL',
};
const TicketStatus = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED',
    CLOSED: 'CLOSED',
};
const BillingCycle = {
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY',
};
const TicketCategory = {
    BILLING: 'BILLING',
    TECHNICAL: 'TECHNICAL',
    FEATURE_REQUEST: 'FEATURE_REQUEST',
    BUG_REPORT: 'BUG_REPORT',
    ACCOUNT_ISSUE: 'ACCOUNT_ISSUE',
    OTHER: 'OTHER',
};
const TicketPriority = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
};
let AdminService = class AdminService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async getTenants(params) {
        const where = {};
        if (params.status) {
            where.status = params.status;
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
    async getTenant(id) {
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
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async updateTenantStatus(id, updateTenantStatusDto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        const updatedTenant = await this.prisma.tenant.update({
            where: { id },
            data: {
                status: updateTenantStatusDto.status,
            },
        });
        if (updateTenantStatusDto.status === TenantStatus.SUSPENDED) {
            await this.prisma.subscription.update({
                where: { tenantId: id },
                data: { status: SubscriptionStatus.SUSPENDED },
            });
        }
        await this.audit.log({
            tenantId: id,
            userId: null,
            action: 'UPDATE_TENANT_STATUS',
            entity: 'Tenant',
            entityId: id,
            metadata: updateTenantStatusDto,
        });
        return updatedTenant;
    }
    async getTenantUsage(id) {
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
    async getPlans() {
        return this.prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' },
        });
    }
    async getPlan(id) {
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { id },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Subscription plan not found');
        }
        return plan;
    }
    async deletePlan(id) {
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { id },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Subscription plan not found');
        }
        return this.prisma.subscriptionPlan.delete({
            where: { id },
        });
    }
    async createPlan(createPlanDto) {
        return this.prisma.subscriptionPlan.create({
            data: createPlanDto,
        });
    }
    async updatePlan(id, updatePlanDto) {
        return this.prisma.subscriptionPlan.update({
            where: { id },
            data: updatePlanDto,
        });
    }
    async getSubscriptions(params) {
        const where = {};
        if (params.status) {
            where.status = params.status;
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
    async getSubscription(id) {
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
            throw new common_1.NotFoundException('Subscription not found');
        }
        return subscription;
    }
    async changeSubscription(id, changeSubscriptionDto) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        const updatedSubscription = await this.prisma.subscription.update({
            where: { id },
            data: {
                planId: changeSubscriptionDto.planId,
                status: SubscriptionStatus.ACTIVE,
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
            metadata: changeSubscriptionDto,
        });
        return updatedSubscription;
    }
    async cancelSubscription(id) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
            include: { plan: true },
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        if (subscription.status === SubscriptionStatus.CANCELLED) {
            throw new common_1.BadRequestException('Subscription is already cancelled');
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
    async getTickets(params) {
        const where = {};
        if (params.status) {
            where.status = params.status;
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
    async getTicket(id) {
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
            throw new common_1.NotFoundException('Ticket not found');
        }
        return ticket;
    }
    async createTicket(createTicketDto) {
        return this.prisma.supportTicket.create({
            data: {
                ...createTicketDto,
                status: TicketStatus.OPEN,
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
    async assignTicket(id, assignTicketDto) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Ticket not found');
        }
        const updatedTicket = await this.prisma.supportTicket.update({
            where: { id },
            data: {
                assignedTo: assignTicketDto.assignedTo,
                status: TicketStatus.IN_PROGRESS,
            },
        });
        await this.audit.log({
            tenantId: ticket.tenantId,
            userId: null,
            action: 'ASSIGN_TICKET',
            entity: 'SupportTicket',
            entityId: id,
            metadata: assignTicketDto,
        });
        return updatedTicket;
    }
    async updateTicketStatus(id, updateStatusDto) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Ticket not found');
        }
        const updateData = {
            status: updateStatusDto.status,
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
            metadata: updateStatusDto,
        });
        return updatedTicket;
    }
    async getOverview() {
        const [totalTenants, activeTenants, totalSubscriptions, activeSubscriptions, openTickets,] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE } }),
            this.prisma.subscription.count(),
            this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
            this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
        ]);
        const revenueResult = await this.prisma.$queryRaw `
      SELECT COALESCE(SUM(p."price"), 0) as total 
      FROM "Subscription" s 
      JOIN "SubscriptionPlan" p ON s."planId" = p."id"
      WHERE s.status = ${SubscriptionStatus.ACTIVE}::text::"SubscriptionStatus"
    `;
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
    async getUsageAnalytics(period) {
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
    async getRevenueAnalytics(period) {
        const startDate = this.parsePeriod(period);
        const revenueData = await this.prisma.$queryRaw `
      SELECT 
        s."planId",
        COUNT(*) as count,
        COALESCE(SUM(p."price"), 0) as total
      FROM "Subscription" s
      JOIN "SubscriptionPlan" p ON s."planId" = p."id"
      WHERE s."startDate" >= ${startDate}
        AND s.status = ${SubscriptionStatus.ACTIVE}::text::"SubscriptionStatus"
      GROUP BY s."planId"
    `;
        return revenueData;
    }
    parsePeriod(period) {
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AdminService);
//# sourceMappingURL=admin.service.js.map