# Nimbus — a full-stack e-commerce platform

A portfolio-grade online store: a decoupled Next.js storefront, an Express/PostgreSQL API, real business logic (inventory, coupons, Stripe payments, order lifecycle), and a working admin console — built to demonstrate production engineering habits, not just CRUD screens.

> **This is a demo project.** No real payments are processed. See [What's real vs. structured for v2](#whats-real-vs-structured-for-v2) for an honest breakdown of scope.

## Table of contents

- [Why this project exists](#why-this-project-exists)
- [Tech stack](#tech-stack)
- [Feature list](#feature-list)
- [Architecture](#architecture)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Folder structure](#folder-structure)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Security](#security)
- [Deployment](#deployment)
- [What's real vs. structured for v2](#whats-real-vs-structured-for-v2)
- [v2 ideas](#v2-ideas)

## Why this project exists

Most portfolio e-commerce projects are a product list, a cart, and a fake checkout. This one is built to survive the follow-up questions in a technical interview: *how do you stop a coupon from being double-applied? What happens if two people buy the last item at once? Why is the refresh token stored the way it is? How do you know the build actually works?* Every module below was built, then **run** — against a real Postgres database, through a real browser, and (for the API image) inside a real Docker container — not just typechecked.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Server Components for SEO-critical catalog pages, Client Components + RTK Query for the authenticated app shell |
| Backend | Node.js + Express | Layered architecture (routes → controllers → services → Prisma), decoupled from the frontend |
| Database | PostgreSQL + Prisma | Relational integrity for orders/inventory/payments; migrations are a real interview artifact |
| Auth | JWT access token (15m, stateless) + opaque refresh token (rotated, stored hashed, revocable) | Access tokens never touch a DB; refresh tokens support real revocation, which a pure JWT can't |
| State | Redux Toolkit + RTK Query | Cache tags, silent-refresh-and-retry on 401, one official pairing instead of mixing libraries |
| Styling | Tailwind CSS | Small internal component library (Button, Input, Badge, StarRating, Pagination, …) |
| Payments | Stripe Checkout (test mode) + webhook, **or** a built-in mock gateway | Runs out of the box with zero external accounts; upgrades to real Stripe the moment `STRIPE_SECRET_KEY` is set |
| Media | Cloudinary signed direct-upload, or paste-a-URL | No hard dependency on a Cloudinary account to use the admin panel |
| Caching | Redis (optional) | Product-list cache + shared rate-limit store; the app runs identically without it, just uncached |
| Testing | Vitest + Supertest | Integration tests against a real Postgres test database |
| CI/CD | GitHub Actions, Docker | Lint, typecheck, test, and build every push; a working multi-stage Dockerfile for the API |

## Feature list

**Customer-facing store**
- Home page: auto-rotating hero carousel, category tiles, a deal-of-the-day panel, a value-props strip, promo banners, brand strip, category showcase, storefront stats, and featured/new-arrival/trending shelves - snap-scrolling rails on mobile so it stays browsable instead of one long column
- Product listing: typo-tolerant search that degrades gracefully instead of ever going empty (see [Architecture](#architecture)), filter (category incl. subcategories, brand, price range, rating, stock, sale), 5 sort modes, pagination; on mobile, filters and sort live behind a bottom sheet reached from a sticky bar, so the product grid is the first thing on screen instead of a wall of filter controls
- Product detail: image gallery with zoom lightbox, variant (size/color) selection, live stock, rating breakdown, related products, recently-viewed (localStorage), Product JSON-LD for SEO; a sticky Add-to-cart/Buy-now bar reappears on mobile once the real buttons scroll out of view
- Cart: persistent for logged-in users, a localStorage-token guest cart that survives login via server-side merge, live price/stock reconciliation on every read
- Checkout: guest or logged-in, coupon preview, server-computed subtotal/discount/shipping/tax/total, Stripe Checkout redirect
- Orders: invoice-style confirmation (works for guests via an unguessable order id), order history, a full fulfillment lifecycle (Pending → Paid → Processing → Shipped, with an optional tracking number/courier → Delivered), a status timeline, cancellation, per-item return requests
- Notifications: a bell in the navbar with unread count and mark-read, backed by real persisted rows (not just a log line) - a customer is notified at every order status change, tracking number included in the shipped message
- Reviews: one per user per product, auto-flagged verified-purchase, rating aggregate recomputed on write
- Wishlist: heart-toggle on cards and PDP

**Account**
- Register/login/logout, forgot/reset password, change password, profile edit, address book with single-default enforcement

**Admin console** (`/admin`, role-gated)
- Dashboard: revenue broken into gross / confirmed (delivered) / pending (paid, still in transit) / refunded - not one number that conflates money collected with money actually earned - plus orders/customers/low-stock stat tiles, a hand-built SVG revenue chart, order-status breakdown, recent orders
- Products: full CRUD with dynamic variant and image rows
- Categories: tree view with subcategories, inline CRUD
- Orders: status-filterable table, detail view with the same transition rules the backend enforces (the allowed-transitions table lives once in `packages/shared`, imported by both), tracking number/courier capture on the Shipped transition
- Users: role changes, activate/deactivate (with a guard against self-lockout)
- Coupons and banners: CRUD with active/inactive toggling
- Notified (same bell as the customer view, since the admin console sits under the same navbar) when a customer places or cancels an order

**Engineering depth**
- Layered backend (routes/controllers/services), zod validation shared between frontend and backend from one `@ecommerce/shared` package
- RBAC middleware, audit log on every admin mutation, soft delete on Product/Category/User
- Inventory decrements on payment confirmation (not on checkout start), restocks on cancellation/return
- Rate limiting (tiered: auth/checkout stricter than general browsing; token refresh has its own higher ceiling since it fires on every page load, not just a deliberate auth attempt), helmet, CORS allowlist
- Redis-backed product-list caching with tag-based invalidation on admin writes
- Stripe webhook signature verification against the raw request body
- Typo-tolerant search via Postgres `pg_trgm`, with a popularity fallback when even a fuzzy match finds nothing - no separate search service required

## Architecture

```
┌──────────────────┐        REST / JSON         ┌───────────────────┐
│   apps/web        │ ─────────────────────────▶ │   apps/api         │
│   Next.js 14       │ ◀───────────────────────── │   Express + Prisma  │
│   (Vercel)          │                            │   (Render, Docker)   │
└──────────────────┘                            └─────────┬─────────┘
                                                             │
                                        ┌────────────────────┼────────────────────┐
                                        ▼                    ▼                    ▼
                                  PostgreSQL              Redis (opt.)        Stripe / Cloudinary
```

- **Server Components fetch directly from the API** for public, SEO-critical pages (home, listing, product detail) - no caching layer duplicated on the frontend, ISR-style `fetch` revalidation instead.
- **Client Components + RTK Query** power everything behind a login (cart, checkout, account, admin) - a `baseQueryWithReauth` wrapper transparently exchanges an expired access token for a new one via the httpOnly refresh cookie and retries the original request once.
- **The access token lives only in memory** (Redux state), never localStorage; a silent-refresh call on app mount exchanges the refresh cookie for a fresh access token after a hard reload. A shared in-flight refresh promise, plus a short server-side grace window on token reuse, absorbs the race that a cold page load can cause (e.g. returning from a payment redirect) without misreading it as token theft.
- **Checkout totals are computed exactly once, server-side** (`computeOrderTotals`), from the reconciled cart - the client never supplies a price the server trusts.
- **Payment confirmation is webhook-driven**, never inferred from the client's redirect back to the success page - the order is marked paid, stock decremented, and the cart cleared inside `markOrderPaid`, which is idempotent because Stripe can redeliver webhooks.
- **Search degrades instead of going empty**: a broadened substring match (name, description, brand, category) runs first; if that finds nothing, a Postgres `pg_trgm` trigram-similarity query catches typos; if even that finds nothing, the same category/brand/price filters fall back to showing popular products instead of a blank grid. Each tier still respects whatever filters the user set, and the UI states plainly which tier produced the results (the same "no exact matches, here's what's close" pattern as Amazon/Flipkart).
- **Order fulfillment and revenue are one flow, not two**: reversing a paid order (cancel or return) restocks inventory *and* moves `paymentStatus` to `REFUNDED` in the same transaction, so the admin dashboard's revenue breakdown reconciles exactly (gross = confirmed + pending) instead of a reversed sale inflating "revenue" forever.

## Database schema

Postgres via Prisma (`packages/db/prisma/schema.prisma`), 22 models:

| Domain | Models |
|---|---|
| Identity | `User`, `RefreshToken`, `PasswordResetToken`, `Address` |
| Catalog | `Category` (self-referential for subcategories), `Brand`, `Product`, `ProductVariant`, `ProductImage`, `InventoryLog` |
| Engagement | `Review`, `WishlistItem` |
| Cart | `Cart`, `CartItem` |
| Promotions | `Coupon`, `Banner` |
| Orders | `Order`, `OrderItem` (immutable purchase snapshot), `OrderStatusHistory`, `ReturnRequest` |
| Notifications | `Notification` |
| Ops | `AuditLog` |

Notable design choices: money fields are `Decimal`, never `Float`; `OrderItem` snapshots product name/price/image at purchase time so a later product edit can never rewrite history; `Product.avgRating`/`ratingCount` are denormalized and recomputed from `Review` on every write (traded for read-speed on the most-viewed page in the app); `Product.name` carries a GIN trigram index (`pg_trgm`) for typo-tolerant search without standing up a separate search service; a paid order's `paymentStatus` moves to `REFUNDED` (not just `status` to `CANCELLED`/`RETURNED`) the moment it's reversed, so revenue reporting reconciles instead of counting a reversed sale forever.

## API reference

All routes are namespaced under `/api`. Full request/response shapes live in `packages/shared`'s zod schemas (the same schemas validate both the API and, where applicable, the frontend forms).

| Group | Routes |
|---|---|
| `auth` | register, login, refresh, logout, forgot-password, reset-password, me |
| `users` | profile update, change-password, `/addresses` CRUD |
| `products` | list (search/filter/sort/paginate), detail by slug, related, by-ids |
| `categories` | tree, detail by slug |
| `brands` | list |
| `banners` | active list |
| `cart` | get, add/update/remove item, merge (guest → user) |
| `coupons` | validate |
| `checkout` | create session |
| `orders` | confirmation (public by id), list mine, detail, cancel, return request |
| `reviews` | list by product, create |
| `wishlist` | list, ids, add, remove |
| `notifications` | list mine (with unread count), mark one read, mark all read |
| `webhooks` | Stripe (raw body, signature-verified) |
| `admin/*` | dashboard stats; products/categories/brands/banners/coupons CRUD; orders list/detail/status/returns; users list/role/status; upload signature |

## Folder structure

```
apps/
  web/     Next.js 14 (App Router) - src/app, src/components, src/store (Redux + RTK Query)
  api/     Express - src/modules/<feature>/{service,controller,routes}.ts, src/middleware, src/config
packages/
  db/      Prisma schema, migrations, seed script, generated client
  shared/  zod schemas + enums + types used by both apps
.github/workflows/  CI
```

## Getting started

**Prerequisites:** Node 20+, Docker (for local Postgres/Redis), npm.

```bash
git clone <this-repo>
cd nimbus
npm install

# copy env files and fill in secrets (JWT secrets can be any long random string for local dev)
cp .env.example .env
cp packages/db/.env.example packages/db/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

docker compose up -d          # Postgres on 15432, Redis on 6380 (remapped to avoid clashing with other local projects/ports)
npm run prisma:migrate:deploy # apply migrations
npm run prisma:seed           # seed categories/products/coupons/admin+customer accounts

npm run dev:api               # http://localhost:4000
npm run dev:web               # http://localhost:3000
```

**Demo accounts** (created by the seed script):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin123!` |
| Customer | `customer@example.com` | `Customer123!` |

Checkout works immediately with no Stripe account: leave `STRIPE_SECRET_KEY` unset and the built-in mock gateway marks the order paid instantly. To exercise the real Stripe path, set `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` (test mode) and forward webhooks locally with `stripe listen --forward-to localhost:4000/api/webhooks/stripe`.

## Testing

```bash
npm run test --workspace=apps/api   # Vitest + Supertest against a real Postgres test database
npm run lint                        # ESLint, both apps
npm run typecheck                   # every workspace
```

The test suite creates its own database (`ecommerce_test_db`) and truncates it between files; see `apps/api/tests/setup.ts` for the one-time setup. Covers: registration/login/refresh-rotation/enumeration-safe errors, the refresh-token race a payment-return page load can cause (forgiven within a grace window, still revoked if genuinely replayed later), cart math and stock enforcement, coupon-gated checkout end-to-end (stock decrement, cart clearing), admin RBAC (401/403/200, self-role-change guard), the full order status transition table (including the Processing step and tracking-number capture), notification fan-out on order placed/cancelled, revenue reconciliation after a cancellation, and product search's exact/fuzzy/suggested fallback tiers.

## Security

- Passwords hashed with bcrypt (cost 12); access tokens are short-lived and stateless; refresh tokens are opaque, hashed at rest, rotated on every use, with reuse-detection that revokes all of a user's sessions if a stale token is replayed - except within a short grace window that forgives the legitimate race a cold page load can cause (e.g. two tabs, or returning from a payment redirect while a background request is also refreshing), so a real client isn't punished as if it were theft
- Every request body/query is validated with zod at the API boundary; the same schemas are reused on the frontend
- helmet, CORS allowlist, tiered rate limiting (login/register/checkout stricter than general traffic; token refresh has its own higher ceiling since an active session reaches double digits on its own)
- RBAC middleware gates the entire `/api/admin` namespace in one place, not per-route
- Checkout totals, coupon validity, and stock are always re-derived server-side - never trusted from the client
- Admin mutations write to an `AuditLog`; Product/Category/User use soft delete (`deletedAt`) rather than hard delete
- Centralized error handler never leaks stack traces in production

## Deployment

**API → Render.** `render.yaml` at the repo root is a Render Blueprint: import the repo at render.com, it provisions a managed Postgres, a managed Redis, and a Docker web service from `apps/api/Dockerfile`. Fill in the `sync: false` values (CORS origin, Stripe/Cloudinary/SMTP keys) in the dashboard. Migrations run automatically on every container start (`prisma migrate deploy` before the server boots).

**Web → Vercel.** Set the project's Root Directory to `apps/web`; `apps/web/vercel.json` supplies the monorepo-aware install/build commands. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed API's URL.

**Local Docker verification:** the API image was built and run against the project's real Postgres container as part of building this project (not just typechecked) - `docker build -f apps/api/Dockerfile -t nimbus-api .` from the repo root, then run with the same env vars as `apps/api/.env.example`.

## What's real vs. structured for v2

Everything in the feature list above is fully working, not mocked. A few things are intentionally structural-but-not-wired-to-a-paid-provider, so the project runs with zero external accounts:

| Feature | Status |
|---|---|
| Payments | Real Stripe Checkout + webhook when `STRIPE_SECRET_KEY` is set; a mock gateway (no real charge) otherwise |
| Image upload | Real Cloudinary signed-upload endpoint when configured; admin forms otherwise accept a pasted image URL |
| In-app notifications (order placed/processing/shipped/delivered/cancelled) | Real - persisted `Notification` rows, a navbar bell with unread count for both customer and admin, no external provider needed |
| Email (password reset, order confirmation, notifications) | `NotificationService` interface with a console/log provider wired in; swap in an SMTP/SendGrid/SES implementation without touching call sites |
| Product search | Real - broadened exact match → `pg_trgm` fuzzy typo-tolerance → popularity fallback; no external search service required |
| Abandoned cart reminders | Not built - the cart/order data model supports it, but no scheduled job exists yet |
| Product Q&A | Not built - would extend the `Review` model |

## v2 ideas

- Scheduled job (abandoned-cart emails, coupon-expiry notices) using the existing `NotificationService`
- Real transactional email provider
- Stock **reservation** at checkout-session creation (today, stock is checked at checkout and decremented at payment confirmation - a real race window exists between the two, same as most Checkout-Session-based integrations without a holds system)
- Product Q&A, extending the review data model
- Dedicated search infra (Meilisearch/Algolia/Elasticsearch) or Postgres `tsvector` ranked full-text search, if the catalog ever grows past what broadened-substring + `pg_trgm` fuzzy matching comfortably scales to
- Real-time notifications (WebSocket/SSE) in place of the current 30s poll
- Multi-currency / multi-region tax rules in place of the current flat-rate tax
