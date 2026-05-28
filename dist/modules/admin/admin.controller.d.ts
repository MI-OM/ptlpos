import { AdminService } from './admin.service';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getTenants(page?: number, limit?: number, status?: string, search?: string): Promise<{
        data: ({
            _count: {
                users: number;
                branches: number;
            };
            subscription: {
                plan: {
                    id: string;
                    name: string;
                    description: string | null;
                    price: import("@prisma/client/runtime/library").Decimal;
                    billingCycle: import(".prisma/client").$Enums.BillingCycle;
                    isActive: boolean;
                    limits: import("@prisma/client/runtime/library").JsonValue;
                    features: import("@prisma/client/runtime/library").JsonValue;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                tenantId: string;
                planId: string;
                status: import(".prisma/client").$Enums.SubscriptionStatus;
                startDate: Date;
                endDate: Date | null;
                cancelledAt: Date | null;
                usage: import("@prisma/client/runtime/library").JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            website: string | null;
            logoUrl: string | null;
            industry: string | null;
            isEmailVerified: boolean;
            address: string | null;
            city: string | null;
            state: string | null;
            zipCode: string | null;
            country: string | null;
            status: import(".prisma/client").$Enums.TenantStatus;
            subscriptionId: string | null;
            settings: import("@prisma/client/runtime/library").JsonValue | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getTenant(id: string): Promise<{
        supportTickets: {
            id: string;
            status: import(".prisma/client").$Enums.TicketStatus;
            createdAt: Date;
            subject: string;
            priority: import(".prisma/client").$Enums.TicketPriority;
        }[];
        users: {
            role: {
                id: string;
                name: import(".prisma/client").$Enums.RoleName;
                createdAt: Date;
            };
            name: string;
            id: string;
            email: string;
            status: import(".prisma/client").$Enums.UserStatus;
            lastLoginAt: Date;
            createdAt: Date;
        }[];
        subscription: {
            plan: {
                id: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                billingCycle: import(".prisma/client").$Enums.BillingCycle;
                isActive: boolean;
                limits: import("@prisma/client/runtime/library").JsonValue;
                features: import("@prisma/client/runtime/library").JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            tenantId: string;
            planId: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            startDate: Date;
            endDate: Date | null;
            cancelledAt: Date | null;
            usage: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
        };
        branches: {
            name: string;
            id: string;
            createdAt: Date;
            address: string;
        }[];
    } & {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        website: string | null;
        logoUrl: string | null;
        industry: string | null;
        isEmailVerified: boolean;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        country: string | null;
        status: import(".prisma/client").$Enums.TenantStatus;
        subscriptionId: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateTenantStatus(id: string, updateTenantStatusDto: UpdateTenantStatusDto): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        website: string | null;
        logoUrl: string | null;
        industry: string | null;
        isEmailVerified: boolean;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        country: string | null;
        status: import(".prisma/client").$Enums.TenantStatus;
        subscriptionId: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getTenantUsage(id: string): Promise<{
        currentUsage: {
            _count: {
                users: number;
                products: number;
                customers: number;
                branches: number;
            };
        };
        historicalUsage: {
            id: string;
            tenantId: string;
            metric: string;
            value: number;
            recordedAt: Date;
        }[];
    }>;
    getPlans(): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        billingCycle: import(".prisma/client").$Enums.BillingCycle;
        isActive: boolean;
        limits: import("@prisma/client/runtime/library").JsonValue;
        features: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getPlan(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        billingCycle: import(".prisma/client").$Enums.BillingCycle;
        isActive: boolean;
        limits: import("@prisma/client/runtime/library").JsonValue;
        features: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createPlan(createPlanDto: CreateSubscriptionDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        billingCycle: import(".prisma/client").$Enums.BillingCycle;
        isActive: boolean;
        limits: import("@prisma/client/runtime/library").JsonValue;
        features: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePlan(id: string, updatePlanDto: UpdateSubscriptionDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        billingCycle: import(".prisma/client").$Enums.BillingCycle;
        isActive: boolean;
        limits: import("@prisma/client/runtime/library").JsonValue;
        features: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePlan(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        billingCycle: import(".prisma/client").$Enums.BillingCycle;
        isActive: boolean;
        limits: import("@prisma/client/runtime/library").JsonValue;
        features: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getSubscriptions(page?: number, limit?: number, status?: string): Promise<{
        data: ({
            tenant: {
                name: string;
                id: string;
                email: string;
                status: import(".prisma/client").$Enums.TenantStatus;
            };
            plan: {
                id: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                billingCycle: import(".prisma/client").$Enums.BillingCycle;
                isActive: boolean;
                limits: import("@prisma/client/runtime/library").JsonValue;
                features: import("@prisma/client/runtime/library").JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            tenantId: string;
            planId: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            startDate: Date;
            endDate: Date | null;
            cancelledAt: Date | null;
            usage: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getSubscription(id: string): Promise<{
        tenant: {
            name: string;
            id: string;
            email: string;
            status: import(".prisma/client").$Enums.TenantStatus;
        };
        plan: {
            id: string;
            name: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            billingCycle: import(".prisma/client").$Enums.BillingCycle;
            isActive: boolean;
            limits: import("@prisma/client/runtime/library").JsonValue;
            features: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        tenantId: string;
        planId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        startDate: Date;
        endDate: Date | null;
        cancelledAt: Date | null;
        usage: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changeSubscription(id: string, changeSubscriptionDto: UpdateSubscriptionDto): Promise<{
        id: string;
        tenantId: string;
        planId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        startDate: Date;
        endDate: Date | null;
        cancelledAt: Date | null;
        usage: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    cancelSubscription(id: string): Promise<{
        id: string;
        tenantId: string;
        planId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        startDate: Date;
        endDate: Date | null;
        cancelledAt: Date | null;
        usage: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getTickets(page?: number, limit?: number, status?: string, assignedTo?: string): Promise<{
        data: ({
            tenant: {
                name: string;
                id: string;
            };
            user: {
                name: string;
                id: string;
                email: string;
            };
            assignee: {
                name: string;
                id: string;
                email: string;
            };
            messages: {
                id: string;
                ticketId: string;
                senderId: string;
                content: string;
                isFromAdmin: boolean;
                createdAt: Date;
            }[];
        } & {
            id: string;
            tenantId: string;
            userId: string;
            subject: string;
            description: string;
            status: import(".prisma/client").$Enums.TicketStatus;
            priority: import(".prisma/client").$Enums.TicketPriority;
            category: import(".prisma/client").$Enums.TicketCategory;
            assignedTo: string | null;
            createdAt: Date;
            updatedAt: Date;
            resolvedAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getTicket(id: string): Promise<{
        tenant: {
            name: string;
            id: string;
            email: string;
        };
        user: {
            name: string;
            id: string;
            email: string;
        };
        assignee: {
            name: string;
            id: string;
            email: string;
        };
        messages: ({
            sender: {
                name: string;
                id: string;
                email: string;
            };
        } & {
            id: string;
            ticketId: string;
            senderId: string;
            content: string;
            isFromAdmin: boolean;
            createdAt: Date;
        })[];
    } & {
        id: string;
        tenantId: string;
        userId: string;
        subject: string;
        description: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        priority: import(".prisma/client").$Enums.TicketPriority;
        category: import(".prisma/client").$Enums.TicketCategory;
        assignedTo: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
    }>;
    createTicket(createTicketDto: CreateSupportTicketDto): Promise<{
        tenant: {
            name: string;
            id: string;
        };
        user: {
            name: string;
            id: string;
            email: string;
        };
    } & {
        id: string;
        tenantId: string;
        userId: string;
        subject: string;
        description: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        priority: import(".prisma/client").$Enums.TicketPriority;
        category: import(".prisma/client").$Enums.TicketCategory;
        assignedTo: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
    }>;
    assignTicket(id: string, assignTicketDto: AssignTicketDto): Promise<{
        id: string;
        tenantId: string;
        userId: string;
        subject: string;
        description: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        priority: import(".prisma/client").$Enums.TicketPriority;
        category: import(".prisma/client").$Enums.TicketCategory;
        assignedTo: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
    }>;
    updateTicketStatus(id: string, updateStatusDto: {
        status: string;
        note?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        userId: string;
        subject: string;
        description: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        priority: import(".prisma/client").$Enums.TicketPriority;
        category: import(".prisma/client").$Enums.TicketCategory;
        assignedTo: string | null;
        createdAt: Date;
        updatedAt: Date;
        resolvedAt: Date | null;
    }>;
    getOverview(): Promise<{
        tenants: {
            total: number;
            active: number;
        };
        subscriptions: {
            total: number;
            active: number;
        };
        support: {
            openTickets: number;
        };
        revenue: number;
    }>;
    getUsageAnalytics(period?: string): Promise<(import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UsageMetricsGroupByOutputType, "metric"[]> & {
        _sum: {
            value: number;
        };
    })[]>;
    getRevenueAnalytics(period?: string): Promise<any[]>;
}
