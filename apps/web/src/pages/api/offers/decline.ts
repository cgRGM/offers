import type { APIRoute } from "astro";

import { json } from "../../../lib/http";
import { findOfferBySlug, updateOffer } from "../../../lib/offers";
import { getDb } from "../../../services";

export const POST: APIRoute = async ({ request }) => {
  let input: { slug?: string };
  try {
    input = (await request.json()) as { slug?: string };
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const slug = input.slug?.trim();
  if (!slug) {
    return json({ error: "Unauthorized" }, 401);
  }

  const found = await findOfferBySlug(getDb(), slug);
  if (!found || found.archived) {
    return json({ error: "Offer not found" }, 404);
  }

  if (!found.declined) {
    await updateOffer(getDb(), found.id, {
      declined: true,
      declinedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return json({ ok: true });
};
