import type { APIRoute } from "astro";
import type StripeClient from "stripe";

import { env } from "../../../env.server";
import { json } from "../../../lib/http";
import { isOfferTier, OFFER_TIERS } from "../../../lib/offer-tiers";
import type { OfferTier } from "../../../lib/offer-tiers";
import { findOfferBySlug, updateOffer } from "../../../lib/offers";
import { getStripe } from "../../../lib/stripe";
import { getDb } from "../../../services";

const TRIAL_PERIOD_SECONDS = 30 * 24 * 60 * 60;

const getPaymentMethodId = (
  paymentIntent: StripeClient.PaymentIntent | null
) => {
  if (!paymentIntent?.payment_method) {
    return;
  }

  return typeof paymentIntent.payment_method === "string"
    ? paymentIntent.payment_method
    : paymentIntent.payment_method.id;
};

const createBalanceInvoice = async ({
  businessName,
  customerId,
  database,
  found,
  paymentType,
  slug,
  stripe,
  tier,
  tierName,
}: {
  businessName: string;
  customerId: string;
  database: ReturnType<typeof getDb>;
  found: NonNullable<Awaited<ReturnType<typeof findOfferBySlug>>>;
  paymentType: string;
  slug: string;
  stripe: StripeClient;
  tier: (typeof OFFER_TIERS)[OfferTier];
  tierName: OfferTier;
}) => {
  if (paymentType !== "deposit") {
    return;
  }

  const balanceAmount = tier.totalCents - tier.depositCents;
  if (balanceAmount <= 0) {
    return;
  }

  let invoice = found.stripeBalanceInvoiceId
    ? await stripe.invoices.retrieve(found.stripeBalanceInvoiceId)
    : await stripe.invoices.create({
        auto_advance: false,
        collection_method: "send_invoice",
        customer: customerId,
        days_until_due: 30,
        description: `${businessName} — ${tier.label} remaining setup balance`,
        metadata: {
          offer_slug: slug,
          tier: tierName,
        },
      });

  if (!found.stripeBalanceInvoiceId) {
    await updateOffer(database, found.id, {
      stripeBalanceInvoiceId: invoice.id,
      updatedAt: new Date(),
    });
  }

  if (!found.stripeBalanceInvoiceItemId) {
    const invoiceItem = await stripe.invoiceItems.create({
      amount: balanceAmount,
      currency: "usd",
      customer: customerId,
      description: `${tier.label} remaining setup balance`,
      invoice: invoice.id,
      metadata: {
        offer_slug: slug,
        tier: tierName,
      },
    });
    await updateOffer(database, found.id, {
      stripeBalanceInvoiceItemId: invoiceItem.id,
      updatedAt: new Date(),
    });
  }

  if (invoice.status === "draft") {
    invoice = await stripe.invoices.finalizeInvoice(invoice.id);
  }

  if (invoice.status === "open") {
    await stripe.invoices.sendInvoice(invoice.id);
  }
};

const fulfillCheckout = async (session: StripeClient.Checkout.Session) => {
  const metadata = session.metadata ?? {};
  const { slug } = metadata;
  const tierName = metadata.tier;
  const { paymentType } = metadata;
  const customerId =
    typeof session.customer === "string" ? session.customer : undefined;

  if (!slug || !customerId || !isOfferTier(tierName) || !paymentType) {
    return;
  }

  const database = getDb();
  const found = await findOfferBySlug(database, slug);
  if (!found || found.archived || found.declined) {
    return;
  }

  if (found.paid && found.stripeSubscriptionId) {
    return;
  }

  const stripe = getStripe();
  const tier = OFFER_TIERS[tierName];
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? await stripe.paymentIntents.retrieve(session.payment_intent)
      : session.payment_intent;
  const paymentMethodId = getPaymentMethodId(paymentIntent);

  if (paymentMethodId) {
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  if (!found.stripeMonthlyProductId) {
    const product = await stripe.products.create({
      metadata: {
        offer_slug: slug,
        tier: tierName,
      },
      name: `${found.businessName} — ${tier.label} monthly website care`,
    });
    await updateOffer(database, found.id, {
      stripeMonthlyProductId: product.id,
      updatedAt: new Date(),
    });
    found.stripeMonthlyProductId = product.id;
  }

  if (!found.stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      default_payment_method: paymentMethodId,
      items: [
        {
          price_data: {
            currency: "usd",
            product: found.stripeMonthlyProductId,
            recurring: { interval: "month" },
            unit_amount: tier.monthlyCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        offer_slug: slug,
        tier: tierName,
      },
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      trial_end: Math.floor(Date.now() / 1000) + TRIAL_PERIOD_SECONDS,
    });
    await updateOffer(database, found.id, {
      stripeSubscriptionId: subscription.id,
      updatedAt: new Date(),
    });
    found.stripeSubscriptionId = subscription.id;
  }

  await createBalanceInvoice({
    businessName: found.businessName,
    customerId,
    database,
    found,
    paymentType,
    slug,
    stripe,
    tier,
    tierName,
  });

  await updateOffer(database, found.id, {
    paid: true,
    paidAmountCents: session.amount_total ?? undefined,
    paidAt: new Date(),
    paidTier: tierName,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntent?.id,
    updatedAt: new Date(),
  });
};

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return json({ error: "Missing signature" }, 400);
  }

  const rawBody = await request.text();
  let event: StripeClient.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return json({ error: "Invalid signature" }, 400);
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as StripeClient.Checkout.Session;
    if (session.payment_status === "paid") {
      try {
        await fulfillCheckout(session);
      } catch {
        return json({ error: "Webhook processing failed" }, 500);
      }
    }
  }

  return json({ received: true });
};
