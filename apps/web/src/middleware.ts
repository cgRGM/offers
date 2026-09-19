import { defineMiddleware } from "astro:middleware";

import { isAdminUser } from "./lib/admin";
import { getAuth } from "./services";

export const onRequest = defineMiddleware(async (context, next) => {
  const isAuthed = await getAuth().api.getSession({
    headers: context.request.headers,
  });

  if (isAuthed && isAdminUser(isAuthed.user)) {
    context.locals.user = isAuthed.user;
    context.locals.session = isAuthed.session;
  } else {
    context.locals.user = null;
    context.locals.session = null;
  }

  return next();
});
