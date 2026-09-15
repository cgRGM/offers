export const OFFER_TIERS = {
  grow: {
    bullets: [
      "A tailored site for a more involved operation",
      "Room for custom features and workflows",
      "A clear plan before work begins",
    ],
    depositCents: 50_000,
    label: "Grow",
    monthlyCents: 14_900,
    totalCents: 250_000,
  },
  launch: {
    bullets: [
      "Mobile-first website",
      "Hours, map, and click-to-call",
      "Live in 1–2 weeks",
    ],
    depositCents: 25_000,
    label: "Launch",
    monthlyCents: 5000,
    totalCents: 50_000,
  },
  manage: {
    bullets: [
      "Everything in Launch",
      "Ongoing edits and maintenance",
      "A site that stays current",
    ],
    depositCents: 60_000,
    label: "Manage",
    monthlyCents: 9900,
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
