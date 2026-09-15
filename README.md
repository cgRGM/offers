# Rocktown Labs Offers

Private, personalized offer pages for Rocktown Labs prospects. Each offer lives at `offers.rocktownlabs.com/{slug}` and can send visitors to Stripe Checkout or the configured Google booking link. The offer URL is the access credential.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Astro** - The web framework for content-driven websites
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better Auth, restricted to the configured admin email
- **Payments** - Stripe Checkout, customer creation, deposits, full payment, balance invoices, and delayed monthly subscriptions
- **Offer API** - Bearer-authenticated creation endpoint for agent workflows
- **Turborepo** - Optimized monorepo build system
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Husky** - Git hooks for code quality

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Local setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update `apps/web/.env` with the values in `apps/web/.env.schema`.
3. Set `OFFERS_BASE_URL` to the deployed offers domain and `DEFAULT_BOOKING_LINK` to the Google booking URL.
4. The agent handoff key can be generated from `/dashboard` after signing in; the first key is shown once for copying into the agent's secure vault.

Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser to see the fullstack application.

## Stripe setup

Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to the web app environment. Point a Stripe webhook at `/api/stripe/webhook` and enable these events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

The app creates Stripe Customers during checkout. After a successful setup or deposit payment, the webhook saves the payment method, creates the monthly subscription with a 30-day trial, and—when the deposit path was selected—creates and sends a balance invoice due in 30 days.

## Agent handoff

The agent only needs the deployed base URL and the current agent handoff key generated in `/dashboard`. Create an offer with:

```bash
curl -X POST "$OFFERS_BASE_URL/api/offers" \
  -H "Authorization: Bearer $OFFERS_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"slug":"tcs-midtown","businessName":"T C’s Midtown","contactEmail":"tcsmidtown@conwaycorp.net","demoUrl":"https://t-c-s-midtown-demo.vercel.app"}'
```

The dashboard is available at `/dashboard` after signing in with the configured admin account. Anyone with an active offer link can view it, pay, book a time, or decline it. Archiving an offer makes its public page return 404. A prospect’s decline is recorded in the dashboard and shows the visitor a confirmation page instead of the offer.

## Environment Configuration

Each app owns its environment schema in `.env.schema`. Varlock generates `src/env.ts` during installation; run `bun run env:generate` after changing a schema. Commit schemas, and keep secrets in ignored env files or your deployment platform.

Import the generated `ENV` accessor in application code. Shared database and auth packages receive configuration or initialized clients from the application. See [Varlock's monorepo guide](https://varlock.dev/guides/monorepos/).

Bun's automatic env loading is disabled in `bunfig.toml`; the framework integration or server bootstrap loads Varlock. Node deployments must include Varlock and its dependencies alongside the app schema.

## Git Hooks and Formatting

- Initialize hooks: `bun run prepare`
- Run checks: `bun run check`

## Project Structure

```
rtloffers/
├── apps/
│   └── web/         # Fullstack application (Astro)
├── packages/
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Oxlint and Oxfmt
