import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import type { DatabaseConfig } from "./config";
import * as authSchema from "./schema/auth";
import * as integrationSchema from "./schema/integration";
import * as offersSchema from "./schema/offers";

const schema = { ...authSchema, ...integrationSchema, ...offersSchema };

export const createDb = (env: DatabaseConfig) => {
  const sql = neon(env.DATABASE_URL);
  return drizzle(sql, { schema });
};

export type Database = ReturnType<typeof createDb>;
