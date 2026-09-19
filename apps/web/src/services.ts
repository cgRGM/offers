import { createAuth } from "@rtloffers/auth";
import { createDb } from "@rtloffers/db";
import type { Database } from "@rtloffers/db";

import { getEnv } from "./env.server";

let db: Database | undefined;
let auth: ReturnType<typeof createAuth> | undefined;

export const getDb = (): Database => {
  db ??= createDb(getEnv());
  return db;
};

export const getAuth = (): ReturnType<typeof createAuth> => {
  auth ??= createAuth(getEnv(), getDb());
  return auth;
};
