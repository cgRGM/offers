import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import type { Database } from "@rtloffers/db";
import { agentSecret } from "@rtloffers/db/schema/integration";
import { eq } from "drizzle-orm";

const AGENT_SECRET_NAME = "offers-agent";
const AGENT_SECRET_PREFIX_LENGTH = 16;

const hashSecret = (secret: string) =>
  createHash("sha256").update(secret).digest("hex");

const hashesMatch = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};

export const getAgentSecretStatus = async (database: Database) => {
  const [current] = await database
    .select({
      createdAt: agentSecret.createdAt,
      lastUsedAt: agentSecret.lastUsedAt,
      secretPrefix: agentSecret.secretPrefix,
    })
    .from(agentSecret)
    .where(eq(agentSecret.name, AGENT_SECRET_NAME))
    .limit(1);

  return current ?? null;
};

export const createAgentSecret = async (database: Database) => {
  const secret = `rtl_live_${randomBytes(32).toString("base64url")}`;
  const now = new Date();

  await database
    .insert(agentSecret)
    .values({
      createdAt: now,
      id: crypto.randomUUID(),
      name: AGENT_SECRET_NAME,
      secretHash: hashSecret(secret),
      secretPrefix: secret.slice(0, AGENT_SECRET_PREFIX_LENGTH),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      set: {
        lastUsedAt: null,
        secretHash: hashSecret(secret),
        secretPrefix: secret.slice(0, AGENT_SECRET_PREFIX_LENGTH),
        updatedAt: now,
      },
      target: agentSecret.name,
    });

  return {
    createdAt: now,
    secret,
    secretPrefix: secret.slice(0, AGENT_SECRET_PREFIX_LENGTH),
  };
};

export const hasValidAgentSecret = async (
  database: Database,
  secret: string | null,
  legacySecret?: string
) => {
  if (!secret) {
    return false;
  }

  const [current] = await database
    .select({ id: agentSecret.id, secretHash: agentSecret.secretHash })
    .from(agentSecret)
    .where(eq(agentSecret.name, AGENT_SECRET_NAME))
    .limit(1);

  if (current) {
    const isValid = hashesMatch(hashSecret(secret), current.secretHash);
    if (isValid) {
      await database
        .update(agentSecret)
        .set({ lastUsedAt: new Date() })
        .where(eq(agentSecret.id, current.id));
    }
    return isValid;
  }

  if (!legacySecret) {
    return false;
  }

  return hashesMatch(hashSecret(secret), hashSecret(legacySecret));
};
