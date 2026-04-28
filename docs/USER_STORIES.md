# PTLPOS User Stories

This document provides user stories for each API endpoint organized by role to help the frontend team understand the context, flow, and requirements for implementing the UI.

---

## 1. ADMIN USER STORIES

### 1.1 Authentication & Onboarding

#### US-ADMIN-001: Login to System
**As an Admin**, I want to log in to the system so that I can access administrative features.

**Acceptance Criteria:**
- User enters email and password
- System validates credentials
- On success, returns access token and refresh token
- On failure, returns appropriate error message
- Token is stored for subsequent requests

**Endpoint:** `POST /auth/login`

**Prerequisites:** User account exists with valid credentials

**Success Scenario:**
```
Request: { email: "admin@ptlpos.local", password: "ChangeMe123!" }
Response: { access_token: "jwt...", refresh_token: "jwt..." }
```

**Error Scenarios:**
- 401: Invalid credentials
- 429: Too many login attempts

---

#### US-ADMIN-002: View My Profile
**As an Admin**, I want to view my profile information so that I can verify my account details.

**Acceptance Criteria:**
- Display user name, email, phone
- Show assigned role (ADMIN)
- Show tenant/organization details
- Show branch assignments

**Endpoint:** `GET /auth/me`

**Prerequisites:** Authenticated session

**Success Scenario:**
```
Response: {
  id: "...",
  name: "Admin User",
  email: "admin@ptlpos.local",
  role: "ADMIN",
  tenant: { name: "Acme Corp" },
  branches: [...]
}
```

---

#### US-ADMIN-003: Change Password
**As an Admin**, I want to change my password so that I can maintain account security.

**Acceptance Criteria:**
- User must provide current password
- New password must meet security requirements
- System validates current password before change
- Password change is logged for audit

**Endpoint:** `POST /auth/change-password`

**Prerequisites:** Authenticated session

**Request Body:**
```
{
  currentPassword: "OldPass123!",
  newPassword: "NewPass456!"
}
```

---

### 1.2 Tenant & Business Configuration

#### US-ADMIN-004: View Organization Details
**As an Admin**, I want to view my organization's details so that I can verify business information.

**Acceptance Criteria:**
- Display business name, address, contact info
- Show logo URL and website
- Display subscription status
- Show tax configuration

**Endpoint:** `GET /tenants/me`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-005: Update Business Information
**As an Admin**, I want to update my organization's business information so that it reflects current details.

**Acceptance Criteria:**
- Can update business name, address, phone, email
- Can update logo URL and website
- Can update industry classification
- Changes are immediately reflected in receipts

**Endpoint:** `PATCH /tenants/me`

**Prerequisites:** Authenticated session

**Request Body:**
```
{
  name: "Updated Business Name",
  email: "new@business.com",
  phone: "+1234567890"
}
```

---

#### US-ADMIN-006: Configure Tax Settings
**As an Admin**, I want to configure tax settings so that taxes are calculated correctly on sales.

**Acceptance Criteria:**
- Can set default tax rate (percentage)
- Can enable/disable tax calculation
- Can set Tax ID/VAT number
- Can add custom tax settings
- Settings are applied to all new sales

**Endpoint:** `PATCH /tenants/me/settings`

**Prerequisites:** Authenticated session

**Request Body:**
```
{
  taxRate: 0.15,
  taxEnabled: true,
  taxId: "VAT123456"
}
```

**Success Scenario:**
```
Response: {
  settings: {
    taxRate: 0.15,
    taxEnabled: true,
    taxId: "VAT123456"
  }
}
```

---

#### US-ADMIN-007: Customize Receipt Settings
**As an Admin**, I want to customize receipt settings so that receipts match my business branding.

**Acceptance Criteria:**
- Can toggle display of business name, phone, address
- Can show/hide unit price on line items
- Can set custom header and footer text
- Can configure customer name/phone display
- Settings are saved and applied to all receipts

**Endpoint:** `PATCH /sales/settings/receipt`

**Prerequisites:** Authenticated session

**Request Body:**
```
{
  showBusinessName: true,
  showPhone: true,
  showAddress: true,
  showUnitPrice: true,
  customHeader: "Thank you for shopping!",
  customFooter: "Please come again!"
}
```

---

### 1.3 Branch Management

#### US-ADMIN-008: List All Branches
**As an Admin**, I want to view all branches so that I can manage organizational structure.

**Acceptance Criteria:**
- Display all branches in the system
- Show branch name, address, contact info
- Show operational status
- Support pagination for large lists

**Endpoint:** `GET /branches`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-009: Create New Branch
**As an Admin**, I want to create a new branch so that I can expand business operations.

**Acceptance Criteria:**
- Can set branch name and address
- Can add contact information
- Can set location coordinates
- Can configure operating hours
- Branch is immediately available for user assignment

**Endpoint:** `POST /branches`

**Prerequisites:** Authenticated session

**Request Body:**
```
{
  name: "Downtown Store",
  address: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001",
  phone: "+1234567890"
}
```

---

#### US-ADMIN-010: Update Branch Information
**As an Admin**, I want to update branch details so that information stays current.

**Acceptance Criteria:**
- Can update all branch fields
- Changes are reflected immediately
- Historical data is preserved

**Endpoint:** `PUT /branches/:id`

**Prerequisites:** Authenticated session, branch exists

---

#### US-ADMIN-011: Close/Delete Branch
**As an Admin**, I want to close or delete a branch so that I can manage business closures.

**Acceptance Criteria:**
- System checks for active shifts at branch
- System checks for pending sales
- Warns if branch has active users
- Cannot delete if branch has critical data

**Endpoint:** `DELETE /branches/:id`

**Prerequisites:** Authenticated session, no active shifts/sales

---

### 1.4 User & Role Management

#### US-ADMIN-012: List All Users
**As an Admin**, I want to view all users so that I can manage team members.

**Acceptance Criteria:**
- Display all users with their roles
- Show user status (active/inactive)
- Show branch assignments
- Support search and filtering

**Endpoint:** `GET /users`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-013: Create New User
**As an Admin**, I want to create a new user account so that I can onboard team members.

**Acceptance Criteria:**
- Can set user name, email, phone
- Must assign a role (ADMIN, MANAGER, SALES_REP)
- Can assign branches
- System generates initial password
- User receives login credentials

**Endpoint:** `POST /users`

**Prerequisites:** Authenticated session

**Request Body:**
```
{
  name: "John Doe",
  email: "john@ptlpos.local",
  phone: "+1234567890",
  role: "MANAGER",
  branchIds: ["branch1", "branch2"],
  password: "InitialPass123!"
}
```

---

#### US-ADMIN-014: Update User Information
**As an Admin**, I want to update user details so that user information remains accurate.

**Acceptance Criteria:**
- Can update user profile information
- Can change user role
- Can reassign branches
- Changes take effect immediately

**Endpoint:** `PATCH /users/:id`

**Prerequisites:** Authenticated session, user exists

---

#### US-ADMIN-015: Remove User
**As an Admin**, I want to remove a user so that I can manage team changes.

**Acceptance Criteria:**
- System checks for active shifts
- System checks for pending sales
- Warns if user has critical data
- Cannot remove if user is currently logged in

**Endpoint:** `DELETE /users/:id`

**Prerequisites:** Authenticated session, no active sessions

---

#### US-ADMIN-016: View Available Roles
**As an Admin**, I want to view available roles so that I can understand permission levels.

**Acceptance Criteria:**
- Display all available roles
- Show role descriptions
- Show permissions for each role

**Endpoint:** `GET /roles`

**Prerequisites:** Authenticated session

---

### 1.5 Shift Management

#### US-ADMIN-017: View All Shifts
**As an Admin**, I want to view all shifts across all branches so that I can monitor operations.

**Acceptance Criteria:**
- Display shifts from all branches
- Filter by status, date range, branch
- Show shift totals and discrepancies
- Support pagination

**Endpoint:** `GET /shifts`

**Prerequisites:** Authenticated session

**Query Parameters:**
- `status`: OPEN, CLOSED
- `fromDate`: ISO date string
- `toDate`: ISO date string
- `branchId`: branch ID filter

---

#### US-ADMIN-018: View Active Shifts
**As an Admin**, I want to view currently active shifts so that I can monitor real-time operations.

**Acceptance Criteria:**
- Display all currently open shifts
- Show shift duration
- Show current sales totals
- Show assigned staff

**Endpoint:** `GET /shifts/active`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-019: View Shift Details
**As an Admin**, I want to view detailed shift information so that I can review shift performance.

**Acceptance Criteria:**
- Display complete shift information
- Show all sales during shift
- Show payment breakdown
- Show reconciliation data if reconciled

**Endpoint:** `GET /shifts/:id`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-020: Open Shift for Staff
**As an Admin**, I want to open a shift for staff so that they can start their work.

**Acceptance Criteria:**
- Can set opening cash balance
- Can specify drawer type (ONLINE/OFFLINE/MIXED)
- Can add notes for shift
- System validates no active shift exists for user

**Endpoint:** `POST /shifts/open`

**Prerequisites:** Authenticated session, user has no active shift

**Request Body:**
```
{
  openingBalance: 100.00,
  drawerType: "MIXED",
  notes: "Morning shift"
}
```

---

#### US-ADMIN-021: Close Shift
**As an Admin**, I want to close a shift so that the staff member can end their work.

**Acceptance Criteria:**
- Must provide closing cash balance
- System calculates discrepancy automatically
- System tracks drawer balances
- Can add closing notes

**Endpoint:** `POST /shifts/:id/close`

**Prerequisites:** Authenticated session, shift is open

**Request Body:**
```
{
  closingBalance: 250.00,
  notes: "Shift closed"
}
```

---

#### US-ADMIN-022: Reconcile Shift Drawer
**As an Admin**, I want to reconcile a shift drawer so that I can verify cash accuracy.

**Acceptance Criteria:**
- Can enter actual cash count
- System compares with expected amounts
- Calculates discrepancies by payment method
- Records reconciliation notes
- Action is logged for audit

**Endpoint:** `POST /shifts/:id/reconcile`

**Prerequisites:** Authenticated session, shift is closed

**Request Body:**
```
{
  actualCash: 250.00,
  actualCard: 150.00,
  actualTransfer: 0,
  actualMobile: 0,
  notes: "Reconciliation notes"
}
```

**Success Scenario:**
```
Response: {
  expectedCash: 100,
  actualCash: 250,
  totalDiscrepancy: 150,
  paymentBreakdown: {...}
}
```

---

### 1.6 Shift Reporting

#### US-ADMIN-023: Generate End of Day Report
**As an Admin**, I want to generate an end of day report so that I can review daily operations.

**Acceptance Criteria:**
- Can specify date for report
- Can filter by branch
- Shows all shifts for the day
- Aggregates sales and payments
- Shows reconciliation status

**Endpoint:** `GET /shifts/reports/end-of-day`

**Prerequisites:** Authenticated session

**Query Parameters:**
- `date`: ISO date string (optional, defaults to today)
- `branchId`: branch ID filter (optional)

**Success Scenario:**
```
Response: {
  date: "2026-04-27",
  shifts: [...],
  totals: {
    totalSales: 150,
    totalRevenue: 15000.00,
    cashSales: 5000.00,
    cardSales: 10000.00
  }
}
```

---

#### US-ADMIN-024: Generate End of Shift Report
**As an Admin**, I want to generate an end of shift report so that I can review shift performance.

**Acceptance Criteria:**
- Shows detailed shift information
- Lists all sales during shift
- Shows payment breakdown
- Displays reconciliation data
- Calculates totals

**Endpoint:** `GET /shifts/reports/end-of-shift`

**Prerequisites:** Authenticated session

**Query Parameters:**
- `shiftId`: shift ID (required)

---

#### US-ADMIN-025: Generate Sales Performance Report
**As an Admin**, I want to generate a sales performance report so that I can evaluate staff performance.

**Acceptance Criteria:**
- Can filter by user
- Can specify date range
- Can filter by branch
- Shows aggregated sales by user
- Calculates performance metrics

**Endpoint:** `GET /shifts/reports/sales-performance`

**Prerequisites:** Authenticated session

**Query Parameters:**
- `userId`: user ID filter (optional)
- `from`: start date (optional)
- `to`: end date (optional)
- `branchId`: branch ID filter (optional)

**Success Scenario:**
```
Response: {
  period: { from: "...", to: "..." },
  users: [
    {
      userId: "...",
      userName: "John Doe",
      totalSales: 50,
      totalRevenue: 5000.00
    }
  ],
  totals: {
    totalSales: 150,
    totalRevenue: 15000.00
  }
}
```

---

### 1.7 Product Management

#### US-ADMIN-026: List All Products
**As an Admin**, I want to view all products so that I can manage inventory.

**Acceptance Criteria:**
- Display all products with details
- Filter by category, type
- Search by name, SKU, barcode
- Show inventory levels
- Support pagination

**Endpoint:** `GET /products`

**Prerequisites:** Authenticated session

**Query Parameters:**
- `category`: category filter
- `type`: SIMPLE, VARIANT, COMPOSITE
- `search`: search term
- `page`: page number
- `limit`: items per page

---

#### US-ADMIN-027: Create Simple Product
**As an Admin**, I want to create a simple product so that I can add items to inventory.

**Acceptance Criteria:**
- Must provide name, SKU, price
- Can add barcode for scanning
- Can set cost and tax rate
- Product is immediately available for sale

**Endpoint:** `POST /products`

**Prerequisites:** Authenticated session

**Request Body:**
```
{
  name: "Product Name",
  sku: "SKU123",
  barcode: "1234567890123",
  price: 10.00,
  cost: 5.00,
  taxRate: 0.10
}
```

---

#### US-ADMIN-028: Search Product by Barcode
**As an Admin**, I want to search products by barcode so that I can quickly find items.

**Acceptance Criteria:**
- Accepts barcode as query parameter
- Returns matching product
- Returns 404 if not found

**Endpoint:** `GET /products?barcode=XXX`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-029: Update Product
**As an Admin**, I want to update product details so that information stays accurate.

**Acceptance Criteria:**
- Can update all product fields
- Changes are reflected immediately
- Historical sales data is preserved

**Endpoint:** `PATCH /products/:id`

**Prerequisites:** Authenticated session, product exists

---

#### US-ADMIN-030: Delete Product
**As an Admin**, I want to delete a product so that I can remove discontinued items.

**Acceptance Criteria:**
- System checks for existing sales
- System checks for inventory
- Warns if product has sales history
- Cannot delete if in active recipes

**Endpoint:** `DELETE /products/:id`

**Prerequisites:** Authenticated session, no active usage

---

### 1.8 Category Management

#### US-ADMIN-031: List Categories
**As an Admin**, I want to view all categories so that I can organize products.

**Acceptance Criteria:**
- Display category tree structure
- Show parent-child relationships
- Show product counts per category

**Endpoint:** `GET /categories`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-032: Create Category
**As an Admin**, I want to create a category so that I can organize products.

**Acceptance Criteria:**
- Can set category name and description
- Can set parent category for nesting
- Category is immediately available

**Endpoint:** `POST /categories`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-033: Update Category
**As an Admin**, I want to update category details so that organization stays current.

**Endpoint:** `PATCH /categories/:id`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-034: Delete Category
**As an Admin**, I want to delete a category so that I can remove unused categories.

**Acceptance Criteria:**
- System checks for products in category
- Cannot delete if category has products

**Endpoint:** `DELETE /categories/:id`

**Prerequisites:** Authenticated session, category is empty

---

### 1.9 Supplier Management

#### US-ADMIN-035: List Suppliers
**As an Admin**, I want to view all suppliers so that I can manage vendor relationships.

**Endpoint:** `GET /suppliers`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-036: Create Supplier
**As an Admin**, I want to create a supplier so that I can add new vendors.

**Request Body:**
```
{
  name: "Supplier Name",
  email: "supplier@vendor.com",
  phone: "+1234567890",
  address: "123 Vendor St"
}
```

**Endpoint:** `POST /suppliers`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-037: Update Supplier
**As an Admin**, I want to update supplier details so that information stays accurate.

**Endpoint:** `PATCH /suppliers/:id`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-038: Delete Supplier
**As an Admin**, I want to remove a supplier so that I can manage vendor relationships.

**Acceptance Criteria:**
- System checks for active purchase orders
- Cannot delete if supplier has active orders

**Endpoint:** `DELETE /suppliers/:id`

**Prerequisites:** Authenticated session, no active orders

---

### 1.10 Inventory Management

#### US-ADMIN-039: View Inventory
**As an Admin**, I want to view all inventory so that I can monitor stock levels.

**Endpoint:** `GET /inventory`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-040: View Low Stock Alerts
**As an Admin**, I want to view low stock items so that I can reorder products.

**Endpoint:** `GET /inventory/low-stock?threshold=10`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-041: View Inventory Valuation
**As an Admin**, I want to view total inventory value so that I can understand asset value.

**Endpoint:** `GET /inventory/valuation`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-042: View Inventory History
**As an Admin**, I want to view inventory transaction history so that I can track changes.

**Endpoint:** `GET /inventory/history`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-043: View Inventory Alerts
**As an Admin**, I want to view inventory alerts so that I can address stock issues.

**Endpoint:** `GET /inventory/alerts`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-044: Resolve Inventory Alert
**As an Admin**, I want to resolve an inventory alert so that it's marked as addressed.

**Endpoint:** `POST /inventory/alerts/:id/resolve`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-045: Adjust Inventory Manually
**As an Admin**, I want to manually adjust inventory so that I can correct stock levels.

**Request Body:**
```
{
  productId: "...",
  quantity: 10,
  reason: "Stock correction",
  type: "ADDITION"
}
```

**Endpoint:** `POST /inventory/adjust`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-046: Transfer Inventory Between Branches
**As an Admin**, I want to transfer inventory between branches so that I can balance stock.

**Endpoint:** `POST /inventory/transfer`

**Prerequisites:** Authenticated session

---

### 1.11 Customer Management

#### US-ADMIN-047: List Customers
**As an Admin**, I want to view all customers so that I can manage customer relationships.

**Endpoint:** `GET /customers`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-048: Create Customer
**As an Admin**, I want to create a customer so that I can add new customers.

**Request Body:**
```
{
  name: "Customer Name",
  email: "customer@email.com",
  phone: "+1234567890",
  address: "123 Customer St"
}
```

**Endpoint:** `POST /customers`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-049: Update Customer
**As an Admin**, I want to update customer details so that information stays accurate.

**Endpoint:** `PATCH /customers/:id`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-050: Delete Customer
**As an Admin**, I want to delete a customer so that I can remove inactive accounts.

**Acceptance Criteria:**
- System checks for sales history
- System checks for credit balance
- Cannot delete if customer has balance

**Endpoint:** `DELETE /customers/:id`

**Prerequisites:** Authenticated session, no balance

---

#### US-ADMIN-051: View Customer Purchase History
**As an Admin**, I want to view customer purchase history so that I can understand customer behavior.

**Endpoint:** `GET /customers/:id/history`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-052: Add Store Credit to Customer
**As an Admin**, I want to add store credit to a customer so that I can manage customer accounts.

**Request Body:**
```
{
  amount: 50.00,
  note: "Refund credit"
}
```

**Endpoint:** `POST /customers/:id/credit/add`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-053: Deduct Store Credit
**As an Admin**, I want to deduct store credit so that I can process credit payments.

**Request Body:**
```
{
  amount: 25.00,
  note: "Purchase payment"
}
```

**Endpoint:** `POST /customers/:id/credit/deduct`

**Prerequisites:** Authenticated session, sufficient balance

---

#### US-ADMIN-054: View Customer Credit Balance
**As an Admin**, I want to view customer credit balance so that I can manage customer accounts.

**Endpoint:** `GET /customers/:id/credit`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-055: View Credit Transaction History
**As an Admin**, I want to view credit transaction history so that I can track credit changes.

**Endpoint:** `GET /customers/:id/credit/transactions`

**Prerequisites:** Authenticated session

---

### 1.12 Analytics & Reporting

#### US-ADMIN-056: View Dashboard Analytics
**As an Admin**, I want to view dashboard analytics so that I can understand business performance.

**Endpoint:** `GET /analytics/dashboard`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-057: View System Metrics
**As an Admin**, I want to view system metrics so that I can monitor system health.

**Endpoint:** `GET /metrics`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-058: Export Sales Data
**As an Admin**, I want to export sales data so that I can perform external analysis.

**Endpoint:** `GET /exports/sales`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-059: Export Inventory Data
**As an Admin**, I want to export inventory data so that I can perform external analysis.

**Endpoint:** `GET /exports/inventory`

**Prerequisites:** Authenticated session

---

### 1.13 Audit & Compliance

#### US-ADMIN-060: View Audit Logs
**As an Admin**, I want to view audit logs so that I can track system activity.

**Acceptance Criteria:**
- Can filter by user, action, date range
- Shows who did what and when
- Shows entity and action details

**Endpoint:** `GET /audit`

**Prerequisites:** Authenticated session

---

### 1.14 Invoice Management

#### US-ADMIN-061: List Invoices
**As an Admin**, I want to view all invoices so that I can manage billing.

**Endpoint:** `GET /invoices`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-062: Create Invoice
**As an Admin**, I want to create an invoice so that I can bill customers.

**Endpoint:** `POST /invoices`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-063: Download Invoice PDF
**As an Admin**, I want to download invoice as PDF so that I can share with customers.

**Endpoint:** `GET /invoices/:id/pdf`

**Prerequisites:** Authenticated session

---

#### US-ADMIN-064: Email Invoice to Customer
**As an Admin**, I want to email invoice to customer so that I can send billing automatically.

**Endpoint:** `POST /invoices/:id/send`

**Prerequisites:** Authenticated session

---

## 2. MANAGER USER STORIES

### 2.1 Authentication

#### US-MGR-001: Login to System
**As a Manager**, I want to log in to the system so that I can access management features.

**Endpoint:** `POST /auth/login`

**Prerequisites:** Manager account exists

---

#### US-MGR-002: View My Profile
**As a Manager**, I want to view my profile information.

**Endpoint:** `GET /auth/me`

**Prerequisites:** Authenticated session

---

#### US-MGR-003: Change Password
**As a Manager**, I want to change my password.

**Endpoint:** `POST /auth/change-password`

**Prerequisites:** Authenticated session

---

### 2.2 Dashboard & Overview

#### US-MGR-004: View Dashboard Statistics
**As a Manager**, I want to view dashboard statistics so that I can quickly understand business status.

**Acceptance Criteria:**
- Display total customers count
- Display total products count
- Display total sales (all time and today)
- Display total revenue (all time and today)
- Display active shifts count
- Display low stock alerts count

**Endpoint:** `GET /dashboard/stats`

**Prerequisites:** Authenticated session

**Success Scenario:**
```
Response: {
  customers: 150,
  products: 500,
  sales: {
    total: 5000,
    today: 50
  },
  revenue: {
    total: 500000.00,
    today: 5000.00
  },
  activeShifts: 3,
  lowStockAlerts: 5
}
```

---

#### US-MGR-005: View Branch Performance Dashboard
**As a Manager**, I want to view branch performance so that I can monitor my assigned branches.

**Endpoint:** `GET /analytics/dashboard`

**Prerequisites:** Authenticated session

---

#### US-MGR-006: View Active Shifts
**As a Manager**, I want to view active shifts so that I can monitor staff activity.

**Endpoint:** `GET /shifts/active`

**Prerequisites:** Authenticated session

---

#### US-MGR-007: View Cash Drawer Summary
**As a Manager**, I want to view cash drawer summary so that I can monitor cash flow.

**Endpoint:** `GET /shifts/cash-drawer/summary`

**Prerequisites:** Authenticated session

---

#### US-MGR-008: View Low Stock Items
**As a Manager**, I want to view low stock items so that I can plan reorders.

**Endpoint:** `GET /inventory/low-stock?threshold=10`

**Prerequisites:** Authenticated session

---

#### US-MGR-009: View Inventory Alerts
**As a Manager**, I want to view inventory alerts so that I can address stock issues.

**Endpoint:** `GET /inventory/alerts`

**Prerequisites:** Authenticated session

---

### 2.3 Branch Operations

#### US-MGR-010: View Assigned Branches
**As a Manager**, I want to view my assigned branches so that I can manage my locations.

**Acceptance Criteria:**
- Only shows branches assigned to manager
- Displays branch details
- Shows branch status

**Endpoint:** `GET /branches`

**Prerequisites:** Authenticated session

---

#### US-MGR-011: View Branch Details
**As a Manager**, I want to view branch details so that I can understand branch information.

**Endpoint:** `GET /branches/:id`

**Prerequisites:** Authenticated session, access to branch

---

### 2.4 Product Management

#### US-MGR-012: List Products
**As a Manager**, I want to view products so that I can manage inventory.

**Endpoint:** `GET /products`

**Prerequisites:** Authenticated session

---

#### US-MGR-013: Create Product
**As a Manager**, I want to create products so that I can add items to inventory.

**Endpoint:** `POST /products`

**Prerequisites:** Authenticated session

---

#### US-MGR-014: Update Product
**As a Manager**, I want to update product details.

**Endpoint:** `PATCH /products/:id`

**Prerequisites:** Authenticated session

---

#### US-MGR-015: Upload Product Images
**As a Manager**, I want to upload product images so that products have visual representation.

**Endpoint:** `POST /products/:id/images`

**Prerequisites:** Authenticated session

---

#### US-MGR-016: Create Composite Product
**As a Manager**, I want to create composite products so that I can manage recipe-based items.

**Endpoint:** `POST /products/composite`

**Prerequisites:** Authenticated session

---

### 2.5 Category Management

#### US-MGR-017: List Categories
**As a Manager**, I want to view categories.

**Endpoint:** `GET /categories`

**Prerequisites:** Authenticated session

---

#### US-MGR-018: Create Category
**As a Manager**, I want to create categories.

**Endpoint:** `POST /categories`

**Prerequisites:** Authenticated session

---

#### US-MGR-019: Update Category
**As a Manager**, I want to update categories.

**Endpoint:** `PATCH /categories/:id`

**Prerequisites:** Authenticated session

---

### 2.6 Supplier Management

#### US-MGR-020: List Suppliers
**As a Manager**, I want to view suppliers.

**Endpoint:** `GET /suppliers`

**Prerequisites:** Authenticated session

---

#### US-MGR-021: Create Supplier
**As a Manager**, I want to add suppliers.

**Endpoint:** `POST /suppliers`

**Prerequisites:** Authenticated session

---

#### US-MGR-022: Update Supplier
**As a Manager**, I want to update supplier information.

**Endpoint:** `PATCH /suppliers/:id`

**Prerequisites:** Authenticated session

---

### 2.7 Inventory Management

#### US-MGR-023: View Inventory
**As a Manager**, I want to view inventory.

**Endpoint:** `GET /inventory`

**Prerequisites:** Authenticated session

---

#### US-MGR-024: Adjust Inventory
**As a Manager**, I want to manually adjust inventory for corrections.

**Endpoint:** `POST /inventory/adjust`

**Prerequisites:** Authenticated session

---

#### US-MGR-025: Transfer Inventory
**As a Manager**, I want to transfer inventory between branches.

**Endpoint:** `POST /inventory/transfer`

**Prerequisites:** Authenticated session

---

#### US-MGR-026: Conduct Stocktake
**As a Manager**, I want to start a stocktake process.

**Endpoint:** `POST /inventory/stocktake`

**Prerequisites:** Authenticated session

---

#### US-MGR-027: Check and Create Alerts
**As a Manager**, I want to trigger stock alerts.

**Endpoint:** `POST /inventory/alerts/check`

**Prerequisites:** Authenticated session

---

#### US-MGR-028: Resolve Inventory Alert
**As a Manager**, I want to resolve inventory alerts.

**Endpoint:** `POST /inventory/alerts/:id/resolve`

**Prerequisites:** Authenticated session

---

### 2.8 Sales Oversight

#### US-MGR-029: View All Sales
**As a Manager**, I want to view all sales so that I can monitor sales activity.

**Acceptance Criteria:**
- Filter by branch, status, date
- Monitor sales rep performance
- View payment details

**Endpoint:** `GET /sales`

**Prerequisites:** Authenticated session

---

#### US-MGR-030: View Sale Details
**As a Manager**, I want to view sale details.

**Endpoint:** `GET /sales/:id`

**Prerequisites:** Authenticated session

---

#### US-MGR-031: View Receipt
**As a Manager**, I want to view sale receipt.

**Endpoint:** `GET /sales/:id/receipt`

**Prerequisites:** Authenticated session

---

#### US-MGR-032: Process Refund
**As a Manager**, I want to process refunds for customers.

**Endpoint:** `POST /sales/:id/refund`

**Prerequisites:** Authenticated session

---

#### US-MGR-033: Process Return/Exchange
**As a Manager**, I want to process returns and exchanges.

**Endpoint:** `POST /sales/:id/return-exchange`

**Prerequisites:** Authenticated session

---

### 2.9 Shift Management (Manager)

#### US-MGR-034: View All Shifts
**As a Manager**, I want to view all shifts in my branches.

**Endpoint:** `GET /shifts`

**Prerequisites:** Authenticated session

---

#### US-MGR-035: Open Shift for Staff
**As a Manager**, I want to open shifts for my staff.

**Request Body:**
```
{
  openingBalance: 100.00,
  drawerType: "MIXED",
  notes: "Opening shift for staff"
}
```

**Endpoint:** `POST /shifts/open`

**Prerequisites:** Authenticated session

---

#### US-MGR-036: Close Shift
**As a Manager**, I want to close shifts for my staff.

**Endpoint:** `POST /shifts/:id/close`

**Prerequisites:** Authenticated session

---

#### US-MGR-037: Reconcile Shift Drawer
**As a Manager**, I want to reconcile shift drawers to verify cash accuracy.

**Endpoint:** `POST /shifts/:id/reconcile`

**Prerequisites:** Authenticated session

---

#### US-MGR-038: Generate End of Day Report
**As a Manager**, I want to generate end of day reports for my branches.

**Endpoint:** `GET /shifts/reports/end-of-day`

**Prerequisites:** Authenticated session

---

#### US-MGR-039: Generate End of Shift Report
**As a Manager**, I want to generate end of shift reports.

**Endpoint:** `GET /shifts/reports/end-of-shift`

**Prerequisites:** Authenticated session

---

#### US-MGR-040: Generate Sales Performance Report
**As a Manager**, I want to generate sales performance reports for my team.

**Endpoint:** `GET /shifts/reports/sales-performance`

**Prerequisites:** Authenticated session

---

### 2.10 Customer Management

#### US-MGR-041: View Customers
**As a Manager**, I want to view customers.

**Endpoint:** `GET /customers`

**Prerequisites:** Authenticated session

---

#### US-MGR-042: Create Customer
**As a Manager**, I want to add customers.

**Endpoint:** `POST /customers`

**Prerequisites:** Authenticated session

---

#### US-MGR-043: Update Customer
**As a Manager**, I want to update customer information.

**Endpoint:** `PATCH /customers/:id`

**Prerequisites:** Authenticated session

---

#### US-MGR-044: Delete Customer
**As a Manager**, I want to remove customers.

**Endpoint:** `DELETE /customers/:id`

**Prerequisites:** Authenticated session

---

#### US-MGR-045: Manage Store Credit
**As a Manager**, I want to manage customer store credit accounts.

**Endpoints:**
- `POST /customers/:id/credit/add`
- `POST /customers/:id/credit/deduct`
- `GET /customers/:id/credit`
- `GET /customers/:id/credit/transactions`

**Prerequisites:** Authenticated session

---

### 2.11 Receipt Settings

#### US-MGR-046: View Receipt Settings
**As a Manager**, I want to view receipt settings.

**Endpoint:** `GET /sales/settings/receipt`

**Prerequisites:** Authenticated session

---

#### US-MGR-047: Customize Receipt Settings
**As a Manager**, I want to customize receipt settings for my branch.

**Endpoint:** `PATCH /sales/settings/receipt`

**Prerequisites:** Authenticated session

---

### 2.12 Reporting

#### US-MGR-048: View Detailed Reports
**As a Manager**, I want to view detailed analytics reports.

**Endpoint:** `GET /analytics/dashboard`

**Prerequisites:** Authenticated session

---

#### US-MGR-049: Export Sales Reports
**As a Manager**, I want to export sales reports.

**Endpoint:** `GET /exports/sales`

**Prerequisites:** Authenticated session

---

#### US-MGR-050: Export Inventory Reports
**As a Manager**, I want to export inventory reports.

**Endpoint:** `GET /exports/inventory`

**Prerequisites:** Authenticated session

---

## 3. SALES REP USER STORIES

### 3.1 Authentication

#### US-SR-001: Login to System
**As a Sales Rep**, I want to log in to the system so that I can start my shift.

**Endpoint:** `POST /auth/login`

**Prerequisites:** Sales Rep account exists

---

#### US-SR-002: View My Profile
**As a Sales Rep**, I want to view my profile.

**Endpoint:** `GET /auth/me`

**Prerequisites:** Authenticated session

---

#### US-SR-003: Change Password
**As a Sales Rep**, I want to change my password.

**Endpoint:** `POST /auth/change-password`

**Prerequisites:** Authenticated session

---

### 3.2 Point of Sale - Start Shift

#### US-SR-004: Verify Assigned Branch
**As a Sales Rep**, I want to verify my assigned branch so that I know where I'm working.

**Endpoint:** `GET /branches`

**Prerequisites:** Authenticated session

---

#### US-SR-005: Open My Shift
**As a Sales Rep**, I want to open my shift so that I can start processing sales.

**Acceptance Criteria:**
- Must provide opening cash balance
- Can specify drawer type (ONLINE/OFFLINE/MIXED)
- Can add notes
- System validates no active shift exists

**Request Body:**
```
{
  openingBalance: 100.00,
  drawerType: "OFFLINE",
  notes: "Morning shift"
}
```

**Endpoint:** `POST /shifts/open`

**Prerequisites:** Authenticated session, no active shift

---

#### US-SR-006: Load Products for POS
**As a Sales Rep**, I want to load products so that I can add items to sales.

**Acceptance Criteria:**
- Include inventory for availability
- Support search by barcode
- Show product prices

**Endpoint:** `GET /products`

**Prerequisites:** Authenticated session

---

#### US-SR-007: Load Customer List
**As a Sales Rep**, I want to load customers so that I can add customers to sales.

**Endpoint:** `GET /customers`

**Prerequisites:** Authenticated session

---

### 3.3 Point of Sale - Process Sale

#### US-SR-008: Create New Sale
**As a Sales Rep**, I want to create a new sale so that I can start processing a transaction.

**Endpoint:** `POST /sales`

**Prerequisites:** Authenticated session, active shift

---

#### US-SR-009: Add Items to Sale
**As a Sales Rep**, I want to add items to a sale so that I can build the transaction.

**Endpoint:** `POST /sales/:id/items`

**Prerequisites:** Authenticated session, active sale

---

#### US-SR-010: Update Item Quantity
**As a Sales Rep**, I want to update item quantities so that I can adjust the sale.

**Endpoint:** `PATCH /sales/:id/items/:itemId`

**Prerequisites:** Authenticated session

---

#### US-SR-011: Remove Item from Sale
**As a Sales Rep**, I want to remove items so that I can correct mistakes.

**Endpoint:** `DELETE /sales/:id/items/:itemId`

**Prerequisites:** Authenticated session

---

#### US-SR-012: Add Payment to Sale
**As a Sales Rep**, I want to add payment so that I can complete the transaction.

**Acceptance Criteria:**
- Support multiple payment methods (CASH, CARD, TRANSFER, STORE_CREDIT)
- Validate store credit balance if used
- Show payment amount and direction

**Request Body:**
```
{
  method: "CASH",
  amount: 50.00,
  direction: "SALE"
}
```

**Endpoint:** `POST /sales/:id/payments`

**Prerequisites:** Authenticated session

---

#### US-SR-013: Complete Sale
**As a Sales Rep**, I want to complete a sale so that I can finalize the transaction.

**Acceptance Criteria:**
- Deducts inventory automatically
- Updates shift totals
- Generates receipt
- Marks sale as COMPLETED

**Endpoint:** `POST /sales/:id/complete`

**Prerequisites:** Authenticated session, sale has items and sufficient payment

---

#### US-SR-014: Print Receipt
**As a Sales Rep**, I want to print the receipt so that the customer gets a copy.

**Acceptance Criteria:**
- 80mm thermal format
- Shows business name, items, totals
- Follows receipt settings

**Endpoint:** `GET /sales/:id/receipt/print`

**Prerequisites:** Authenticated session, sale is completed

---

### 3.4 Sale Operations

#### US-SR-015: View Today's Sales
**As a Sales Rep**, I want to view today's sales so that I can review my activity.

**Acceptance Criteria:**
- Filter by status: ACTIVE, HELD, COMPLETED
- Show only my sales

**Endpoint:** `GET /sales`

**Prerequisites:** Authenticated session

---

#### US-SR-016: View Sale Details
**As a Sales Rep**, I want to view sale details.

**Endpoint:** `GET /sales/:id`

**Prerequisites:** Authenticated session

---

#### US-SR-017: Hold Sale
**As a Sales Rep**, I want to hold a sale so that I can process another transaction.

**Endpoint:** `POST /sales/:id/hold`

**Prerequisites:** Authenticated session

---

#### US-SR-018: Resume Held Sale
**As a Sales Rep**, I want to resume a held sale so that I can complete it.

**Endpoint:** `POST /sales/:id/resume`

**Prerequisites:** Authenticated session

---

#### US-SR-019: Cancel Sale
**As a Sales Rep**, I want to cancel a sale so that I can abandon a transaction.

**Endpoint:** `POST /sales/:id/cancel`

**Prerequisites:** Authenticated session

---

#### US-SR-020: Process Refund
**As a Sales Rep**, I want to process refunds so that I can handle returns.

**Request Body:**
```
{
  items: [{ itemId: "...", quantity: 1 }],
  refundAmount: 25.00,
  reason: "Customer request"
}
```

**Endpoint:** `POST /sales/:id/refund`

**Prerequisites:** Authenticated session

---

#### US-SR-021: Process Return/Exchange
**As a Sales Rep**, I want to process returns and exchanges.

**Acceptance Criteria:**
- Type: RETURN, EXCHANGE, RETURN_AND_EXCHANGE
- Return items with quantities
- Exchange items for new products
- Handle payment differences

**Request Body:**
```
{
  type: "RETURN_AND_EXCHANGE",
  returnItems: [{ productId: "...", quantity: 1 }],
  exchangeItems: [{ productId: "...", quantity: 1 }]
}
```

**Endpoint:** `POST /sales/:id/return-exchange`

**Prerequisites:** Authenticated session

---

### 3.5 Customer Service

#### US-SR-022: Search Customers
**As a Sales Rep**, I want to search customers so that I can find customer accounts.

**Endpoint:** `GET /customers`

**Prerequisites:** Authenticated session

---

#### US-SR-023: Add New Customer
**As a Sales Rep**, I want to add a new customer so that I can create accounts during sale.

**Acceptance Criteria:**
- Quick add: name, phone
- Full add: include address, email

**Request Body:**
```
{
  name: "Customer Name",
  phone: "+1234567890"
}
```

**Endpoint:** `POST /customers`

**Prerequisites:** Authenticated session

---

#### US-SR-024: View Customer History
**As a Sales Rep**, I want to view customer history so that I can see past purchases.

**Endpoint:** `GET /customers/:id`

**Prerequisites:** Authenticated session

---

#### US-SR-025: Add Store Credit
**As a Sales Rep**, I want to add store credit so that I can issue refunds as credit.

**Request Body:**
```
{
  amount: 50.00,
  note: "Refund as store credit"
}
```

**Endpoint:** `POST /customers/:id/credit/add`

**Prerequisites:** Authenticated session

---

#### US-SR-026: Deduct Store Credit
**As a Sales Rep**, I want to deduct store credit so that I can accept credit payments.

**Request Body:**
```
{
  amount: 25.00,
  note: "Purchase payment"
}
```

**Endpoint:** `POST /customers/:id/credit/deduct`

**Prerequisites:** Authenticated session

---

#### US-SR-027: View Credit Balance
**As a Sales Rep**, I want to view customer credit balance so that I can verify available credit.

**Endpoint:** `GET /customers/:id/credit`

**Prerequisites:** Authenticated session

---

#### US-SR-028: View Credit History
**As a Sales Rep**, I want to view credit history so that I can track credit transactions.

**Endpoint:** `GET /customers/:id/credit/transactions`

**Prerequisites:** Authenticated session

---

### 3.6 Inventory Awareness

#### US-SR-029: Check Stock Levels
**As a Sales Rep**, I want to check stock levels so that I can inform customers about availability.

**Endpoint:** `GET /inventory/low-stock`

**Prerequisites:** Authenticated session

---

#### US-SR-030: View Product Stock
**As a Sales Rep**, I want to view product stock so that I can check availability.

**Endpoint:** `GET /products?includeInventory=true`

**Prerequisites:** Authenticated session

---

#### US-SR-031: Alert Manager
**As a Sales Rep**, I want to alert manager when stock is low so that reorders can be made.

**Manual action** - No specific endpoint, communication with manager

---

### 3.7 End of Shift

#### US-SR-032: View Cash Drawer Summary
**As a Sales Rep**, I want to view cash drawer summary so that I can prepare for closing.

**Acceptance Criteria:**
- Shows opening balance
- Shows cash sales, card sales, other sales
- Shows total sales count

**Endpoint:** `GET /shifts/cash-drawer/summary`

**Prerequisites:** Authenticated session

---

#### US-SR-033: Close My Shift
**As a Sales Rep**, I want to close my shift so that I can end my work.

**Acceptance Criteria:**
- Must count cash in drawer
- Provide closing balance
- Add notes for shift
- System calculates discrepancy

**Request Body:**
```
{
  closingBalance: 250.00,
  notes: "Shift closed"
}
```

**Endpoint:** `POST /shifts/:id/close`

**Prerequisites:** Authenticated session, active shift

---

#### US-SR-034: Review Completed Sales
**As a Sales Rep**, I want to review completed sales so that I can verify my work.

**Endpoint:** `GET /sales?status=COMPLETED`

**Prerequisites:** Authenticated session

---

#### US-SR-035: View Daily Performance
**As a Sales Rep**, I want to view my daily performance so that I can track my sales.

**Endpoint:** `GET /analytics/dashboard?from=today`

**Prerequisites:** Authenticated session

---

#### US-SR-036: Report Issues
**As a Sales Rep**, I want to report cash reconciliation issues to my manager.

**Manual action** - Communication with manager

---

## 4. SHARED USER STORIES

### 4.1 Common Operations

#### US-SHARED-001: View Profile
**As any user**, I want to view my profile so that I can see my account details.

**Endpoint:** `GET /auth/me`

**Prerequisites:** Authenticated session

---

#### US-SHARED-002: Change Password
**As any user**, I want to change my password for security.

**Endpoint:** `POST /auth/change-password`

**Prerequisites:** Authenticated session

---

#### US-SHARED-003: View Branches
**As any user**, I want to view branches so that I can see organizational structure.

**Acceptance Criteria:**
- Filtered by user's access level
- Admin sees all branches
- Manager sees assigned branches
- Sales Rep sees assigned branch

**Endpoint:** `GET /branches`

**Prerequisites:** Authenticated session

---

#### US-SHARED-004: Browse Categories
**As any user**, I want to browse categories so that I can organize product navigation.

**Endpoint:** `GET /categories`

**Prerequisites:** Authenticated session

---

#### US-SHARED-005: Search Products
**As any user**, I want to search products so that I can find items quickly.

**Endpoint:** `GET /products`

**Prerequisites:** Authenticated session

---

### 4.2 Error Handling

#### US-SHARED-006: Handle 401 Unauthorized
**As any user**, I want to be redirected to login when my token expires.

**Behavior:** Redirect to login page with session expired message

---

#### US-SHARED-007: Handle 403 Forbidden
**As any user**, I want to see an appropriate error when I lack permissions.

**Behavior:** Display "You don't have permission to access this resource"

---

#### US-SHARED-008: Handle 404 Not Found
**As any user**, I want to see a helpful error when a resource doesn't exist.

**Behavior:** Display "Resource not found" with option to go back

---

#### US-SHARED-009: Handle 429 Rate Limit
**As any user**, I want to see rate limit information when I hit API limits.

**Behavior:** Display "Too many requests, please wait" with retry time

---

#### US-SHARED-010: Handle 500 Server Error
**As any user**, I want to see a friendly error when something goes wrong.

**Behavior:** Display "Something went wrong, please try again later"

---

## 5. ENDPOINT SUMMARY BY ROLE

### Admin Only Endpoints
- User Management (CRUD)
- Tenant Settings (full access)
- Tax Settings
- Audit Logs
- All Shift Reconciliation
- All Reports

### Manager Endpoints
- Dashboard Stats
- Branch Management (assigned branches only)
- Product Management (full)
- Category Management (full)
- Supplier Management (full)
- Inventory Management (full)
- Recipe Management
- Production
- Purchase Orders
- Sales Oversight
- Shift Management (for staff)
- Shift Reconciliation
- Shift Reports
- Customer Management (full)
- Receipt Settings
- Analytics (full)
- Exports

### Sales Rep Endpoints
- Dashboard Stats (limited)
- Product Management (read only)
- Category Management (read only)
- Inventory Management (read only)
- Sales (full access to own sales)
- Customer Management (full)
- Store Credit Management
- Shift Management (own shifts only)
- Shift Reports (own shifts only)
- Analytics (limited)

---

*Document Version: 1.0*
*Last Updated: April 27, 2026*
