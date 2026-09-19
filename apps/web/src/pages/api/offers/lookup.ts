import type { APIRoute } from "astro";

import { json } from "../../../lib/http";
import { findOfferByEmail } from "../../../lib/offers";
import { getDb } from "../../../services";

export const POST: APIRoute = async ({ request }) => {
  let input: { email?: string };
  try {
    input = (await request.json()) as { email?: string };
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const email = input.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return json({ error: "Valid email required" }, 400);
  }

  const found = await findOfferByEmail(getDb(), email);
  if (!found || found.archived) {
    return json({ error: "No offer found for this email" }, 404);
  }

  return json({ slug: found.slug });
};
