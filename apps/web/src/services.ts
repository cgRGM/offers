import { createAuth } from "@rtloffers/auth";
import { createDb } from "@rtloffers/db";
import type { Database } from "@rtloffers/db";

import { env } from "./env.server";

const db = createDb(env);

export const getDb = (): Database => db;
export const auth = createAuth(env, db);
