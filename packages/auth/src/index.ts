import type { Database } from "@rtloffers/db";
import * as schema from "@rtloffers/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export interface AuthConfig {
  ADMIN_EMAIL: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
}

export const createAuth = (env: AuthConfig, database: Database) =>
  betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(database, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [],
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.BETTER_AUTH_URL],
    user: {
      validateUserInfo: ({ user }) => {
        if (user.email?.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
          return {
            error: "admin_email_required",
            errorDescription:
              "Only the configured admin account can be created.",
          };
        }
      },
    },
  });
