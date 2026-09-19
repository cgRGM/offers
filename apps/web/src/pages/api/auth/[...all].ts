import type { APIRoute } from "astro";

import { getAuth } from "../../../services";

export const ALL: APIRoute = (ctx) => getAuth().handler(ctx.request);
