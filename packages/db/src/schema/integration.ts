import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const agentSecret = pgTable(
  "agent_secret",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    lastUsedAt: timestamp("last_used_at"),
    name: text("name").notNull(),
    secretHash: text("secret_hash").notNull(),
    secretPrefix: text("secret_prefix").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("agent_secret_name_uidx").on(table.name)]
);

export type AgentSecret = typeof agentSecret.$inferSelect;
