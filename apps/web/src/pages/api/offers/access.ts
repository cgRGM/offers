import type { APIRoute } from "astro";
import { z } from "zod";

import { env } from "../../../env.server";
import { json, parseJson } from "../../../lib/http";
import {
  createOfferAccessToken,
  OFFER_ACCESS_COOKIE,
  OFFER_ACCESS_MAX_AGE,
} from "../../../lib/offer-access";
import { isOfferAccessRateLimited } from "../../../lib/offer-rate-limit";
import { findOfferBySlug } from "../../../lib/offers";
import { getDb } from "../../../services";

const accessSchema = z.object({
  email: z.email(),
  slug: z.string().trim().min(1).max(80),
});

const getClientAddress = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

export const POST: APIRoute = async ({ cookies, request }) => {
  const input = accessSchema.safeParse(await parseJson(request));
  if (!input.success) {
    return json({ error: "Enter a valid email address" }, 400);
  }

  const rateLimitKey = `${getClientAddress(request)}:${input.data.slug}`;
  if (isOfferAccessRateLimited(rateLimitKey)) {
    return json(
      { error: "Too many attempts. Please try again in a minute." },
      429
    );
  }

  const found = await findOfferBySlug(getDb(), input.data.slug);
  const emailMatches =
    found?.contactEmail.toLowerCase() === input.data.email.trim().toLowerCase();

  if (!found || found.archived || !emailMatches) {
    return json({ error: "No offer was found for that email address." }, 403);
  }

  cookies.set(
    OFFER_ACCESS_COOKIE,
    createOfferAccessToken(found.slug, env.PAGE_SECRET),
    {
      httpOnly: true,
      maxAge: OFFER_ACCESS_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    }
  );

  return json({ ok: true });
};
