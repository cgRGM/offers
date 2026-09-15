import type { APIRoute } from "astro";
import { z } from "zod";

import { env } from "../../env.server";
import { hasValidAgentSecret } from "../../lib/agent-secret";
import { json, parseJson } from "../../lib/http";
import { OFFER_TIERS } from "../../lib/offer-tiers";
import { createOffer } from "../../lib/offers";
import { getDb } from "../../services";

const secureUrl = z
  .url()
  .refine((value) => new URL(value).protocol === "https:");

const createOfferSchema = z.object({
  businessName: z.string().trim().min(1).max(160),
  calLink: secureUrl.optional(),
  contactEmail: z.email(),
  demoUrl: secureUrl,
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
});

const getBearerSecret = (request: Request) => {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const secret = authorization.slice("Bearer ".length).trim();
  return secret || null;
};

export const POST: APIRoute = async ({ request }) => {
  if (
    !(await hasValidAgentSecret(
      getDb(),
      getBearerSecret(request),
      env.OFFERS_API_SECRET
    ))
  ) {
    return json({ error: "Unauthorized" }, 401);
  }

  const input = createOfferSchema.safeParse(await parseJson(request));
  if (!input.success) {
    return json({ error: "Invalid offer data" }, 400);
  }

  try {
    const created = await createOffer(getDb(), {
      businessName: input.data.businessName,
      calLink: input.data.calLink,
      contactEmail: input.data.contactEmail.trim().toLowerCase(),
      demoUrl: input.data.demoUrl,
      id: crypto.randomUUID(),
      slug: input.data.slug,
      totalCents: OFFER_TIERS.grow.totalCents,
    });

    return json({
      ok: true,
      url: new URL(`/${created.slug}`, env.OFFERS_BASE_URL).toString(),
    });
  } catch {
    return json({ error: "An offer with that slug already exists" }, 409);
  }
};
