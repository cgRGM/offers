import { createHmac, timingSafeEqual } from "node:crypto";

export const OFFER_ACCESS_COOKIE = "offer_access";
export const OFFER_ACCESS_MAX_AGE = 60 * 60 * 24 * 7;

const sign = (value: string, secret: string) =>
  createHmac("sha256", secret).update(value).digest("base64url");

export const createOfferAccessToken = (slug: string, secret: string) => {
  const expiresAt = Math.floor(Date.now() / 1000) + OFFER_ACCESS_MAX_AGE;
  const payload = `${slug}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
};

export const hasOfferAccess = (
  token: string | undefined,
  slug: string,
  secret: string
) => {
  if (!token) {
    return false;
  }

  const [tokenSlug, expiresAtValue, signature] = token.split(".");
  const payload = `${tokenSlug}.${expiresAtValue}`;
  const expectedSignature = sign(payload, secret);

  if (!tokenSlug || !expiresAtValue || !signature || tokenSlug !== slug) {
    return false;
  }

  if (Number(expiresAtValue) < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
