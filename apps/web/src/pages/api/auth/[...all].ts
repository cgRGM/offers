import type { APIRoute } from "astro";

import { auth } from "../../../services";

export const ALL: APIRoute = async (ctx) => {
  return auth.handler(ctx.request);
};
