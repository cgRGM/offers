import type { Database } from "@rtloffers/db";
import { offer } from "@rtloffers/db/schema/offers";
import { desc, eq } from "drizzle-orm";

export const findOfferBySlug = async (database: Database, slug: string) => {
  const [result] = await database
    .select()
    .from(offer)
    .where(eq(offer.slug, slug))
    .limit(1);
  return result ?? null;
};

export const listOffers = (database: Database) =>
  database.select().from(offer).orderBy(desc(offer.createdAt));

export const createOffer = async (
  database: Database,
  values: typeof offer.$inferInsert
) => {
  const [result] = await database.insert(offer).values(values).returning();
  return result;
};

export const updateOffer = async (
  database: Database,
  id: string,
  values: Partial<typeof offer.$inferInsert>
) => {
  const [result] = await database
    .update(offer)
    .set(values)
    .where(eq(offer.id, id))
    .returning();
  return result ?? null;
};
