import type { User } from "better-auth";

import { env } from "../env.server";

export const isAdminUser = (user: User | null | undefined) =>
  user?.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
