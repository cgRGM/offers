const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 6;

const attempts = new Map<string, { count: number; resetAt: number }>();

export const isOfferAccessRateLimited = (key: string) => {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > MAX_ATTEMPTS;
};
