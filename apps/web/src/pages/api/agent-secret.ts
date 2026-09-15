import type { APIRoute } from "astro";

import { isAdminUser } from "../../lib/admin";
import { createAgentSecret } from "../../lib/agent-secret";
import { json } from "../../lib/http";
import { getDb } from "../../services";

export const POST: APIRoute = async ({ locals }) => {
  if (!isAdminUser(locals.user)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const generated = await createAgentSecret(getDb());

  return json({
    createdAt: generated.createdAt.toISOString(),
    ok: true,
    secret: generated.secret,
    secretPrefix: generated.secretPrefix,
  });
};
