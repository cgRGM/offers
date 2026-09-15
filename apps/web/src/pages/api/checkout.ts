import type { APIRoute } from "astro";
import { z } from "zod";

import { env } from "../../env.server";
import { json, parseJson } from "../../lib/http";
import { hasOfferAccess, OFFER_ACCESS_COOKIE } from "../../lib/offer-access";
import { OFFER_TIERS } from "../../lib/offer-tiers";
import type { PaymentType } from "../../lib/offer-tiers";
import { findOfferBySlug, updateOffer } from "../../lib/offers";
import { createIntegrationIdentifier, getStripe } from "../../lib/stripe";
import { getDb } from "../../services";

const checkoutSchema = z.object({
  paymentType: z.enum(["deposit", "full"]).default("deposit"),
  slug: z.string().trim().min(1).max(80),
  tier: z.enum(["launch", "manage", "grow"]),
});

const getOfferUrl = (slug: string, query?: { paid?: string }) => {
  const url = new URL(`/${slug}`, env.OFFERS_BASE_URL);
  if (query?.paid) {
    url.searchParams.set("paid", query.paid);
  }
  return url.toString();
};

const getAmount = (
  tier: keyof typeof OFFER_TIERS,
  paymentType: PaymentType
) => {
  const config = OFFER_TIERS[tier];
  return paymentType === "full" ? config.totalCents : config.depositCents;
};

export const POST: APIRoute = async ({ cookies, request }) => {
  const input = checkoutSchema.safeParse(await parseJson(request));
  if (!input.success) {
    return json({ error: "Invalid checkout request" }, 400);
  }

  if (
    !hasOfferAccess(
      cookies.get(OFFER_ACCESS_COOKIE)?.value,
      input.data.slug,
      env.PAGE_SECRET
    )
  ) {
    return json({ error: "Unauthorized" }, 401);
  }

  const database = getDb();
  const found = await findOfferBySlug(database, input.data.slug);
  if (!found || found.archived) {
    return json({ error: "Offer not found" }, 404);
  }

  if (found.declined) {
    return json({ error: "This offer is no longer available" }, 409);
  }

  if (found.paid) {
    return json({ error: "This offer has already been paid" }, 409);
  }

  const tier = OFFER_TIERS[input.data.tier];
  const amount = getAmount(input.data.tier, input.data.paymentType);
  const stripe = getStripe();

  try {
    let customerId = found.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: found.contactEmail,
        metadata: { offer_slug: found.slug },
        name: found.businessName,
      });
      customerId = customer.id;
      await updateOffer(database, found.id, {
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      });
    }

    const session = await stripe.checkout.sessions.create({
      cancel_url: getOfferUrl(found.slug),
      customer: customerId,
      integration_identifier: createIntegrationIdentifier(),
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              description:
                input.data.paymentType === "full"
                  ? `${tier.label} website build paid in full`
                  : `${tier.label} website build deposit`,
              name: `${found.businessName} — ${tier.label}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        businessName: found.businessName,
        paymentType: input.data.paymentType,
        slug: found.slug,
        tier: input.data.tier,
      },
      mode: "payment",
      payment_intent_data: {
        description: `${found.businessName} — ${tier.label} ${input.data.paymentType}`,
        metadata: {
          paymentType: input.data.paymentType,
          slug: found.slug,
          tier: input.data.tier,
        },
        receipt_email: found.contactEmail,
        setup_future_usage: "off_session",
      },
      submit_type: "pay",
      success_url: getOfferUrl(found.slug, { paid: "1" }),
    });

    await updateOffer(database, found.id, {
      stripeCheckoutSessionId: session.id,
      updatedAt: new Date(),
    });

    if (!session.url) {
      return json({ error: "Checkout is unavailable" }, 503);
    }

    return json({ url: session.url });
  } catch {
    return json({ error: "Checkout is unavailable right now" }, 503);
  }
};
