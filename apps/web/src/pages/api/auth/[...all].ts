import type { APIRoute } from "astro";

import { auth } from "../../../services";

export const ALL: APIRoute = (ctx) => auth.handler(ctx.request);
