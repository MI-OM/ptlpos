# PTLPOS System Architecture Documentation

## Overview

PTLPOS is a multi-tenant Point of Sale (POS) and retail management SaaS platform built with modern web technologies. The system provides comprehensive business management capabilities including sales, inventory, customer management, and analytics.

## Technology Stack

### Backend Framework
- **NestJS**: Progressive Node.js framework for building efficient, scalable server-side applications
- **TypeScript**: Type-safe JavaScript for better development experience and maintainability
- **Node.js**: JavaScript runtime for server-side execution

### Database & ORM
- **PostgreSQL**: Primary relational database for data persistence
- **Prisma**: Modern database toolkit and ORM for type-safe database access
- **Prisma Client v5.19.1**: Database client with auto-generated types

### Authentication & Security
- **JWT (JSON Web Tokens)**: Stateless authentication mechanism
- **bcrypt**: Password hashing for security
- **Role-based Access Control (RBAC)**: Fine-grained permissions
- **Passport.js**: Authentication middleware for Node.js

### Additional Technologies
- **Redis**: Caching and session management
- **Nodemailer**: Email service for notifications and verifications
- **Swagger/OpenAPI**: API documentation and testing interface
- **Jest**: Testing framework for unit and integration tests

## System Architecture

### Multi-Tenant Architecture

The system is designed as a multi-tenant SaaS application where each organization (tenant) has completely isolated data:

```
┌─────────────────────────────────────────────────────────────┐
│                Multi-Tenant System                    │
├─────────────────────────────────────────────────────────────┤
│  Tenant A (Company A)  │  Tenant B (Company B)  │
│  ┌─────────────────┐    │  ┌─────────────────┐    │
│  │ Users         │    │  │ Users         │    │
│  │ Products      │    │  │ Products      │    │
│  │ Sales         │    │  │ Sales         │    │
│  │ Inventory     │    │  │ Inventory     │    │
│  └─────────────────┘    │  └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Data Isolation**: Each tenant's data is completely separated using `tenantId` foreign keys
**Security**: Tenants cannot access each other's data under any circumstances
**Scalability**: New tenants can be onboarded without affecting existing ones

### Core Module Structure

```
src/
├── core/                    # Shared core functionality
│   ├── database/            # Database configuration and services
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── redis.module.ts
│   ├── decorators/           # Custom decorators
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── roles.decorator.ts
│   ├── guards/              # Security guards
│   │   ├── jwt-auth.guard.ts
│   │   ├── request-context.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/        # Request/response interceptors
│   │   └── logging.interceptor.ts
│   ├── filters/             # Exception filters
│   │   └── http-exception.filter.ts
│   └── types/               # TypeScript type definitions
│       └── request-context.ts
├── modules/                 # Feature modules
│   ├── auth/               # Authentication & authorization
│   ├── tenants/            # Organization management
│   ├── users/              # User management
│   ├── products/           # Product catalog
│   ├── inventory/          # Stock management
│   ├── sales/              # Sales transactions
│   ├── customers/          # Customer management
│   ├── suppliers/          # Supplier management
│   ├── payments/           # Payment processing
│   ├── analytics/          # Business analytics
│   ├── audit/              # Audit logging
│   └── [other modules...]   # Additional features
├── types/                  # Global type definitions
├── app.module.ts           # Root application module
└── main.ts                # Application entry point
```

## Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                Authentication Flow                  │
├─────────────────────────────────────────────────────────────┤
│                                                 │
│  1. User provides credentials                     │
│     Email: user@company.com                     │
│     Password: ********                            │
│     Tenant ID: tenant-123                      │
│                                                 │
│  2. System validates credentials                   │
│     ✓ Check against database                       │
│     ✓ Verify tenant exists                        │
│                                                 │
│  3. Generate JWT tokens                         │
│     Access Token: 15 minutes                     │
│     Refresh Token: 7 days                        │
│                                                 │
│  4. Return tokens to client                     │
│     Include user info and roles                    │
└─────────────────────────────────────────────────────────────┘
```

### Authorization Model

**Role-Based Access Control (RBAC)**:

```
┌─────────────────────────────────────────────────────────────┐
│                Role Hierarchy                        │
├─────────────────────────────────────────────────────────────┤
│                                                 │
│  ADMIN                                           │
│  ├─ Full access to all features                   │
│  ├─ Can manage users and roles                    │
│  ├─ Can manage system settings                    │
│  └─ Can perform all operations                   │
│                                                 │
│  MANAGER                                         │
│  ├─ Access to most features                       │
│  ├─ Cannot manage users                          │
│  ├─ Can manage inventory and products              │
│  └─ Can view analytics and reports                │
│                                                 │
│  SALES_REP                                      │
│  ├─ Limited to sales operations                   │
│  ├─ Can create and manage sales                   │
│  ├─ Can process payments                       │
│  └─ Cannot access administrative features          │
└─────────────────────────────────────────────────────────────┘
```

### Security Guards Implementation

1. **JwtAuthGuard**: Validates JWT tokens and extracts user context
2. **RequestContextGuard**: Ensures proper authentication context
3. **RolesGuard**: Enforces role-based permissions
4. **Public Decorator**: Bypasses authentication for public endpoints

## Database Architecture

### Schema Design

The database uses a multi-tenant design with the following key entities:

```
┌─────────────────────────────────────────────────────────────┐
│                Database Schema                      │
├─────────────────────────────────────────────────────────────┤
│                                                 │
│  Tenant (Organization)                           │
│  ├─ id, name, email, phone, website             │
│  ├─ address, logoUrl, industry                   │
│  └─ Relations: Users, Products, Sales, etc.     │
│                                                 │
│  User                                            │
│  ├─ id, name, email, passwordHash               │
│  ├─ tenantId, roleId                             │
│  └─ Relations: Audit Logs, Sales                │
│                                                 │
│  Product                                         │
│  ├─ id, name, sku, type, price, cost            │
│  ├─ taxRate, imageUrl, tenantId                   │
│  ├─ Variants (for size/color options)             │
│  └─ Composite Products (bundles)                 │
│                                                 │
│  Inventory                                       │
│  ├─ productId, branchId, quantity                  │
│  ├─ Tracks stock levels by location                │
│  └─ Low stock alerts and adjustments              │
│                                                 │
│  Sale                                            │
│  ├─ saleNumber, status, customerInfo               │
│  ├─ Items, payments, totals                       │
│  └─ Receipt generation and printing               │
│                                                 │
│  [Additional entities...]                          │
│  ├─ Customers, Suppliers, Payments               │
│  ├─ Purchase Orders, Recipes, Production          │
│  └─ Audit Logs, Invoices, Analytics           │
└─────────────────────────────────────────────────────────────┘
```

### Data Relationships

- **One-to-Many**: Tenant → Users, Products, Sales, etc.
- **Many-to-Many**: Products ↔ Sales (through sale items)
- **Polymorphic**: Audit logs can track any entity changes
- **Hierarchical**: Composite products contain simple products

## API Architecture

### RESTful Design

The API follows RESTful principles with consistent patterns:

```
┌─────────────────────────────────────────────────────────────┐
│                API Layer Architecture               │
├─────────────────────────────────────────────────────────────┤
│                                                 │
│  Controllers                                     │
│  ├─ Handle HTTP requests and responses           │
│  ├─ Validate input with DTOs                   │
│  ├─ Apply business logic via services          │
│  └─ Return structured responses                 │
│                                                 │
│  Services                                       │
│  ├─ Business logic implementation               │
│  ├─ Database operations via Prisma             │
│  ├─ External integrations (email, etc.)        │
│  └─ Transaction management                     │
│                                                 │
│  DTOs (Data Transfer Objects)                   │
│  ├─ Input validation with class-validator        │
│  ├─ Type safety with TypeScript              │
│  └─ API documentation with Swagger           │
│                                                 │
│  Interceptors & Guards                           │
│  ├─ Request logging and monitoring             │
│  ├─ Authentication and authorization           │
│  └─ Error handling and formatting             │
└─────────────────────────────────────────────────────────────┘
```

### Request/Response Flow

```
┌─────────────────────────────────────────────────────────────┐
│                Request Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                 │
│  1. Client Request                              │
│     ├─ HTTP Method (GET, POST, etc.)            │
│     ├─ Headers (Authorization, Content-Type)         │
│     └─ Request Body (JSON)                       │
│                                                 │
│  2. Logging Interceptor                          │
│     ├─ Log request details                         │
│     ├─ Add timing metadata                        │
│     └─ Pass to next handler                     │
│                                                 │
│  3. Authentication Guards                         │
│     ├─ JwtAuthGuard validates token               │
│     ├─ RequestContextGuard ensures context       │
│     └─ RolesGuard checks permissions             │
│                                                 │
│  4. Controller Processing                        │
│     ├─ Validate DTOs                             │
│     ├─ Execute business logic                    │
│     └─ Interact with database                  │
│                                                 │
│  5. Response                                    │
│     ├─ Success: Data + HTTP 200/201            │
│     ├─ Error: Error details + HTTP 4xx/5xx       │
│     └─ Logged by interceptor                   │
└─────────────────────────────────────────────────────────────┘
```

## Feature Modules

### Core Business Modules

#### Sales Management
- **Purpose**: Process retail transactions and manage sales lifecycle
- **Features**: Create sales, add/remove items, hold/resume, complete, refund, receipt generation
- **Frontend Integration**: Real-time cart management, payment processing, receipt printing

#### Inventory Management
- **Purpose**: Track stock levels, manage warehouse operations
- **Features**: Stock monitoring, low-stock alerts, transfers, adjustments, stocktakes
- **Frontend Integration**: Live inventory updates, alert notifications, barcode scanning

#### Product Catalog
- **Purpose**: Manage product information and pricing
- **Features**: Simple products, variants, composite bundles, recipe management
- **Frontend Integration**: Product search, categorization, pricing rules, bundle composition

#### Customer Management
- **Purpose**: Maintain customer relationships and purchase history
- **Features**: Customer profiles, contact management, purchase tracking
- **Frontend Integration**: Customer search, loyalty integration, purchase history

#### Analytics & Reporting
- **Purpose**: Provide business insights and performance metrics
- **Features**: Dashboard analytics, sales reports, inventory valuation
- **Frontend Integration**: Real-time dashboards, customizable reports, data visualization

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                Deployment Architecture               │
├─────────────────────────────────────────────────────────────┤
│                                                 │
│  Load Balancer                                  │
│  ├─ Distributes traffic across instances         │
│  └─ Health checks and failover                 │
│                                                 │
│  Application Servers (Node.js)                    │
│  ├─ NestJS application instances               │
│  ├─ Horizontal scaling capability               │
│  └─ Stateless design for scalability          │
│                                                 │
│  Database Cluster                               │
│  ├─ PostgreSQL with connection pooling          │
│  ├─ Read replicas for query performance        │
│  └─ Automated backups and point-in-time     │
│                                                 │
│  Redis Cluster                                  │
│  ├─ Session storage and caching                │
│  ├─ Rate limiting and job queues             │
│  └─ High availability configuration         │
│                                                 │
│  File Storage                                  │
│  ├─ Product images and documents               │
│  ├─ Receipt templates and exports             │
│  └─ CDN distribution for performance           │
└─────────────────────────────────────────────────────────────┘
```

### Environment Configuration

- **Development**: Local development with hot reload
- **Staging**: Production-like environment for testing
- **Production**: Render deployment with optimized configuration

## Performance & Scalability

### Caching Strategy
- **Redis**: Session storage, API response caching
- **Database**: Connection pooling, query optimization
- **Application**: In-memory caching for frequently accessed data

### Scaling Considerations
- **Horizontal**: Add more application instances behind load balancer
- **Database**: Read replicas, connection pooling, sharding potential
- **Multi-tenant**: Natural isolation enables resource allocation per tenant

## Monitoring & Observability

### Logging Strategy
- **Structured Logging**: JSON format with consistent fields
- **Request Tracing**: Start/end timing with user context
- **Error Tracking**: Comprehensive error logging with stack traces
- **Audit Trail**: All business operations logged for compliance

### Health Monitoring
- **Application Health**: `/api/health` endpoint for uptime checks
- **Database Health**: Connection monitoring and query performance
- **External Dependencies**: Email service, Redis connectivity

## Development Workflow

### Code Organization
- **Feature Modules**: Each business domain in separate module
- **Shared Core**: Common functionality in core directory
- **Type Safety**: Comprehensive TypeScript usage
- **Testing**: Unit tests for services, integration tests for APIs

### Quality Assurance
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting standards
- **Husky**: Git hooks for pre-commit checks
- **Jest**: Comprehensive test coverage

## Security Considerations

### Data Protection
- **Encryption**: All sensitive data encrypted at rest
- **Authentication**: JWT tokens with expiration and refresh
- **Authorization**: Role-based access with principle of least privilege
- **Input Validation**: Comprehensive validation on all inputs

### Compliance
- **Audit Logging**: All data modifications tracked
- **Data Isolation**: Complete tenant separation
- **Access Control**: Granular permissions by role and resource
- **Retention**: Configurable data retention policies

## Integration Points

### External Services
- **Email Service**: Nodemailer for transactional emails
- **Payment Gateways**: Extensible payment provider integration
- **File Storage**: Configurable storage for images and documents
- **Analytics**: Optional third-party analytics integration

### API Extensions
- **Webhooks**: Event-driven notifications for external systems
- **Import/Export**: Bulk data operations for integration
- **Custom Fields**: Extensible data models for specific industries
- **Third-party APIs**: Framework for external system integration

This architecture provides a solid foundation for a scalable, secure, and maintainable multi-tenant POS system that can grow with business needs while maintaining data security and performance.
