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
  PAGE_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

const requiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const optionalEnv = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value || undefined;
};

const nodeEnvironment = process.env.NODE_ENV?.trim();

export const env: ServerEnv = {
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
  PAGE_SECRET: requiredEnv("PAGE_SECRET"),
  STRIPE_SECRET_KEY: requiredEnv("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: requiredEnv("STRIPE_WEBHOOK_SECRET"),
};
