export const OFFER_TIERS = {
  grow: {
    bullets: [
      "Everything in Manage",
      "Mobile app development",
      "Custom features and workflows",
    ],
    depositCents: 125_000,
    label: "Grow",
    monthlyCents: 14_900,
    monthlyDescription:
      "Hosting, maintenance, and ongoing feature development.",
    totalCents: 250_000,
  },
  launch: {
    bullets: [
      "Mobile-first website",
      "Custom domain and email",
      "Hours, map, and click-to-call",
    ],
    depositCents: 25_000,
    label: "Launch",
    monthlyCents: 5000,
    monthlyDescription: "Hosting, maintenance, and ongoing updates.",
    totalCents: 50_000,
  },
  manage: {
    bullets: [
      "Everything in Launch",
      "User accounts",
      "Online ordering and loyalty program",
    ],
    depositCents: 60_000,
    label: "Manage",
    monthlyCents: 9900,
    monthlyDescription: "Hosting, maintenance, and new features as needed.",
    totalCents: 120_000,
  },
} as const;

export type OfferTier = keyof typeof OFFER_TIERS;
export type PaymentType = "deposit" | "full";

export const OFFER_TIER_ORDER = ["launch", "manage", "grow"] as const;

export const isOfferTier = (value: unknown): value is OfferTier =>
  typeof value === "string" && value in OFFER_TIERS;

export const formatCurrency = (cents: number, includeCents = false) =>
  new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: includeCents ? 2 : 0,
    style: "currency",
  }).format(cents / 100);
