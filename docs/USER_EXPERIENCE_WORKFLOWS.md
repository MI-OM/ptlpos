# User Experience Workflows

## Overview

This document outlines the user experience workflows for three primary roles in the PTLPOS system:
- **Admin** - Full system access and configuration
- **Manager** - Branch management, inventory, and reporting
- **Sales Rep** - Point of sale operations and customer service

---

## 1. ADMIN WORKFLOW

### 1.1 Authentication & Onboarding
```
POST /auth/login
→ POST /auth/register (if new tenant)
→ GET /auth/me (verify account details)
→ POST /auth/refresh (token refresh)
→ POST /auth/logout (logout)
→ POST /auth/verify-email (email verification)
→ POST /auth/forgot-password (password reset)
→ POST /auth/reset-password (complete reset)
```

### 1.2 Tenant & Business Configuration
```
GET /tenants/:id (view tenant details)
PATCH /tenants/:id (update business info)
  - Business name, address, phone, email
  - Logo URL, website
  - Industry classification
  - Subscription details

GET /sales/settings/receipt (view receipt settings)
PATCH /sales/settings/receipt (customize receipts)
  - Show/hide business name, phone, address, email
  - Show/hide unit price on receipt line items
  - Custom header/footer text
  - Customer name/phone display options

PATCH /tenants/me/settings (update tax and invoicing settings)
  - Tax rate (default percentage)
  - Tax enabled/disabled
  - Tax ID/VAT number
  - Custom settings
```

### 1.3 Branch Management
```
GET /branches (list all branches)
POST /branches (create new branch)
  - Name, address, contact info
  - Location coordinates
  - Operating hours

GET /branches/:id (view branch details)
PUT /branches/:id (update branch info)
DELETE /branches/:id (close branch)
```

### 1.4 User & Role Management
```
GET /users (list all users)
POST /users (create new user)
  - Name, email, phone
  - Role assignment (ADMIN, MANAGER, SALES_REP)
  - Branch assignments
  - Password setup

GET /users/:id (view user details)
PATCH /users/:id (update user info)
DELETE /users/:id (remove user)

GET /roles (view available roles)
POST /auth/change-password (change own password)
```

### 1.4.1 Shift Management
```
GET /shifts (view all shifts)
  - Filter by status, date range, branch
GET /shifts/active (view active shift)
GET /shifts/cash-drawer/summary (cash drawer summary)
GET /shifts/:id (view shift details)
POST /shifts/open (open new shift)
  - Opening balance, notes
POST /shifts/:id/close (close shift)
  - Closing balance, notes
```

### 1.5 Product Management
```
GET /products (list all products)
  - Filter by category, type (SIMPLE/VARIANT/COMPOSITE)
  - Search by name/SKU/barcode
  - Include inventory levels

POST /products (create new product)
  - Simple product: name, SKU, barcode, price, cost, tax rate
  - Variant product: base product + variants (size, color, etc.)
  - Composite product: recipe-based products

GET /products?barcode=XXX (search by barcode)

GET /products/:id (view product details)
PATCH /products/:id (update product)
DELETE /products/:id (delete product)
POST /products/:id/images (upload product images)
POST /products/composite (create composite product with recipe)
```

### 1.6 Category Management
```
GET /categories (list categories)
POST /categories (create category)
  - Name, description
  - Parent category (for nested categories)

GET /categories/:id (view category)
PATCH /categories/:id (update category)
DELETE /categories/:id (delete category)
```

### 1.7 Supplier Management
```
GET /suppliers (list suppliers)
POST /suppliers (create supplier)
  - Name, email, phone
  - Address details

GET /suppliers/:id (view supplier)
PATCH /suppliers/:id (update supplier)
DELETE /suppliers/:id (remove supplier)
```

### 1.8 Inventory Management
```
GET /inventory (view all inventory)
GET /inventory/low-stock?threshold=10 (low stock alerts)
GET /inventory/valuation (total inventory value)
GET /inventory/history (inventory transaction history)
GET /inventory/alerts (view inventory alerts)
POST /inventory/alerts/check (check and create alerts)
POST /inventory/adjust (manual inventory adjustment)
  - Product ID, quantity, reason, type
POST /inventory/transfer (transfer between branches)
  - From branch, to branch, product, quantity
POST /inventory/stocktake (start stocktake)
POST /inventory/stocktake/:id/record (record counts)
POST /inventory/stocktake/:id/complete (complete stocktake)
```

### 1.9 Recipe & Production Management
```
GET /recipes (list recipes)
POST /recipes (create recipe)
  - Product ID, raw materials, quantities

GET /recipes/:id (view recipe details)
PATCH /recipes/:id (update recipe)
DELETE /recipes/:id (delete recipe)

GET /production/orders (view production orders)
GET /production/materials (view raw materials)
GET /production/machines (view production machines)
POST /production/run (run production batch)
  - Product ID, quantity produced
```

### 1.10 Purchase Order Management
```
GET /purchase-orders (list purchase orders)
POST /purchase-orders (create PO)
  - Supplier ID, items, quantities, expected date

GET /purchase-orders/:id (view PO)
PATCH /purchase-orders/:id (update PO)
DELETE /purchase-orders/:id (cancel PO)
POST /purchase-orders/:id/complete (mark as received)
```

### 1.11 Sales Management
```
GET /sales (list all sales)
  - Filter by status, date range, branch
  - Pagination support

GET /sales/:id (view sale details)
POST /sales (create sale - admin override)
GET /sales/:id/receipt (view receipt data)
GET /sales/:id/receipt/print (printable HTML receipt)
GET /sales/:id/receipt/print-job (print job format)

POST /sales/:id/refund (process refund)
  - Items to refund, refund amount, reason
```

### 1.12 Customer Management
```
GET /customers (list all customers)
POST /customers (create customer)
  - Name, email, phone, address

GET /customers/:id (view customer)
PATCH /customers/:id (update customer)
DELETE /customers/:id (delete customer)

GET /customers/:id/history (purchase history)
POST /customers/:id/credit/add (add store credit)
POST /customers/:id/credit/deduct (deduct store credit)
POST /customers/:id/credit/adjust (adjust credit balance)
GET /customers/:id/credit (view credit balance)
GET /customers/:id/credit/transactions (credit transaction history)
```

### 1.13 Analytics & Reporting
```
GET /analytics/dashboard (dashboard metrics)
  - Sales, revenue, top products
  - Date range filtering

GET /metrics (system metrics)
GET /exports/sales (export sales data)
GET /exports/inventory (export inventory)
POST /imports/products (bulk import products)
POST /imports/customers (bulk import customers)
```

### 1.14 Audit & Compliance
```
GET /audit (view audit logs)
  - Filter by user, action, date range
  - View who did what and when
```

### 1.15 Invoice Management
```
GET /invoices (list invoices)
POST /invoices (create invoice)
GET /invoices/:id (view invoice)
GET /invoices/:id/pdf (download PDF)
POST /invoices/:id/send (email to customer)
```

---

## 2. MANAGER WORKFLOW

### 2.1 Authentication
```
POST /auth/login
→ GET /auth/me (verify profile)
→ POST /auth/change-password (update password)
```

### 2.2 Dashboard & Overview
```
GET /dashboard/stats (dashboard statistics)
  - Total customers, products, sales
  - Total revenue (all time and today)
  - Active shifts count
  - Low stock alerts count

GET /analytics/dashboard (branch performance)
  - Today's sales, revenue
  - Top selling products
  - Low stock alerts

GET /shifts/active (view active shifts)
GET /shifts/cash-drawer/summary (cash drawer summary)
GET /inventory/low-stock?threshold=10 (quick stock check)
GET /inventory/alerts (critical inventory issues)
```

### 2.3 Branch Operations
```
GET /branches (view all branches)
GET /branches/:id (view branch details)
→ Limited to assigned branches
```

### 2.4 Product Management
```
GET /products (list products)
  - Search, filter by category
  - View inventory levels

POST /products (create products)
GET /products/:id (view details)
PATCH /products/:id (update products)
POST /products/:id/images (upload images)
POST /products/composite (create composite products)
```

### 2.5 Category Management
```
GET /categories (list categories)
POST /categories (create categories)
PATCH /categories/:id (update categories)
```

### 2.6 Supplier Management
```
GET /suppliers (list suppliers)
POST /suppliers (add suppliers)
PATCH /suppliers/:id (update supplier info)
```

### 2.7 Inventory Management
```
GET /inventory (view inventory)
GET /inventory/low-stock (low stock items)
GET /inventory/valuation (inventory value)
GET /inventory/history (transaction history)
POST /inventory/adjust (manual adjustments)
  - Stock corrections, damage, loss
POST /inventory/transfer (branch transfers)
POST /inventory/stocktake (conduct stocktake)
POST /inventory/alerts/check (trigger stock alerts)
POST /inventory/alerts/:id/resolve (resolve alerts)
```

### 2.8 Recipe & Production
```
GET /recipes (view recipes)
POST /recipes (create recipes)
PATCH /recipes/:id (update recipes)
GET /production/orders (production status)
GET /production/materials (material availability)
GET /production/machines (machine status)
POST /production/run (run production)
```

### 2.9 Purchase Orders
```
GET /purchase-orders (view POs)
POST /purchase-orders (create PO)
PATCH /purchase-orders/:id (update PO)
POST /purchase-orders/:id/complete (receive goods)
```

### 2.10 Sales Oversight
```
GET /sales (view all sales)
  - Filter by branch, status, date
  - Monitor sales rep performance

GET /sales/:id (view sale details)
GET /sales/:id/receipt (view receipt)
POST /sales/:id/refund (process refunds)
POST /sales/:id/return-exchange (process returns/exchanges)
```

### 2.11 Shift Management
```
GET /shifts (view all shifts)
GET /shifts/active (view active shifts)
GET /shifts/cash-drawer/summary (cash drawer summary)
POST /shifts/open (open shift for staff)
  - Opening balance, drawer type (ONLINE/OFFLINE/MIXED)
POST /shifts/:id/close (close shift)
  - Closing balance, notes
POST /shifts/:id/reconcile (reconcile shift drawer)
  - Actual cash count
  - Payment method reconciliation
  - Discrepancy tracking

GET /shifts/reports/end-of-day (end of day report)
  - Date filter, branch filter
  - All shifts for the day
  - Sales, payments, drawer reconciliation

GET /shifts/reports/end-of-shift (end of shift report)
  - Shift-specific details
  - Sales, payments, reconciliation

GET /shifts/reports/sales-performance (sales performance report)
  - User filter, date range, branch filter
  - Aggregated sales by user
```

### 2.12 Customer Management
```
GET /customers (view customers)
POST /customers (add customers)
PATCH /customers/:id (update customer info)
DELETE /customers/:id (remove customer)

GET /customers/:id/history (purchase history)
POST /customers/:id/credit/add (add store credit)
POST /customers/:id/credit/deduct (deduct store credit)
GET /customers/:id/credit (view credit balance)
GET /customers/:id/credit/transactions (credit history)
```

### 2.13 Receipt Settings
```
GET /sales/settings/receipt (view settings)
PATCH /sales/settings/receipt (customize for branch)
```

### 2.14 Reporting
```
GET /analytics/dashboard (detailed reports)
GET /exports/sales (export sales reports)
GET /exports/inventory (export inventory reports)
```

---

## 3. SALES REP WORKFLOW

### 3.1 Authentication
```
POST /auth/login
→ GET /auth/me (verify profile)
→ POST /auth/change-password (update password)
```

### 3.2 Point of Sale - Daily Workflow

#### 3.2.1 Start Shift
```
GET /branches (verify assigned branch)
POST /shifts/open (open new shift)
  - Opening balance (cash in drawer)
  - Notes for shift
GET /products (load products for POS)
  - Include inventory for availability
  - Search by barcode
GET /customers (load customer list)
```

#### 3.2.2 Process Sale
```
POST /sales (create new sale)
  - Add items (POST /sales/:id/items)
  - Update quantities (PATCH /sales/:id/items/:itemId)
  - Remove items (DELETE /sales/:id/items/:itemId)

POST /sales/:id/payments (add payment)
  - Method: CASH, CARD, TRANSFER, STORE_CREDIT
  - Amount, direction
  - Store credit validates customer credit balance

POST /sales/:id/complete (finalize sale)
  - Deducts inventory
  - Updates shift totals
  - Generates receipt

GET /sales/:id/receipt/print (print receipt)
  - 80mm thermal format
  - Shows business name, items, totals
```

#### 3.2.3 Sale Operations
```
GET /sales (view today's sales)
  - Filter by status: ACTIVE, HELD, COMPLETED
GET /sales/:id (view sale details)

POST /sales/:id/hold (hold sale for later)
POST /sales/:id/resume (resume held sale)
POST /sales/:id/cancel (cancel sale)

POST /sales/:id/refund (process refund)
  - Select items to refund
  - Reason for refund
  - Refund amount

POST /sales/:id/return-exchange (process return/exchange)
  - Type: RETURN, EXCHANGE, RETURN_AND_EXCHANGE
  - Return items with quantities
  - Exchange items for new products
  - Handle payment differences
```

#### 3.2.4 Customer Service
```
GET /customers (search customers)
POST /customers (add new customer)
  - Quick add: name, phone
  - Full add: include address, email

GET /customers/:id (view customer history)
  - Past purchases
  - Total spending
  - Credit balance

POST /customers/:id/credit/add (add store credit)
  - Amount to add
  - Note for transaction

POST /customers/:id/credit/deduct (deduct store credit)
  - Amount to deduct
  - Note for transaction

GET /customers/:id/credit (view credit balance)
GET /customers/:id/credit/transactions (view credit history)
```

### 3.3 Inventory Awareness
```
GET /inventory/low-stock (check stock levels)
GET /products?includeInventory=true (view product stock)
→ Alert manager when stock is low
```

### 3.4 End of Shift
```
GET /shifts/cash-drawer/summary (view cash drawer summary)
  - Opening balance
  - Cash sales, card sales, other sales
  - Total sales count
POST /shifts/:id/close (close shift)
  - Count cash in drawer
  - Closing balance
  - Notes for shift

GET /sales?status=COMPLETED (review completed sales)
GET /analytics/dashboard?from=today (view daily performance)
  Cash reconciliation
  Report any issues to manager
```

---

## 4. SHARED WORKFLOWS

### 4.1 Common Operations
```
GET /auth/me (view profile)
POST /auth/change-password (security)
GET /branches (view branches - filtered by access)
GET /categories (browse categories)
GET /products (search products)
```

### 4.2 Error Handling
```
→ All endpoints return standardized error responses
→ Rate limiting: 429 status (10 requests/10 seconds)
→ Authentication: 401 status for invalid tokens
→ Authorization: 403 status for insufficient permissions
```

---

## 5. ROLE PERMISSIONS SUMMARY

| Endpoint Group | Admin | Manager | Sales Rep |
|----------------|-------|---------|-----------|
| Authentication | ✓ | ✓ | ✓ |
| Tenant Settings | ✓ | ✗ | ✗ |
| Tax Settings | ✓ | ✗ | ✗ |
| Dashboard Stats | ✓ | ✓ | ✓ (limited) |
| Branch Management | ✓ | ✓ (own) | ✗ |
| User Management | ✓ | ✗ | ✗ |
| Shift Management | ✓ | ✓ | ✓ (own) |
| Shift Reconciliation | ✓ | ✓ | ✗ |
| Shift Reports | ✓ | ✓ | ✓ (own) |
| Product Management | ✓ | ✓ | ✓ (read only) |
| Barcode Scanning | ✓ | ✓ | ✓ |
| Category Management | ✓ | ✓ | ✓ (read only) |
| Supplier Management | ✓ | ✓ | ✗ |
| Inventory Management | ✓ | ✓ | ✓ (read only) |
| Recipe Management | ✓ | ✓ | ✗ |
| Production | ✓ | ✓ | ✗ |
| Purchase Orders | ✓ | ✓ | ✗ |
| Sales (Create/Complete) | ✓ | ✓ | ✓ |
| Sales (Multi-payment) | ✓ | ✓ | ✓ |
| Sales (Refund) | ✓ | ✓ | ✓ |
| Sales (Returns/Exchanges) | ✓ | ✓ | ✓ |
| Customer Management | ✓ | ✓ | ✓ |
| Credit Account/Store Credit | ✓ | ✓ | ✓ |
| Analytics | ✓ | ✓ | ✓ (limited) |
| Exports/Imports | ✓ | ✓ | ✗ |
| Audit Logs | ✓ | ✗ | ✗ |
| Receipt Settings | ✓ | ✓ | ✗ |

---

## 6. TYPICAL USER JOURNEYS

### 6.1 Admin: Setting Up a New Branch
```
1. Login → POST /auth/login
2. Create branch → POST /branches
3. Create manager → POST /users (role: MANAGER)
4. Create sales reps → POST /users (role: SALES_REP)
5. Setup products → POST /products
6. Setup categories → POST /categories
7. Setup suppliers → POST /suppliers
8. Initial inventory → POST /inventory/adjust
9. Configure receipts → PATCH /sales/settings/receipt
```

### 6.2 Manager: Daily Operations
```
1. Login → POST /auth/login
2. Check dashboard → GET /analytics/dashboard
3. Review low stock → GET /inventory/low-stock
4. Create PO if needed → POST /purchase-orders
5. Check sales performance → GET /sales
6. Run production if needed → POST /production/run
7. Resolve inventory alerts → POST /inventory/alerts/:id/resolve
8. End of day report → GET /exports/sales
```

### 6.3 Sales Rep: Processing a Sale
```
1. Login → POST /auth/login
2. Open shift → POST /shifts/open (opening balance)
3. Create sale → POST /sales
4. Add items → POST /sales/:id/items (or scan barcode)
5. Add customer → POST /sales/:id/customer
6. Add payment → POST /sales/:id/payments (CASH, CARD, STORE_CREDIT)
7. Complete sale → POST /sales/:id/complete
8. Print receipt → GET /sales/:id/receipt/print
9. End shift → POST /shifts/:id/close (closing balance)
```

---

## 7. API RESPONSE PATTERNS

### 7.1 Success Responses
```json
{
  "id": "resource-id",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  // ... resource-specific fields
}
```

### 7.2 List Responses with Pagination
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 15,
    "totalPages": 7
  }
}
```

### 7.3 Error Responses
```json
{
  "statusCode": 400,
  "message": ["field validation error"],
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/endpoint"
}
```

---

## 8. BEST PRACTICES

### 8.1 For Admin
- Regularly review audit logs for security
- Keep inventory alerts configured appropriately
- Use receipt customization to match business branding
- Schedule regular stocktakes
- Monitor analytics for business insights

### 8.2 For Manager
- Check low stock alerts daily
- Review sales performance regularly
- Maintain accurate inventory records
- Train sales reps on proper POS procedures
- Respond to customer issues promptly

### 8.3 For Sales Rep
- Always verify customer information
- Check product availability before adding to sale
- Use hold feature for complex transactions
- Provide receipts for all completed sales
- Report system issues to manager immediately

---

## 9. RATE LIMITING

- **Default**: 10 requests per 10 seconds per IP
- **Authenticated**: 10 requests per 10 seconds per user
- **Headers**: `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`
- **Response**: 429 status when limit exceeded
- **Retry**: Use `Retry-After` header or wait for reset

---

## 10. AUTHENTICATION & SECURITY

- **Token Type**: JWT Bearer token
- **Token Expiry**: 1 hour (configurable)
- **Refresh Token**: Available via `/auth/refresh`
- **Role-Based Access**: Enforced via @Roles() decorator
- **Tenant Isolation**: All data scoped to tenant ID
- **Branch Filtering**: Data filtered by user's branch assignments

---

## 11. INTEGRATION POINTS

### 11.1 Email Notifications
- POST /email/send (send transactional emails)
- Receipts, invoices, password resets

### 11.2 File Uploads
- POST /products/:id/images (product images)
- POST /exports/* (export data downloads)

### 11.3 Webhooks (Future)
- Sales completed
- Inventory low stock alerts
- Purchase order received

---

## 12. MOBILE/POS CONSIDERATIONS

### 12.1 Offline Mode
- Cache products and customers locally
- Queue sales when offline
- Sync when connection restored

### 12.2 Performance
- Use pagination for large lists
- Include inventory flag only when needed
- Prefer search over full list loads

### 12.3 User Experience
- Fast product search (debounce queries)
- Quick customer lookup
- One-tap complete for common items
- Print receipt automatically on complete

---

## 13. TROUBLESHOOTING

### 13.1 Common Issues
- **401 Unauthorized**: Token expired, refresh or re-login
- **403 Forbidden**: Insufficient permissions, check role
- **404 Not Found**: Resource doesn't exist or wrong ID
- **429 Too Many Requests**: Rate limit hit, implement backoff
- **500 Server Error**: Contact support, check logs

### 13.2 Debug Mode
- Check audit logs for failed operations
- Review error messages in response
- Verify user role and permissions
- Check tenant and branch assignments

---

## 14. FUTURE ENHANCEMENTS

### 14.1 Planned Features
- Real-time inventory updates via WebSocket
- Mobile app for sales reps
- Advanced analytics and forecasting
- Customer loyalty program integration
- Multi-currency support
- Advanced reporting with custom filters

### 14.2 API V2 Considerations
- GraphQL support for flexible queries
- Webhook subscriptions
- Bulk operations API
- Advanced search with filters
- Export to multiple formats (CSV, Excel, PDF)

---

## 15. SUPPORT & CONTACT

- **Documentation**: /docs
- **API Reference**: /api-docs (Swagger)
- **Support Email**: support@ptlpos.com
- **Status Page**: status.ptlpos.com

---

*Document Version: 1.0*
*Last Updated: April 27, 2026*
