# PTLPOS Backlog

This file tracks delivery progress for the `ptlpos` backend and serves as the working backlog during implementation.

## Status Legend

- `[x]` Done
- `[-]` In progress
- `[ ]` Not started
- `[!]` Blocked / needs decision

## Current Baseline

Implemented in codebase:

- [x] NestJS project scaffold
- [x] Prisma schema for multi-tenant core entities
- [x] Redis service wrapper
- [x] Request context guard using tenant/user headers
- [x] RBAC guard structure
- [x] Audit log service
- [x] Products module
- [x] Inventory module with ledger writes
- [x] Customers module
- [x] Sales module
- [x] Payments module
- [x] Analytics dashboard module
- [x] Prisma seed script

Not yet verified in runtime:

- [x] Dependency install
- [x] Prisma client generation
- [!] Database push/migration (requires local DB)
- [x] TypeScript build
- [-] Unit test harness
- [!] API smoke testing (requires local DB)

## Milestone 1: Foundation

- [x] Create NestJS modular monolith structure
- [x] Define Prisma schema for MVP and core post-MVP entities
- [x] Add Prisma service/module
- [x] Add Redis integration wrapper
- [x] Add environment template and README
- [x] Add ESLint and Prettier config files
- [-] Add Jest test harness and unit tests
- [x] Add exception filter / unified API error shape
- [x] Add request logging / response timing interceptor

## Milestone 2: Identity, Tenant Isolation, RBAC

- [x] Add request-scoped auth context bootstrap
- [x] Add role decorator and roles guard
- [x] Implement JWT auth
- [x] Add refresh token flow
- [x] Persist tenant-aware login sessions
- [x] Add password hashing during user creation flow
- [x] Build users module
- [x] Build roles module
- [x] Build tenants module
- [x] Replace header-based auth bootstrap with real auth guard

## Milestone 3: Product Catalog

- [x] Create products module
- [x] Support simple products
- [x] Support variant products
- [x] Create inventory row on product creation
- [x] Cache product list in Redis
- [x] Add composite product handling logic
- [x] Add SKU search endpoint
- [x] Add product pagination/filter DTOs
- [x] Add low-stock query endpoint
- [x] Add product image/media support (Supabase Storage)

## Milestone 4: Inventory

- [x] Create inventory snapshot table
- [x] Create inventory ledger table
- [x] Manual adjustment endpoint
- [x] Inventory history endpoint
- [x] Prevent negative stock in adjustment flow
- [x] Maintain audit trail for adjustments
- [x] Add low-stock alerts
- [x] Add inventory valuation strategy decision
- [x] Add stock recount / stocktake flow
- [x] Add transfer-ready schema design for multi-branch

## Milestone 5: POS Sales Engine

- [x] Create sale
- [x] Attach customer to sale
- [x] Hold sale
- [x] Resume sale
- [x] Cancel sale
- [x] Complete sale in one DB transaction
- [x] Deduct inventory in completion flow
- [x] Record payments
- [x] Support split payments
- [x] Basic refund flow
- [x] Receipt reprint payload
- [x] Concurrency control with stock row locking
- [x] Add add/remove line items after draft sale creation
- [x] Enforce payment-total reconciliation rule on completion
- [x] Add partial refund support
- [x] Add cart-level tax configuration
- [x] Add item-level override tax configuration
- [x] Add invoice entity linkage to completed sale
- [x] Add receipt number / sale number strategy

## Milestone 6: Customers

- [x] Create customer
- [x] List customers
- [x] Update customer
- [x] Get customer details endpoint
- [x] Add customer history endpoint
- [x] Add duplicate detection rules for phone/email

## Milestone 7: Payments and Reconciliation

- [x] Payment model
- [x] Payment create endpoint
- [x] Payment linkage to sale
- [x] Refund payment records
- [x] Add reconciliation summary endpoint
- [x] Add payment status / external reference policy
- [x] Add cash drawer balancing requirements

## Milestone 8: Dashboard and Analytics

- [x] Daily revenue metric
- [x] Sales count metric
- [x] Top products metric
- [x] Add date-range filters
- [x] Add hourly sales breakdown
- [x] Add top customers metric
- [x] Add profit estimation groundwork

## Milestone 9: Invoicing

- [x] Basic receipt payload for 80mm format
- [x] Generate printable receipt template
- [x] Add invoice persistence model
- [x] Add basic invoice generation endpoint
- [ ] Add A4 invoice post-MVP design
- [x] Add invoice numbering strategy

## Milestone 10: Audit and Observability

- [x] Audit log table
- [x] Audit writes for critical flows
- [x] Expose audit log query endpoint
- [x] Add structured application logs
- [x] Add health check endpoint
- [ ] Add metrics/monitoring integration decision

## Milestone 11: Procurement

- [x] Purchase order schema
- [x] Supplier schema
- [x] Implement suppliers module
- [x] Implement purchase orders module
- [x] Implement stock receiving flow
- [x] Write purchase inventory transactions

## Milestone 12: Production for Bakery

- [x] Recipe schema
- [x] Production batch schema
- [x] Implement recipes module
- [x] Implement production run endpoint
- [x] Deduct raw materials from recipe
- [x] Increase finished goods inventory
- [x] Write production inventory transactions

## Milestone 13: Multi-Branch Readiness

- [ ] Add branch/store model
- [ ] Scope inventory by branch
- [ ] Scope sales by branch
- [ ] Design branch transfer flow
- [ ] Update tenant isolation rules for branch-aware access

## Milestone 14: Offline POS Readiness

- [ ] Define sync contract for offline sales
- [ ] Define conflict resolution strategy
- [ ] Add client-generated idempotency key support
- [ ] Add replay-safe sale completion design

## Immediate Next Tasks

- [x] Create backlog tracker
- [x] Install dependencies and verify build
- [x] Generate Prisma client
- [ ] Push schema to PostgreSQL (requires local DB)
- [ ] Seed initial tenant, roles, and admin user (requires local DB)
- [x] Add unit test harness and first service tests
- [ ] Test product creation and inventory adjustment endpoints (requires local DB)
- [ ] Test sale completion and refund end-to-end (requires local DB)
- [x] Add audit log query endpoint
- [x] Add payment reconciliation summary endpoint
- [x] Add analytics date-range and richer dashboard metrics
- [x] Add health check endpoint
- [x] Implement JWT auth
- [x] Add draft sale item mutation endpoints
- [x] Add customer detail and history endpoints
- [x] Add invoice model and basic invoice generation

## Decisions Needed

- [x] Auth approach after bootstrap: JWT + refresh tokens (implemented)
- [!] Tax model: global tenant tax settings or per-product default with per-sale override
- [!] Sale numbering format
- [!] Invoice numbering format
- [!] Low-stock threshold scope: tenant-wide default or per-product
- [!] Multi-branch timing: before procurement/production or after

## Change Log

- `2026-04-16`: Initial backlog created from engineering source of truth and current codebase state.
- `2026-04-16`: Added Jest-based unit test harness and first tests for inventory, payments, and sales services.
- `2026-04-16`: Added draft-sale item mutation endpoints with total recalculation and service-level tests.
- `2026-04-16`: Added customer detail/history endpoints with unit coverage.
- `2026-04-16`: Added audit log query endpoint with unit coverage.
- `2026-04-16`: Added tenant-scoped customer duplicate detection for email and phone with unit coverage.
- `2026-04-16`: Added payment reconciliation summary endpoint with unit coverage.
- `2026-04-17`: Added analytics date-range filters, top customers, hourly sales breakdown, and health endpoint with unit coverage.
- `2026-04-17`: Added low-stock inventory query endpoint with unit coverage.
- `2026-04-17`: Added invoice persistence and invoice generation endpoints with unit coverage.
- `2026-04-17`: Added invoice retrieval coverage and marked invoice linkage/numbering baseline complete.
- `2026-04-17`: Added partial refund support with unit coverage and aligned payment-total reconciliation status.
- `2026-04-17`: Added persisted cart/item tax overrides for sales with unit coverage of tax resolution order.
- `2026-04-17`: Added product query DTOs, SKU/text/type filtering, and product list unit coverage.
- `2026-04-17`: Added persisted sale/receipt numbering strategy with unit coverage and receipt payload support.
- `2026-04-17`: Added a global structured logging interceptor with request timing and unit coverage.
- `2026-04-17`: Added a global exception filter with unified API error responses and unit coverage.
- `2026-04-17`: Added supplier and purchase-order modules with tenant validation and unit coverage.
- `2026-04-17`: Added purchase receiving flow with inventory updates, purchase ledger transactions, and unit coverage.
- `2026-04-17`: Added recipes module with tenant-scoped validation and unit coverage.
- `2026-04-17`: Added production run flow with raw material deduction, finished goods increase, production batches, and unit coverage.
- `2026-04-17`: Added users, roles, and tenants modules with password hashing and unit coverage.
- `2026-04-18`: Added printable 80mm receipt HTML template endpoint and unit coverage for receipt rendering.
- `2026-04-18`: Added dashboard profit estimation groundwork with revenue, estimated cost, gross profit, gross margin, and unit coverage.
- `2026-04-18`: Added low-stock alert refresh on inventory-changing flows, stale alert cleanup, threshold validation, and unit coverage.
- `2026-04-18`: Added stocktake cancel support, stronger DTO validation, completion guards, and unit coverage for stocktake lifecycle.
- `2026-04-18`: Added cash drawer summary endpoint with branch/date filtering, counted-cash variance, and unit coverage.
- `2026-04-18`: Added inventory valuation summary endpoint using standard cost and unit coverage for valuation totals/items.
- `2026-04-18`: Added branch-to-branch inventory transfer endpoint with ledger writes and unit coverage for transfer validation/movement.
- `2026-04-18`: Added receipt print-job endpoint with browser print trigger and unit coverage for receipt printing integration.
- `2026-04-18`: Added payment external-reference enforcement for card/transfer methods and reconciled sale paid amounts with payment completion status.
- `2026-04-21`: Implemented JWT authentication system with access and refresh tokens, replaced header-based auth with JWT guard, added composite product handling logic, integrated Supabase Storage for product image uploads, added ESLint and Prettier configuration, fixed TypeScript build errors, generated Prisma client, and verified successful build compilation.
