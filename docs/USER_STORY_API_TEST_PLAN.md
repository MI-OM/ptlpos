# PTLPOS Feature Test Plan

## Purpose
This plan defines the test coverage needed to validate all features described in:

- `docs/USER_STORIES.md`
- `API_DOCUMENTATION.md`

It complements the existing high-level `TEST_PLAN.md` by focusing on feature completeness, role behavior, endpoint coverage, data integrity, and story-to-API traceability.

## Scope
In scope:

- Functional API testing for every documented feature and endpoint
- Role-based access testing for `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `SALES_REP`, `SUPPORT_ADMIN`, and `BILLING_ADMIN`
- Multi-tenant isolation
- Workflow testing across authentication, sales, shifts, inventory, customers, suppliers, reporting, and super admin operations
- Validation, error handling, auditability, and side effects
- Receipt, invoice, import/export, and image-upload flows

Out of scope:

- Frontend visual/UI testing
- Native printer hardware certification
- Third-party platform SLA validation beyond integration behavior

## Test Objectives
- Confirm every user story acceptance criterion is covered by executable tests.
- Confirm every documented endpoint enforces authentication, authorization, validation, and tenant boundaries.
- Confirm business workflows mutate state correctly across related modules.
- Detect documentation mismatches before implementation or release sign-off.

## Test Levels
1. Unit tests
   - Services, guards, DTO validation, helpers, receipt/invoice templates, auth token logic.
2. Integration tests
   - Controller + service + Prisma behavior with seeded database state.
3. End-to-end API tests
   - Full request/response workflows with realistic seeded tenants, branches, users, products, and sales.
4. Non-functional tests
   - Reliability, rate limiting, concurrency, and export/import performance.

## Test Environment
- Isolated PostgreSQL test database
- Isolated Redis instance for auth/session/throttling behavior
- Dedicated object storage test bucket for product image upload/delete
- Mail sandbox for verification, password reset, and invoice sending
- Separate tenant fixtures to prove tenant isolation

Recommended environment variables:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` or equivalent storage config
- mail sandbox credentials

## Seed Data
Create seeded fixtures for at least:

- `Tenant A` with:
  - 1 `ADMIN`
  - 1 `MANAGER`
  - 2 `SALES_REP`
  - 1 `SUPPORT_ADMIN` if tenant-scoped support exists
  - 2 branches
  - categories, simple products, variant products, composite products
  - suppliers, customers, inventory balances, low-stock items
  - open and closed shifts
  - held, active, completed, cancelled, and refunded sales
- `Tenant B` with similar but smaller data to validate cross-tenant denial
- `SUPER_ADMIN` and `BILLING_ADMIN` global users
- support tickets, plans, subscriptions, audit records, imports, exports

## Coverage Rules
Every endpoint or workflow should be tested for:

- happy path
- required field validation
- invalid type/format validation
- unauthorized request (`401`)
- forbidden request (`403`)
- not found (`404`) where applicable
- conflict/state error (`409`) where applicable
- tenant isolation
- audit/event logging where expected
- side effects on related resources

## Role Access Matrix
Minimum authorization matrix:

- `SUPER_ADMIN`: full `/admin/*`, denied tenant-only unsafe paths if intended
- `ADMIN`: tenant-wide operations including users, branches, products, shifts, reports, audit
- `MANAGER`: branch/operational features, denied tenant admin-only actions
- `SALES_REP`: own-shift and own-sales scope, denied admin/manager mutations
- `SUPPORT_ADMIN`: support ticket endpoints only
- `BILLING_ADMIN`: subscription/billing endpoints only

Add negative tests proving:

- managers cannot manage users if not allowed
- sales reps cannot mutate products/inventory/users/tenant settings
- tenant users cannot access super admin resources
- users cannot access other tenants' entities by ID

## Feature Suites

### 1. Authentication and Account Lifecycle
Endpoints and stories:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/login/email`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/change-password`
- `POST /auth/email/verify-request`
- `POST /auth/email/verify`
- `POST /auth/password/reset-request`
- `POST /auth/password/reset`

Test scenarios:

- register organization and initial admin
- login with tenant ID
- login with email-only tenant discovery
- login failure for bad password
- rate limit on repeated login failure
- refresh token returns new access token and rejects invalid/expired refresh tokens
- `/auth/me` returns correct user, role, tenant, and branch data
- change password requires correct current password and blocks reuse if implemented
- email verification request and verify flow
- password reset request and reset flow
- token expiry handling and protected endpoint denial after expiry

### 2. Tenant and Organization Configuration
Endpoints and stories:

- `GET /tenants/me`
- `PATCH /tenants/me`
- `PATCH /tenants/me/details`
- `PATCH /tenants/me/settings`

Test scenarios:

- read organization details
- update business name/contact/address/logo/website/industry
- update tax settings and confirm values are reflected in subsequent sales calculations
- verify only authorized roles can mutate tenant settings
- confirm changes are tenant-scoped only

### 3. Branch Management
Endpoints and stories:

- `GET /branches`
- `GET /branches/:id`
- `POST /branches`
- `PUT /branches/:id`
- `DELETE /branches/:id`

Test scenarios:

- list branches by role visibility
- create branch with valid details
- update branch fields
- delete branch with no active dependencies
- reject delete when branch has active shifts, pending sales, or protected historical data
- verify manager sees only assigned branches
- verify sales rep sees only assigned branch where enforced

### 4. User and Role Management
Endpoints and stories:

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `GET /roles`

Test scenarios:

- list users with roles and branch assignments
- create user with role and branches
- update role, branch assignment, profile fields, and active status
- reject duplicate email
- delete user with and without active shift/session/pending sales
- verify `GET /roles` returns expected permissions metadata

### 5. Dashboard, Analytics, Audit, Health, Metrics
Endpoints and stories:

- `GET /dashboard/stats`
- `GET /analytics/dashboard`
- `GET /metrics`
- `GET /health`
- `GET /audit`
- `GET /admin/analytics/overview`
- `GET /admin/analytics/usage`
- `GET /admin/analytics/revenue`

Test scenarios:

- role-appropriate dashboard stats
- analytics date filtering and branch filtering
- audit filtering by user/action/date/entity
- metrics and health availability rules
- super admin overview/usage/revenue aggregation correctness

### 6. Shift Operations and Reporting
Endpoints and stories:

- `GET /shifts`
- `GET /shifts/active`
- `GET /shifts/:id`
- `POST /shifts/open`
- `POST /shifts/:id/close`
- `POST /shifts/:id/reconcile`
- `GET /shifts/reports/end-of-day`
- `GET /shifts/reports/end-of-shift`
- sales-rep and manager cash drawer summary flows

Test scenarios:

- open shift with opening balance and drawer type
- reject second open shift for same user if active shift exists
- close shift and compute discrepancy
- reconcile closed shift and validate expected vs actual breakdown
- list/filter shifts by status/date/branch
- generate end-of-day, end-of-shift, and sales-performance reports
- verify admins can view all, managers only assigned branches, sales reps own shifts only

### 7. Categories
Endpoints and stories:

- `GET /categories`
- `GET /categories/:id`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

Test scenarios:

- create top-level and nested categories
- list with pagination/search/activity filters
- update name/description/active state
- reject delete when category still contains products
- verify product counts and tree structure if returned

### 8. Products, Images, Composite Products, Recipes, Production
Endpoints and stories:

- `GET /products`
- `POST /products`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `GET /products/:id/history`
- `POST /products/composite`
- `GET /products/composite/:id`
- `GET /products/composite/:id/inventory`
- `POST /products/:id/upload-image`
- `POST /products/:id/upload-images`
- `DELETE /products/:id/images/:imageId`
- `GET /recipes`
- `GET /recipes/:id`
- `POST /recipes`
- `PATCH /recipes/:id`
- `POST /production/run`

Test scenarios:

- create simple product
- create variant product if supported by DTO/service
- search by name, SKU, barcode, category, type
- update product fields without affecting historical sale records
- reject delete when product is used in sales, inventory, or recipes
- read product history with transaction filters
- upload one and many images; validate file type, size, metadata, and storage cleanup on delete
- create composite product and verify derived inventory availability
- create and update recipe
- run production batch and verify raw material consumption plus finished goods increment

### 9. Inventory, Alerts, Transfers, Stocktakes
Endpoints and stories:

- `GET /inventory`
- `GET /inventory/low-stock`
- `GET /inventory/alerts`
- `POST /inventory/alerts/check`
- `POST /inventory/alerts/:id/resolve`
- `GET /inventory/history`
- `GET /inventory/valuation`
- `POST /inventory/adjust`
- `POST /inventory/transfers` or `/inventory/transfer`
- `POST /inventory/stocktakes`
- `GET /inventory/stocktakes`
- `GET /inventory/stocktakes/:id`
- `POST /inventory/stocktakes/:id/start`
- `POST /inventory/stocktakes/:id/cancel`
- `POST /inventory/stocktakes/:id/record-counts`
- `POST /inventory/stocktakes/:id/complete`
- `POST /inventory/stocktakes/:id/apply`

Test scenarios:

- list inventory by branch/product filters
- low-stock threshold behavior
- valuation correctness
- manual positive and negative adjustments
- reject adjustment that breaks constraints if stock cannot go negative
- create and resolve alerts
- transfer inventory between branches and validate debit/credit history
- stocktake lifecycle from create to apply
- reject invalid stocktake state transitions

### 10. Suppliers, Purchase Orders, Purchases
Endpoints and stories:

- `GET /suppliers`
- `GET /suppliers/:id`
- `POST /suppliers`
- `PATCH /suppliers/:id`
- `DELETE /suppliers/:id` if supported
- `GET /purchase-orders`
- `GET /purchase-orders/:id`
- `POST /purchase-orders`
- purchase receiving endpoints under purchases module if active in codebase

Test scenarios:

- supplier CRUD
- reject supplier delete with active purchase orders
- create purchase order with line items
- list and fetch purchase orders
- receive stock into inventory where receiving endpoints exist
- validate inventory, valuation, and history side effects

### 11. Customers and Store Credit
Endpoints and stories:

- `GET /customers`
- `GET /customers/:id`
- `GET /customers/:id/history`
- `POST /customers`
- `PATCH /customers/:id`
- `DELETE /customers/:id` if supported
- `POST /customers/:id/credit/add`
- `POST /customers/:id/credit/deduct`
- `GET /customers/:id/credit`
- `GET /customers/:id/credit/transactions`

Test scenarios:

- quick-add and full customer creation
- customer update and search
- customer history pagination and filters
- add store credit
- deduct store credit with sufficient and insufficient balance
- refund-to-credit flow
- reject delete when customer has restricted balance or history if required

### 12. Sales, Payments, Receipts, Refunds, Returns, Invoices
Endpoints and stories:

- `GET /sales` if supported
- `POST /sales`
- `GET /sales/:id`
- `POST /sales/:id/items`
- `PATCH /sales/:id/items/:itemId`
- `DELETE /sales/:id/items/:saleItemId`
- `POST /sales/:id/payments`
- `POST /sales/:id/hold`
- `POST /sales/:id/resume`
- `POST /sales/:id/complete`
- `POST /sales/:id/cancel`
- `POST /sales/:id/refund`
- `POST /sales/:id/return-exchange`
- `GET /sales/:id/receipt`
- `GET /sales/:id/receipt/print`
- `GET /sales/:id/receipt/print-job`
- `GET /sales/settings/receipt`
- `PATCH /sales/settings/receipt`
- `GET /payments/reconciliation`
- `GET /payments/cash-drawer`
- `GET /payments/by-status/:status`
- `POST /payments`
- `PUT /payments/:id/status/:newStatus`
- `GET /invoices`
- `GET /invoices/:id`
- `POST /invoices`
- `GET /invoices/:id/a4`
- `GET /invoices/:id/pdf` if supported
- `POST /invoices/:id/send` if supported

Test scenarios:

- create sale with active shift requirement
- add, update, and remove sale items
- hold and resume sale
- cancel sale before completion
- apply single and multi-method payments
- complete sale and verify:
  - payment state
  - inventory deduction
  - shift total updates
  - audit log
  - receipt generation
- refund full and partial sale
- return/exchange with payment difference handling
- receipt JSON, printable HTML, and print-job output
- receipt setting toggles affecting receipt output
- payment reconciliation and cash drawer summaries
- invoice creation from sale and document rendering

### 13. Imports and Exports
Endpoints and stories:

- `GET /exports/products`
- `GET /exports/customers`
- `GET /exports/suppliers`
- `GET /exports/inventory`
- `GET /exports/sales`
- `POST /imports/products`
- `POST /imports/customers`
- `POST /imports/suppliers`

Test scenarios:

- export file generation, headers, content type, and tenant scoping
- import valid file with created/updated row counts
- import partial failure reporting
- reject invalid template/column types
- large-file performance and duplicate handling

### 14. Super Admin, Subscriptions, Support
Endpoints and stories:

- `GET /admin/tenants`
- `GET /admin/tenants/:id`
- `PUT /admin/tenants/:id/status`
- `GET /admin/tenants/:id/usage`
- `GET /admin/plans`
- `POST /admin/plans`
- `GET /admin/plans/:id`
- `PUT /admin/plans/:id`
- `DELETE /admin/plans/:id`
- `GET /admin/subscriptions`
- `GET /admin/subscriptions/:id`
- `PUT /admin/subscriptions/:id`
- `GET /admin/tickets`
- `GET /admin/tickets/:id`
- `POST /admin/tickets`
- `PUT /admin/tickets/:id/assign`
- `PUT /admin/tickets/:id/status`

Test scenarios:

- tenant listing, filtering, and usage metrics
- suspend/deactivate/reactivate tenant status changes
- prevent suspended tenant access to protected tenant APIs
- plan CRUD and subscription reassignment
- support ticket creation, assignment, status changes, filtering, and message retrieval
- role boundary between `SUPER_ADMIN`, `SUPPORT_ADMIN`, and `BILLING_ADMIN`

## Error and Resilience Tests
Explicitly test shared behaviors from the user stories:

- `401` returns for missing/expired token
- `403` returns for insufficient role
- `404` for missing resource IDs
- `409` for illegal state transitions or duplicates
- `429` for throttled auth or burst traffic
- `500` handling returns sanitized error payloads

Also add:

- idempotency expectations for retries where appropriate
- concurrent sale completion against same stock
- concurrent stock adjustment and transfer races
- concurrent shift open attempts for same user

## Data Integrity Assertions
For state-changing tests, assert:

- inventory balances are correct
- sale totals, tax, and payments reconcile
- store credit balances and history stay consistent
- shift expected cash and discrepancy values are correct
- audit records are created for protected actions
- tenant IDs on written data match authenticated user tenant

## Documentation Gap List
The source documents do not fully align. The test plan should treat these as clarification items and either:

- create contract tests from the implemented API, or
- block release until docs are corrected.

Known gaps found while reading the docs:

- user stories use `POST /auth/change-password`, but the API endpoint table does not list it
- stories mention `PATCH /tenants/me/settings`; API docs list `PATCH /tenants/me` and `PATCH /tenants/me/details`
- stories use `POST /products/:id/images`; API docs use `/upload-image` and `/upload-images`
- stories use `POST /inventory/transfer` and `POST /inventory/stocktake`; API docs use `/inventory/transfers` and `/inventory/stocktakes`
- stories rely on `GET /sales`, `PATCH /sales/:id/items/:itemId`, and `POST /sales/:id/payments`; these are not listed in the sales endpoint table
- stories include `POST /sales/:id/return-exchange`; API docs show refund but not return/exchange
- stories include customer delete and store-credit endpoints; API docs only document list/get/history/create/update for customers
- stories include supplier delete; API docs do not
- stories include receipt settings `GET /sales/settings/receipt`; API docs only show the patch operation in examples
- stories include `GET /invoices/:id/pdf` and `POST /invoices/:id/send`; API docs show `GET /invoices/:id/a4`
- stories mention `GET /shifts/cash-drawer/summary`; API docs show cash-drawer reporting under `/payments/cash-drawer`
- stories reference `GET /metrics`; API docs document `GET /health` but not a metrics endpoint table entry

## Automation Plan
Recommended implementation split:

1. Unit tests
   - auth, guards, DTOs, tax calculation, inventory math, receipt generation, invoice templates, shift reconciliation
2. Integration tests
   - tenant config, product/inventory, customers/store credit, sales/payments, shifts, imports/exports
3. E2E smoke suite
   - register -> login -> create branch -> create product -> open shift -> create sale -> pay -> complete -> receipt -> invoice
4. E2E role suite
   - same endpoint matrix across `ADMIN`, `MANAGER`, `SALES_REP`, `SUPER_ADMIN`, `SUPPORT_ADMIN`, `BILLING_ADMIN`
5. E2E tenant-isolation suite
   - cross-tenant access attempts on all ID-based resources
6. Reliability/load suite
   - auth throttling, concurrent sale completion, batch imports, analytics on realistic data volume

## Exit Criteria
- every documented feature is mapped to at least one passing automated test
- all role and tenant isolation tests pass
- no P1 or P2 defects remain open
- documentation gaps are resolved or accepted with explicit sign-off
- critical workflow smoke suite passes in CI

## Suggested Deliverables
- feature-to-test-case traceability matrix
- API authorization matrix
- seeded test-data catalog
- CI suites:
  - `unit`
  - `integration`
  - `e2e-smoke`
  - `e2e-roles`
  - `e2e-isolation`
  - `load`
