import { getSecret } from "astro:env/server";

type NodeEnvironment = "development" | "production" | "test";

interface ServerEnv {
  ADMIN_EMAIL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  DATABASE_URL: string;
  DEFAULT_BOOKING_LINK?: string;
  NODE_ENV: NodeEnvironment;
  OFFERS_API_SECRET?: string;
  OFFERS_BASE_URL: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

type RuntimeEnv = Record<string, unknown>;

const getRuntimeEnv = (): RuntimeEnv | undefined =>
  (
    globalThis as typeof globalThis & {
      __rocktownOffersRuntimeEnv?: RuntimeEnv;
    }
  ).__rocktownOffersRuntimeEnv;

const readEnv = (key: string): string | undefined => {
  const runtimeValue = getSecret(key)?.trim();
  if (runtimeValue) {
    return runtimeValue;
  }

  const runtimeEnv = getRuntimeEnv();
  const workerValue = runtimeEnv?.[key];
  if (typeof workerValue === "string" && workerValue.trim()) {
    return workerValue.trim();
  }

  return process.env[key]?.trim();
};

const requiredEnv = (key: string): string => {
  const value = readEnv(key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const optionalEnv = (key: string): string | undefined => {
  const value = readEnv(key);
  return value || undefined;
};

export const getEnv = (): ServerEnv => {
  const nodeEnvironment = readEnv("NODE_ENV");

  return {
    ADMIN_EMAIL: requiredEnv("ADMIN_EMAIL"),
    BETTER_AUTH_SECRET: requiredEnv("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: requiredEnv("BETTER_AUTH_URL"),
    DATABASE_URL: requiredEnv("DATABASE_URL"),
    DEFAULT_BOOKING_LINK: optionalEnv("DEFAULT_BOOKING_LINK"),
    NODE_ENV:
      nodeEnvironment === "production" || nodeEnvironment === "test"
        ? nodeEnvironment
        : "development",
    OFFERS_API_SECRET: optionalEnv("OFFERS_API_SECRET"),
    OFFERS_BASE_URL: requiredEnv("OFFERS_BASE_URL"),
    STRIPE_SECRET_KEY: optionalEnv("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: optionalEnv("STRIPE_WEBHOOK_SECRET"),
  };
};

export const env = new Proxy({} as ServerEnv, {
  get(_target, property: string) {
    return getEnv()[property as keyof ServerEnv];
  },
});
