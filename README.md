# PTLPOS Backend

NestJS + Prisma + PostgreSQL + Redis backend for a multi-tenant POS and retail SaaS.

## Current scope

This scaffold implements the first MVP backend slice:

- multi-tenant request context via headers
- RBAC guard structure
- Prisma schema for MVP and core post-MVP entities
- products with variant support
- inventory ledger and stock adjustments
- customers
- sales lifecycle with transaction-safe completion
- payments and refund recording
- dashboard analytics
- audit logging
- Redis-backed product list caching

## Request context

Until JWT auth is added, authenticated endpoints expect:

- `x-tenant-id`
- `x-user-id`
- `x-user-role` with one of `ADMIN`, `MANAGER`, `SALES_REP`

All routes are served under the `/api` prefix.

Public endpoints:

- `POST /auth/login`

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:push
npm run start:dev
```

## Key endpoints

- `POST /auth/login`
- `GET /auth/me`
- `GET /products`
- `POST /products`
- `PATCH /products/:id`
- `DELETE /products/:id`
- `GET /inventory`
- `POST /inventory/adjust`
- `GET /inventory/history`
- `GET /customers`
- `POST /customers`
- `PATCH /customers/:id`
- `POST /sales`
- `GET /sales/:id`
- `POST /sales/:id/hold`
- `POST /sales/:id/resume`
- `POST /sales/:id/complete`
- `POST /sales/:id/cancel`
- `POST /sales/:id/refund`
- `GET /sales/:id/receipt`
- `POST /payments`
- `GET /analytics/dashboard`

## Notes

- Inventory is tracked in a ledger and mirrored into the `Inventory.quantity` snapshot for fast reads.
- Sale completion uses a single Prisma transaction for inventory deduction, payment recording, sale finalization, and audit logs.
- Stock rows are pessimistically locked with `FOR UPDATE` during sale completion and refund flows.
