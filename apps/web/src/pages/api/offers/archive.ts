import type { APIRoute } from "astro";

import { env } from "../../../env.server";
import { isAdminUser } from "../../../lib/admin";
import { json } from "../../../lib/http";
import { findOfferBySlug, updateOffer } from "../../../lib/offers";
import { getDb } from "../../../services";

export const POST: APIRoute = async ({ locals, request }) => {
  if (!isAdminUser(locals.user)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let input: { slug?: string };
  try {
    input = (await request.json()) as { slug?: string };
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const slug = input.slug?.trim();
  if (!slug) {
    return json({ error: "Invalid offer" }, 400);
  }

  const found = await findOfferBySlug(getDb(), slug);
  if (!found) {
    return json({ error: "Offer not found" }, 404);
  }

  await updateOffer(getDb(), found.id, {
    archived: true,
    archivedAt: new Date(),
    updatedAt: new Date(),
  });

  return json({
    ok: true,
    url: new URL(`/${slug}`, env.OFFERS_BASE_URL).toString(),
  });
};
