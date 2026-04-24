# PTLPOS API Documentation

## Overview

PTLPOS is a multi-tenant Point of Sale (POS) system built with NestJS and PostgreSQL. The API provides comprehensive functionality for managing sales, inventory, customers, suppliers, and more.

**Base URL**: `https://your-domain.com/api`  
**Authentication**: Bearer Token (JWT)  
**Content-Type**: `application/json`  
**Multi-tenant**: All requests require tenant context (provided via JWT token)

## Authentication

### Overview
PTLPOS supports multiple authentication methods for optimal user experience while maintaining security:

1. **Secure Email-Only Login** (Recommended): `POST /auth/login/email`
   - Users login with just email + password
   - System automatically discovers tenant
   - Best UX for single-tenant users

2. **Traditional Login** (Fallback): `POST /auth/login`
   - Requires email + password + tenant ID
   - For users who know their tenant ID
   - Backward compatibility maintained

All protected endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **SUPER_ADMIN**: Full system administration, tenant management, subscription control
- **ADMIN**: Full access to tenant features
- **MANAGER**: Access to most features except user management
- **SALES_REP**: Limited to sales operations
- **SUPPORT_ADMIN**: Customer support operations and ticket management
- **BILLING_ADMIN**: Subscription and billing management

### Security Features
- **Tenant Isolation**: Strict multi-tenant data separation
- **JWT Tokens**: Stateless authentication with expiration (24 hours)
- **Refresh Tokens**: Secure token renewal without re-login (7 days)
- **Security Logging**: Audit trail for authentication events
- **Email Domain Validation**: Additional security layer for tenant discovery
- **Role-Based Access Control**: Granular permissions by user role

---

## API Endpoints

### Categories (`/api/categories`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/categories` | List all categories with pagination | Yes | Any |
| GET | `/categories/:id` | Get category by ID | Yes | Any |
| POST | `/categories` | Create new category | Yes | ADMIN, MANAGER |
| PATCH | `/categories/:id` | Update category | Yes | ADMIN, MANAGER |
| DELETE | `/categories/:id` | Delete category | Yes | ADMIN |

#### Key Endpoints for Frontend

**List Categories with Filtering**
```http
GET /api/categories?page=1&limit=20&q=electronics&isActive=true
Authorization: Bearer <token>
```

**Create Category**
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "isActive": true
}
```

**Update Category**
```http
PATCH /api/categories/clh7x1q0b0000qa20f0f0f0f0
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Electronics Updated",
  "description": "Updated description",
  "isActive": false
}
```

---

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---------|-----------|-------------|---------------|
| POST | `/auth/register` | Register new organization and create admin user | No |
| POST | `/auth/login` | Login user with tenant ID and get tokens | No |
| POST | `/auth/login/email` | **NEW** Login with email only (auto-discover tenant) | No |
| POST | `/auth/refresh` | **NEW** Refresh access token using refresh token | No |
| GET | `/auth/me` | Get current user profile | Yes |
| POST | `/auth/email/verify-request` | Request email verification | No |
| POST | `/auth/email/verify` | Verify email with token | No |
| POST | `/auth/password/reset-request` | Request password reset | No |
| POST | `/auth/password/reset` | Reset password with token | No |

#### Key Endpoints for Frontend

**Register Organization**
```http
POST /api/auth/register
Content-Type: application/json

{
  "tenant": {
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-800-ACME-123",
    "website": "https://acme.com"
  },
  "user": {
    "name": "John Doe",
    "email": "john@acme.com",
    "password": "securePassword123"
  }
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@acme.com",
  "password": "securePassword123",
  "tenantId": "clh7x1q0a0000qa10f0f0f0f0",
  "saleId": "clh7x1q0b0000qa20f0f0f0f0"
}
```

**Response** (both register and login):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "clh7x1q0b0000qa20f0f0f0f0",
    "tenantId": "clh7x1q0a0000qa10f0f0f0f0",
    "role": "ADMIN",
    "name": "John Doe",
    "email": "john@acme.com"
  }
}
```

**NEW: Secure Email-Only Login**
```http
POST /api/auth/login/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "clh7x1q0b0000qa20f0f0f0f0",
    "tenantId": "clh7x1q0a0000qa10f0f0f0f0",
    "role": "ADMIN",
    "name": "John Doe",
    "email": "john@acme.com"
  },
  "tenant": {
    "id": "clh7x1q0a0000qa10f0f0f0f0",
    "name": "Acme Corporation"
  }
}
```

**Frontend Integration Guide:**
1. **Primary Login Flow**: Use `/auth/login/email` for better UX
2. **Fallback**: Keep `/auth/login` for users who know their tenant ID
3. **Error Handling**: Handle 401 for invalid credentials
4. **Token Storage**: Store both access and refresh tokens securely

**Security Features:**
- Automatic tenant discovery via email lookup
- Email domain validation for tenant verification
- Security event logging for authentication attempts
- Same JWT token structure as traditional login

---

### Organization Management (`/api/tenants`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| POST | `/tenants` | Create new organization | No | - |
| GET | `/tenants/me` | Get current organization details | Yes | Any |
| PATCH | `/tenants/me` | Update organization name | Yes | Any |
| PATCH | `/tenants/me/details` | Update detailed organization info | Yes | Any |

#### Key Endpoints for Frontend

**Get Organization Details**
```http
GET /api/tenants/me
Authorization: Bearer <token>
```

**Update Organization Details**
```http
PATCH /api/tenants/me/details
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Acme Corporation Updated",
  "email": "contact@acme.com",
  "phone": "+1-800-ACME-123",
  "website": "https://acme.com",
  "logoUrl": "https://cdn.example.com/logo.png",
  "industry": "Technology",
  "address": "123 Tech Street",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94102",
  "country": "United States"
}
```

---

### Users Management (`/api/users`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/users` | List all users | Yes | ADMIN, MANAGER |
| GET | `/users/:id` | Get user by ID | Yes | ADMIN, MANAGER |
| POST | `/users` | Create new user | Yes | ADMIN |
| PATCH | `/users/:id` | Update user | Yes | ADMIN |
| DELETE | `/users/:id` | Delete user | Yes | ADMIN |

#### Key Endpoints for Frontend

**Create User**
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securePassword123",
  "roleId": "MANAGER"
}
```

**Update User**
```http
PATCH /api/users/clh7x1q0b0000qa20f0f0f0f0
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith Updated",
  "email": "jane.new@example.com",
  "roleId": "ADMIN"
}
```

---

### Branches (`/api/branches`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/branches` | List all branches | Yes | Any |
| GET | `/branches/:id` | Get branch by ID | Yes | Any |
| POST | `/branches` | Create new branch | Yes | ADMIN, MANAGER |
| PUT | `/branches/:id` | Update branch | Yes | ADMIN, MANAGER |
| DELETE | `/branches/:id` | Delete branch | Yes | ADMIN |

#### Key Endpoints for Frontend

**Create Branch**
```http
POST /api/branches
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Main Store",
  "address": "123 Main Street",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94102",
  "country": "United States"
}
```

---

### Products (`/api/products`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/products` | List all products | Yes | Any |
| POST | `/products` | Create simple/variant product | Yes | ADMIN, MANAGER |
| PATCH | `/products/:id` | Update product | Yes | ADMIN, MANAGER |
| POST | `/products/composite` | Create composite product (bundle) | Yes | ADMIN, MANAGER |
| GET | `/products/composite/:id` | Get composite product details | Yes | Any |
| GET | `/products/composite/:id/inventory` | Get composite with inventory levels | Yes | Any |
| POST | `/products/:id/upload-image` | **NEW** Upload single product image | Yes | ADMIN, MANAGER |
| POST | `/products/:id/upload-images` | **NEW** Upload multiple product images | Yes | ADMIN, MANAGER |
| DELETE | `/products/:id/images/:imageId` | **NEW** Delete product image | Yes | ADMIN, MANAGER |
| DELETE | `/products/:id` | Delete product | Yes | ADMIN |

#### Key Endpoints for Frontend

**List Products with Filtering**
```http
GET /api/products?page=1&limit=20&q=laptop&categoryId=clh7x1q0b0000qa20f0f0f0f0
Authorization: Bearer <token>
```

**Create Product**
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Laptop Pro",
  "sku": "LAPTOP-PRO-001",
  "categoryId": "clh7x1q0b0000qa20f0f0f0f0",
  "type": "SIMPLE",
  "price": 999.99,
  "cost": 750.00,
  "taxRate": 8.25,
  "imageUrl": "https://example.com/laptop.jpg"
}
```

**Upload Product Image**
```http
POST /api/products/:id/upload-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "file": "<binary>",
  "metadata": {
    "alt": "Product image",
    "caption": "Product description",
    "tags": ["laptop", "electronics"]
  }
}
```

**Supabase Storage Configuration**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Upload Multiple Product Images**
```http
POST /api/products/:id/upload-images
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "files": ["<binary>", "<binary>"],
  "metadata": {
    "alt": "Product image",
    "caption": "Product description",
    "tags": ["laptop", "electronics"]
  }
}
```

**Delete Product Image**
```http
DELETE /api/products/:id/images/:imageId
Authorization: Bearer <token>
```

**Response Examples:**
```json
// Upload Product Image Response (Supabase)
{
  "success": true,
  "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/product-images/product-123/1640995200000-abc123.jpg",
  "metadata": {
    "filename": "product-123/1640995200000-abc123.jpg",
    "size": 1024000,
    "format": "jpg",
    "cdnUrl": "https://your-project.supabase.co/storage/v1/object/public/product-images/product-123/1640995200000-abc123.jpg"
  }
}

// Upload Multiple Images Response (Supabase)
[
  {
    "success": true,
    "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/product-images/product-123/1640995200000-abc123.jpg",
    "metadata": {
      "filename": "product-123/1640995200000-abc123.jpg",
      "size": 1024000,
      "format": "jpg",
      "cdnUrl": "https://your-project.supabase.co/storage/v1/object/public/product-images/product-123/1640995200000-abc123.jpg"
    }
  },
  {
    "success": true,
    "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/product-images/product-123/1640995200000-def456.jpg",
    "metadata": {
      "filename": "product-123/1640995200000-def456.jpg",
      "size": 2048000,
      "format": "jpg",
      "cdnUrl": "https://your-project.supabase.co/storage/v1/object/public/product-images/product-123/1640995200000-def456.jpg"
    }
  }
]
```

**Create Composite Product (Bundle)**
```http
POST /api/products/composite
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Office Bundle",
  "sku": "OFFICE-BUNDLE-001",
  "price": 1499.99,
  "components": [
    {
      "productId": "laptop-pro",
      "quantity": 1
    },
    {
      "productId": "mouse-wireless",
      "quantity": 1
    }
  ]
}
```

---

### Sales (`/api/sales`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| POST | `/sales` | Create new sale | Yes | Any |
| GET | `/sales/:id` | Get sale by ID | Yes | Any |
| POST | `/sales/:id/items` | Add item to sale | Yes | Any |
| DELETE | `/sales/:id/items/:saleItemId` | Remove item from sale | Yes | Any |
| POST | `/sales/:id/hold` | Put sale on hold | Yes | Any |
| POST | `/sales/:id/resume` | Resume held sale | Yes | Any |
| POST | `/sales/:id/complete` | Complete sale | Yes | Any |
| POST | `/sales/:id/cancel` | Cancel sale | Yes | Any |
| POST | `/sales/:id/refund` | Refund sale | Yes | Any |
| GET | `/sales/:id/receipt` | Get sale receipt | Yes | Any |
| GET | `/sales/:id/receipt/print` | Get printable receipt (HTML) | Yes | Any |
| GET | `/sales/:id/receipt/print-job` | Get receipt for print job | Yes | Any |

#### Key Endpoints for Frontend

**Create Sale**
```http
POST /api/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer-123",
  "branchId": "branch-456",
  "items": [
    {
      "productId": "product-789",
      "quantity": 2,
      "price": 99.99
    }
  ]
}
```

**Complete Sale**
```http
POST /api/sales/sale-123/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "CASH",
  "paidAmount": 199.98
}
```

**Get Receipt**
```http
GET /api/sales/sale-123/receipt
Authorization: Bearer <token>
```

---

### Inventory (`/api/inventory`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/inventory` | List inventory levels | Yes | Any |
| GET | `/inventory/low-stock` | Get low stock items | Yes | Any |
| GET | `/inventory/alerts` | Get stock alerts | Yes | Any |
| POST | `/inventory/alerts/check` | Check and create alerts | Yes | ADMIN, MANAGER |
| POST | `/inventory/alerts/:id/resolve` | Resolve stock alert | Yes | ADMIN, MANAGER |
| GET | `/inventory/history` | Get inventory transaction history | Yes | Any |
| GET | `/inventory/valuation` | Get inventory valuation | Yes | Any |
| POST | `/inventory/adjust` | Adjust inventory levels | Yes | ADMIN, MANAGER |
| POST | `/inventory/transfers` | Transfer inventory between branches | Yes | ADMIN, MANAGER |
| POST | `/inventory/stocktakes` | Create stocktake | Yes | ADMIN, MANAGER |
| GET | `/inventory/stocktakes` | List stocktakes | Yes | Any |
| GET | `/inventory/stocktakes/:id` | Get stocktake details | Yes | Any |
| POST | `/inventory/stocktakes/:id/start` | Start stocktake | Yes | ADMIN, MANAGER |
| POST | `/inventory/stocktakes/:id/cancel` | Cancel stocktake | Yes | ADMIN, MANAGER |
| POST | `/inventory/stocktakes/:id/record-counts` | Record stocktake counts | Yes | ADMIN, MANAGER |
| POST | `/inventory/stocktakes/:id/complete` | Complete stocktake | Yes | ADMIN, MANAGER |
| POST | `/inventory/stocktakes/:id/apply` | Apply stocktake adjustments | Yes | ADMIN |

#### Key Endpoints for Frontend

**Get Low Stock Items**
```http
GET /api/inventory/low-stock?threshold=10
Authorization: Bearer <token>
```

**Adjust Inventory**
```http
POST /api/inventory/adjust
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-123",
  "branchId": "branch-456",
  "quantity": -5,
  "type": "ADJUSTMENT",
  "note": "Damaged items removed"
}
```

**Create Stocktake**
```http
POST /api/inventory/stocktakes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Monthly Stocktake - December 2025",
  "branchId": "branch-456"
}
```

---

### Customers (`/api/customers`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/customers` | List all customers | Yes | Any |
| GET | `/customers/:id` | Get customer by ID | Yes | Any |
| GET | `/customers/:id/history` | Get customer purchase history | Yes | Any |
| POST | `/customers` | Create new customer | Yes | Any |
| PATCH | `/customers/:id` | Update customer | Yes | Any |

#### Key Endpoints for Frontend

**Create Customer**
```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "phone": "+1-555-0123",
  "email": "john.smith@example.com"
}
```

**Get Customer History**
```http
GET /api/customers/customer-123/history?page=1&limit=20
Authorization: Bearer <token>
```

---

### Suppliers (`/api/suppliers`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/suppliers` | List all suppliers | Yes | Any |
| GET | `/suppliers/:id` | Get supplier by ID | Yes | Any |
| POST | `/suppliers` | Create new supplier | Yes | Any |
| PATCH | `/suppliers/:id` | Update supplier | Yes | Any |

#### Key Endpoints for Frontend

**Create Supplier**
```http
POST /api/suppliers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Office Supplies Inc",
  "email": "contact@officesupplies.com",
  "phone": "+1-800-SUPPLIER"
}
```

---

### Payments (`/api/payments`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/payments/reconciliation` | Get payment reconciliation report | Yes | Any |
| GET | `/payments/cash-drawer` | Get cash drawer summary | Yes | Any |
| GET | `/payments/by-status/:status` | Get payments by status | Yes | Any |
| POST | `/payments` | Create payment | Yes | Any |
| PUT | `/payments/:id/status/:newStatus` | Update payment status | Yes | Any |

#### Key Endpoints for Frontend

**Create Payment**
```http
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "saleId": "sale-123",
  "method": "CASH",
  "amount": 199.98,
  "direction": "SALE"
}
```

**Get Cash Drawer Summary**
```http
GET /api/payments/cash-drawer?from=2025-12-01&to=2025-12-31&countedCash=1500.00
Authorization: Bearer <token>
```

---

### Purchase Orders (`/api/purchase-orders`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/purchase-orders` | List purchase orders | Yes | Any |
| GET | `/purchase-orders/:id` | Get purchase order by ID | Yes | Any |
| POST | `/purchase-orders` | Create purchase order | Yes | Any |

#### Key Endpoints for Frontend

**Create Purchase Order**
```http
POST /api/purchase-orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "supplierId": "supplier-123",
  "branchId": "branch-456",
  "items": [
    {
      "productId": "product-789",
      "quantity": 10,
      "cost": 50.00
    }
  ]
}
```

---

### Production (`/api/production`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| POST | `/production/run` | Run production batch | Yes | Any |

#### Key Endpoints for Frontend

**Run Production**
```http
POST /api/production/run
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-123",
  "quantity": 50
}
```

---

### Invoices (`/api/invoices`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/invoices` | List all invoices | Yes | Any |
| GET | `/invoices/:id` | Get invoice by ID | Yes | Any |
| POST | `/invoices` | Create invoice from sale | Yes | ADMIN, MANAGER |
| GET | `/invoices/:id/a4` | Generate A4 invoice HTML | Yes | Any |

#### Key Endpoints for Frontend

**Create Invoice**
```http
POST /api/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "saleId": "sale-123"
}
```

---

### Recipes (`/api/recipes`)

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|---------------|
| GET | `/recipes` | List all recipes | Yes | Any |
| GET | `/recipes/:id` | Get recipe by ID | Yes | Any |
| POST | `/recipes` | Create new recipe | Yes | Any |
| PATCH | `/recipes/:id` | Update recipe | Yes | Any |

#### Key Endpoints for Frontend

**Create Recipe**
```http
POST /api/recipes
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-123",
  "recipeInputs": [
    {
      "rawMaterialId": "product-456",
      "quantity": 2.5
    }
  ]
}
```

---

### Data Import/Export

#### Exports (`/api/exports`)
| Method | Endpoint | Description | Auth Required |
|---------|-----------|-------------|---------------|
| GET | `/exports/products` | Export products data | Yes |
| GET | `/exports/customers` | Export customers data | Yes |
| GET | `/exports/suppliers` | Export suppliers data | Yes |
| GET | `/exports/inventory` | Export inventory data | Yes |

#### Imports (`/api/imports`)
| Method | Endpoint | Description | Auth Required |
|---------|-----------|-------------|---------------|
| POST | `/imports/products` | Import products data | Yes |
| POST | `/imports/customers` | Import customers data | Yes |
| POST | `/imports/suppliers` | Import suppliers data | Yes |

---

### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth Required |
|---------|-----------|-------------|---------------|
| GET | `/analytics/dashboard` | Get dashboard analytics | Yes |

#### Key Endpoints for Frontend

**Get Dashboard Analytics**
```http
GET /api/analytics/dashboard?from=2025-12-01&to=2025-12-31
Authorization: Bearer <token>
```

---

### Audit (`/api/audit`)

| Method | Endpoint | Description | Auth Required |
|---------|-----------|-------------|---------------|
| GET | `/audit` | Get audit logs | Yes |

#### Key Endpoints for Frontend

**Get Audit Logs**
```http
GET /api/audit?page=1&limit=20&action=CREATE&entity=Product&from=2025-12-01&to=2025-12-31
Authorization: Bearer <token>
```

---

### Health (`/api/health`)

| Method | Endpoint | Description | Auth Required |
|---------|-----------|-------------|---------------|
| GET | `/health` | Get system health status | No |

#### Key Endpoints for Frontend

**Check System Health**
```http
GET /api/health
```

---

### Super Admin (`/api/admin`) ⭐ NEW

**Overview**: Comprehensive admin panel for tenant management, subscription control, and customer support. Requires Super Admin role access.

| Method | Endpoint | Description | Auth Required | Role Required |
|---------|-----------|-------------|---------------|
| **TENANT MANAGEMENT** | | | | |
| GET | `/admin/tenants` | List all tenants with pagination and filtering | Yes | SUPER_ADMIN |
| GET | `/admin/tenants/:id` | Get tenant details including usage metrics | Yes | SUPER_ADMIN |
| PUT | `/admin/tenants/:id/status` | Update tenant status (suspend/deactivate) | Yes | SUPER_ADMIN |
| GET | `/admin/tenants/:id/usage` | Get tenant usage statistics and metrics | Yes | SUPER_ADMIN |
| **SUBSCRIPTION MANAGEMENT** | | | | |
| GET | `/admin/plans` | List all subscription plans | Yes | SUPER_ADMIN |
| POST | `/admin/plans` | Create new subscription plan | Yes | SUPER_ADMIN |
| GET | `/admin/plans/:id` | Get plan details | Yes | SUPER_ADMIN |
| PUT | `/admin/plans/:id` | Update subscription plan | Yes | SUPER_ADMIN |
| DELETE | `/admin/plans/:id` | Delete subscription plan | Yes | SUPER_ADMIN |
| GET | `/admin/subscriptions` | List all tenant subscriptions | Yes | SUPER_ADMIN |
| GET | `/admin/subscriptions/:id` | Get subscription details | Yes | SUPER_ADMIN |
| PUT | `/admin/subscriptions/:id` | Change tenant subscription plan | Yes | SUPER_ADMIN |
| **SUPPORT SYSTEM** | | | | |
| GET | `/admin/tickets` | List all support tickets with filtering | Yes | SUPER_ADMIN, SUPPORT_ADMIN |
| GET | `/admin/tickets/:id` | Get ticket details with messages | Yes | SUPER_ADMIN, SUPPORT_ADMIN |
| POST | `/admin/tickets` | Create new support ticket | Yes | SUPER_ADMIN, SUPPORT_ADMIN |
| PUT | `/admin/tickets/:id/assign` | Assign ticket to admin user | Yes | SUPER_ADMIN, SUPPORT_ADMIN |
| PUT | `/admin/tickets/:id/status` | Update ticket status | Yes | SUPER_ADMIN, SUPPORT_ADMIN |
| **ANALYTICS** | | | | |
| GET | `/admin/analytics/overview` | Get system overview metrics | Yes | SUPER_ADMIN |
| GET | `/admin/analytics/usage` | Get usage analytics by period | Yes | SUPER_ADMIN |
| GET | `/admin/analytics/revenue` | Get revenue analytics by period | Yes | SUPER_ADMIN |

#### Key Endpoints for Frontend

**List Tenants with Filtering**
```http
GET /api/admin/tenants?page=1&limit=20&status=ACTIVE&search=acme
Authorization: Bearer <admin-token>
```

**Update Tenant Status**
```http
PUT /api/admin/tenants/clh7x1q0a0000qa10f0f0f0f0/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "SUSPENDED",
  "reason": "Non-payment of subscription"
}
```

**Create Subscription Plan**
```http
POST /api/admin/plans
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Pro Plan",
  "description": "Advanced features for growing businesses",
  "price": 99.99,
  "billingCycle": "MONTHLY",
  "limits": "{\"users\": 50, \"branches\": 10, \"products\": 5000}",
  "features": "[\"inventory\", \"reports\", \"api_access\", \"multi_branch\"]",
  "isActive": true
}
```

**Create Support Ticket**
```http
POST /api/admin/tickets
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "tenantId": "clh7x1q0a0000qa10f0f0f0f0",
  "userId": "clh7x1q0b0000qa20f0f0f0f0",
  "subject": "Issue with inventory synchronization",
  "description": "The inventory is not syncing across multiple branches. When we update stock in one branch, it does not reflect in others.",
  "priority": "HIGH",
  "category": "TECHNICAL"
}
```

**Assign Support Ticket**
```http
PUT /api/admin/tickets/clh7x1q0b0000qa20f0f0f0f0/assign
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "assignedTo": "clh7x1q0b0000qa20f0f0f0f1"
}
```

**Get System Overview**
```http
GET /api/admin/analytics/overview
Authorization: Bearer <admin-token>
```

**Response Example:**
```json
{
  "tenants": {
    "total": 150,
    "active": 142
  },
  "subscriptions": {
    "total": 142,
    "active": 138
  },
  "support": {
    "openTickets": 23
  },
  "revenue": 28450.00
}
```

**Super Admin Features:**
- **Tenant Lifecycle Management**: Suspend, deactivate, reactivate tenant accounts
- **Usage Monitoring**: Real-time tracking of users, branches, products per tenant
- **Subscription Control**: Create and manage pricing plans with limits
- **Customer Support**: Complete ticketing system with assignment and tracking
- **Analytics Dashboard**: System-wide metrics and revenue analytics
- **Audit Logging**: Complete audit trail of all admin actions

**Security Features:**
- **Role-Based Access**: SUPER_ADMIN, SUPPORT_ADMIN, BILLING_ADMIN roles
- **Action Logging**: All admin actions logged with metadata
- **Tenant Isolation**: Strict separation of tenant data
- **Permission Validation**: Endpoint-level permission checks

---

## Frontend Integration Guide

### Authentication Flow

1. **Register Organization**: Use `/auth/register` to create organization and admin user
2. **Login**: Use `/auth/login` with email, password, and tenant ID
3. **Store Tokens**: Save access_token and refresh_token securely
4. **Use Access Token**: Include in Authorization header for all API calls
5. **Refresh Token**: Use `/auth/refresh` when access token expires
6. **Super Admin Access**: Use `/api/admin` endpoints with SUPER_ADMIN role for system management

### Error Handling

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

Common HTTP Status Codes:
- **200**: Success
- **201**: Created successfully
- **400**: Bad Request / Validation error
- **401**: Unauthorized
- **403**: Forbidden / Insufficient permissions
- **404**: Not found
- **409**: Conflict / Already exists

### Best Practices for Frontend

1. **Token Management**: 
   - Store tokens securely (httpOnly cookies recommended)
   - Implement automatic token refresh
   - Handle token expiration gracefully

2. **Error Handling**:
   - Display user-friendly error messages
   - Implement retry logic for network errors
   - Log errors for debugging

3. **Pagination**:
   - Use `page` and `limit` parameters for large datasets
   - Implement infinite scroll or pagination controls

4. **Real-time Updates**:
   - Consider WebSocket integration for live updates
   - Implement optimistic updates for better UX

5. **Data Validation**:
   - Validate form data before API calls
   - Use appropriate input types and formats

6. **Performance**:
   - Implement caching for frequently accessed data
   - Use debouncing for search inputs
   - Lazy load large datasets

### Rate Limiting

The API implements rate limiting to prevent abuse. If you receive 429 responses:
- Implement exponential backoff
- Cache responses where appropriate
- Use pagination to reduce request size

### Support

For API support and questions:
- Check Swagger documentation at `/api/docs`
- Review audit logs for troubleshooting
- Contact development team for technical issues
