import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const offer = pgTable(
  "offer",
  {
    archived: boolean("archived").default(false).notNull(),
    archivedAt: timestamp("archived_at"),
    businessName: text("business_name").notNull(),
    calLink: text("cal_link"),
    contactEmail: text("contact_email").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    declined: boolean("declined").default(false).notNull(),
    declinedAt: timestamp("declined_at"),
    demoUrl: text("demo_url").notNull(),
    id: text("id").primaryKey(),
    paid: boolean("paid").default(false).notNull(),
    paidAmountCents: integer("paid_amount_cents"),
    paidAt: timestamp("paid_at"),
    paidTier: text("paid_tier"),
    slug: text("slug").notNull(),
    stripeBalanceInvoiceId: text("stripe_balance_invoice_id"),
    stripeBalanceInvoiceItemId: text("stripe_balance_invoice_item_id"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeMonthlyProductId: text("stripe_monthly_product_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    totalCents: integer("total_cents").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("offer_created_at_idx").on(table.createdAt),
    uniqueIndex("offer_slug_uidx").on(table.slug),
  ]
);

export type Offer = typeof offer.$inferSelect;
export type NewOffer = typeof offer.$inferInsert;
