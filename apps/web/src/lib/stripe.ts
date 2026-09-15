import StripeClient from "stripe";

import { env } from "../env.server";

let stripe: StripeClient | undefined;

export const getStripe = () => {
  if (!stripe) {
    stripe = new StripeClient(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-08-26.dahlia",
      appInfo: {
        name: "Rocktown Labs Offers",
        version: "0.1.0",
      },
    });
  }

  return stripe;
};

export const createIntegrationIdentifier = () => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const values = new Uint32Array(8);
  crypto.getRandomValues(values);
  return `rocktown-offers-${Array.from(values, (value) => alphabet[value % alphabet.length]).join("")}`;
};
