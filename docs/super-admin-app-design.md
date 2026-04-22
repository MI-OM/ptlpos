# Super Admin App Design - Tenant Management & Customer Support

## Overview
A comprehensive super admin application for monitoring tenants, managing subscriptions, and providing customer support with account lifecycle management.

## Architecture Approach

### 1. **Multi-Tier Architecture**
```
Frontend (React Admin Dashboard)
    |
    v
Backend API (NestJS - Admin Module)
    |
    v
Database (PostgreSQL - Extended Schema)
```

### 2. **Core Features**

#### **Tenant Management**
- View all tenants with status (Active, Suspended, Deactivated)
- Tenant analytics and usage metrics
- Bulk operations (suspend, deactivate, export)
- Tenant configuration management

#### **Subscription/Plan Management**
- Multiple plan tiers (Free, Basic, Pro, Enterprise)
- Plan limits enforcement (users, branches, products, etc.)
- Subscription lifecycle management
- Usage tracking and alerts

#### **Customer Support**
- Support ticket system
- Live chat integration
- Knowledge base management
- Customer communication history

#### **Account Management**
- Suspend/Deactivate tenant accounts
- User management across tenants
- Role-based access control
- Audit logging

## Database Schema Design

### **New Models Required**

#### **Subscription Plans**
```prisma
model SubscriptionPlan {
  id          String   @id @default(cuid())
  name        String   // "Free", "Basic", "Pro", "Enterprise"
  description String?
  price       Decimal  @db.Decimal(10, 2)
  billingCycle BillingCycle
  isActive    Boolean  @default(true)
  limits      Json     // { users: 10, branches: 5, products: 1000, ... }
  features    Json     // ["inventory", "reports", "api_access", ... }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  subscriptions Subscription[]
}

enum BillingCycle {
  MONTHLY
  YEARLY
}
```

#### **Tenant Subscriptions**
```prisma
model Subscription {
  id          String           @id @default(cuid())
  tenantId    String           @unique
  planId      String
  status      SubscriptionStatus
  startDate   DateTime
  endDate     DateTime?
  cancelledAt DateTime?
  usage       Json             // Current usage metrics
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  
  tenant      Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  plan        SubscriptionPlan @relation(fields: [planId], references: [id])
  invoices    Invoice[]
  
  @@index([tenantId, status])
}

enum SubscriptionStatus {
  ACTIVE
  SUSPENDED
  CANCELLED
  EXPIRED
}
```

#### **Enhanced Tenant Model**
```prisma
model Tenant {
  id              String            @id @default(cuid())
  name            String
  domain          String?           @unique
  status          TenantStatus      @default(ACTIVE)
  subscriptionId  String?           @unique
  settings        Json?             // Tenant-specific settings
  metadata        Json?             // Additional tenant data
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  subscription    Subscription?     @relation(fields: [subscriptionId], references: [id])
  users           User[]
  // ... existing relations
  
  @@index([status])
  @@index([subscriptionId])
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  DEACTIVATED
  TRIAL
}
```

#### **Support System**
```prisma
model SupportTicket {
  id          String           @id @default(cuid())
  tenantId    String
  userId      String
  subject     String
  description String
  status      TicketStatus     @default(OPEN)
  priority    TicketPriority   @default(MEDIUM)
  category    TicketCategory
  assignedTo  String?          // Admin user ID
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  resolvedAt  DateTime?
  
  tenant      Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignee    User?            @relation("TicketAssignee", fields: [assignedTo], references: [id])
  messages    SupportMessage[]
  
  @@index([tenantId, status])
  @@index([assignedTo, status])
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketCategory {
  BILLING
  TECHNICAL
  FEATURE_REQUEST
  BUG_REPORT
  ACCOUNT_ISSUE
  OTHER
}

model SupportMessage {
  id        String   @id @default(cuid())
  ticketId  String
  senderId  String   // Can be tenant user or admin
  content   String
  isFromAdmin Boolean @default(false)
  createdAt DateTime @default(now())
  
  ticket    SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  sender    User          @relation(fields: [senderId], references: [id])
  
  @@index([ticketId, createdAt])
}
```

#### **Usage Tracking**
```prisma
model UsageMetrics {
  id          String   @id @default(cuid())
  tenantId    String
  metric      String   // "users", "branches", "products", "api_calls"
  value       Int
  recordedAt  DateTime @default(now())
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@unique([tenantId, metric, recordedAt])
  @@index([tenantId, metric])
}
```

#### **Admin Actions Audit**
```prisma
model AdminAuditLog {
  id          String   @id @default(cuid())
  adminId     String
  action      String   // "suspend_tenant", "change_plan", "resolve_ticket"
  targetId    String?  // Target entity ID
  targetType  String?  // "tenant", "user", "subscription"
  details     Json?    // Action details
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  admin       User     @relation(fields: [adminId], references: [id])
  
  @@index([adminId, action])
  @@index([targetType, targetId])
}
```

### **Enhanced User Model**
```prisma
model User {
  id            String    @id @default(cuid())
  tenantId      String
  email         String
  name          String
  role          UserRole
  status        UserStatus @default(ACTIVE)
  lastLoginAt   DateTime?
  // ... existing fields
  
  // New relations
  supportTickets SupportTicket[]      @relation("TicketCreator")
  assignedTickets SupportTicket[]?    @relation("TicketAssignee")
  supportMessages SupportMessage[]
  adminAuditLogs AdminAuditLog[]
  
  @@index([tenantId, status])
  @@index([email])
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}
```

## API Design

### **Admin Authentication**
```typescript
// Admin-only authentication endpoint
POST /api/admin/auth/login
{
  email: string;
  password: string;
}

// Admin JWT with special claims
{
  sub: string;
  email: string;
  role: "SUPER_ADMIN";
  permissions: ["tenant.manage", "support.view", "billing.manage"];
}
```

### **Tenant Management Endpoints**
```typescript
GET    /api/admin/tenants              // List all tenants
GET    /api/admin/tenants/:id         // Get tenant details
PUT    /api/admin/tenants/:id/status  // Suspend/Deactivate
GET    /api/admin/tenants/:id/usage   // Usage metrics
GET    /api/admin/tenants/export       // Export tenant data
```

### **Subscription Management**
```typescript
GET    /api/admin/plans                // List all plans
POST   /api/admin/plans                // Create new plan
PUT    /api/admin/plans/:id            // Update plan
DELETE /api/admin/plans/:id            // Delete plan

GET    /api/admin/subscriptions        // List all subscriptions
PUT    /api/admin/subscriptions/:id     // Change tenant plan
POST   /api/admin/subscriptions/:id/cancel // Cancel subscription
```

### **Support System**
```typescript
GET    /api/admin/tickets              // List support tickets
POST   /api/admin/tickets              // Create ticket (on behalf)
GET    /api/admin/tickets/:id          // Get ticket details
POST   /api/admin/tickets/:id/messages // Add message
PUT    /api/admin/tickets/:id/assign   // Assign ticket
PUT    /api/admin/tickets/:id/status   // Update status
```

### **Usage & Analytics**
```typescript
GET    /api/admin/analytics/overview   // System overview
GET    /api/admin/analytics/tenants    // Tenant analytics
GET    /api/admin/analytics/usage      // Usage metrics
GET    /api/admin/analytics/revenue    // Revenue analytics
```

## Frontend Architecture

### **Tech Stack**
- **Framework:** React 18 with TypeScript
- **UI Library:** Ant Design / Material-UI
- **State Management:** Redux Toolkit
- **Routing:** React Router
- **Charts:** Recharts / Chart.js
- **Real-time:** Socket.io for live updates

### **Dashboard Components**
```typescript
// Main Dashboard Layout
- Overview Cards (Active Tenants, Revenue, Support Tickets)
- Tenant Management Table
- Subscription Analytics
- Support Queue
- System Health Monitor

// Tenant Detail View
- Tenant Information
- Usage Metrics Charts
- Subscription Details
- User Management
- Support History
- Audit Logs
```

## Implementation Phases

### **Phase 1: Core Infrastructure** (Week 1-2)
1. Database schema updates
2. Admin authentication system
3. Basic tenant management
4. Subscription model implementation

### **Phase 2: Management Features** (Week 3-4)
1. Tenant status management
2. Usage tracking system
3. Plan management interface
4. Basic admin dashboard

### **Phase 3: Support System** (Week 5-6)
1. Support ticket system
2. Customer communication
3. Knowledge base
4. Admin collaboration tools

### **Phase 4: Analytics & Reporting** (Week 7-8)
1. Advanced analytics
2. Revenue tracking
3. Usage reports
4. Export functionality

## Security Considerations

### **Access Control**
- Role-based permissions (Super Admin, Support Admin, Billing Admin)
- IP whitelisting for admin access
- Multi-factor authentication
- Session management with auto-timeout

### **Data Protection**
- Encrypted sensitive data
- Audit logging for all admin actions
- Data retention policies
- GDPR compliance features

### **Rate Limiting**
- Strict rate limits on admin endpoints
- DDoS protection
- Brute force protection

## Monitoring & Alerting

### **System Health**
- Database performance monitoring
- API response time tracking
- Error rate monitoring
- Resource usage alerts

### **Business Metrics**
- New tenant signups
- Churn rate tracking
- Revenue metrics
- Support ticket resolution times

## Deployment Strategy

### **Environment Setup**
- Separate admin database (or admin-specific schema)
- Dedicated admin API endpoints
- Isolated admin frontend deployment
- Enhanced security configurations

### **CI/CD Pipeline**
- Separate deployment pipeline for admin app
- Automated testing for admin features
- Security scanning
- Performance testing

This design provides a comprehensive foundation for tenant management, subscription control, and customer support while maintaining security and scalability.
