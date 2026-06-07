/**
 * Curated tyre brand reference table for the Brand Recommender & Comparison tools.
 *
 * Specs are RANGES (not exact model numbers) compiled from each brand's
 * public model pages and dealer literature. They describe the brand's
 * typical Indian-market passenger/commercial line — not any single SKU.
 *
 * Every recommendation MUST cite "ranges, not model-specific specs" in the UI.
 */

export type RoadType = "city" | "highway" | "village" | "mixed";
export type UsageType = "daily" | "commercial" | "long-distance";
export type VehicleType = "hatchback" | "sedan" | "suv" | "bike" | "commercial";

export interface TyreBrand {
  id: string;
  name: string;
  origin: string;
  /** Typical Indian on-road price band per tyre, ₹ */
  priceMinINR: number;
  priceMaxINR: number;
  /** Expected tread life on Indian roads, km */
  lifeMinKm: number;
  lifeMaxKm: number;
  /** 1-5 subjective ratings derived from published manufacturer literature & user reviews */
  comfort: 1 | 2 | 3 | 4 | 5;
  durability: 1 | 2 | 3 | 4 | 5;
  mileage: 1 | 2 | 3 | 4 | 5;
  grip: 1 | 2 | 3 | 4 | 5;
  /** Which use-cases the brand's lineup is strongest for */
  strongFor: Array<RoadType | UsageType>;
  /** Vehicle types covered */
  vehicles: VehicleType[];
  bestModelExample: string;
  notes: string;
}

export const TYRE_BRANDS: TyreBrand[] = [
  {
    id: "mrf",
    name: "MRF",
    origin: "India",
    priceMinINR: 3500,
    priceMaxINR: 12000,
    lifeMinKm: 45000,
    lifeMaxKm: 70000,
    comfort: 4,
    durability: 5,
    mileage: 4,
    grip: 4,
    strongFor: ["village", "mixed", "commercial", "daily"],
    vehicles: ["hatchback", "sedan", "suv", "bike", "commercial"],
    bestModelExample: "MRF ZVTV / ZLX / Wanderer",
    notes:
      "India's most widely used brand. Excellent sidewall strength on rough roads, great service network in YSR Kadapa.",
  },
  {
    id: "apollo",
    name: "Apollo",
    origin: "India",
    priceMinINR: 3300,
    priceMaxINR: 11000,
    lifeMinKm: 40000,
    lifeMaxKm: 65000,
    comfort: 4,
    durability: 4,
    mileage: 4,
    grip: 4,
    strongFor: ["city", "highway", "daily"],
    vehicles: ["hatchback", "sedan", "suv", "commercial"],
    bestModelExample: "Apollo Amazer 4G / Alnac 4G",
    notes:
      "Balanced city + highway choice with quiet rolling and good wet grip. Strong value at mid-range price.",
  },
  {
    id: "ceat",
    name: "CEAT",
    origin: "India",
    priceMinINR: 3000,
    priceMaxINR: 10000,
    lifeMinKm: 38000,
    lifeMaxKm: 60000,
    comfort: 4,
    durability: 4,
    mileage: 4,
    grip: 4,
    strongFor: ["city", "village", "daily"],
    vehicles: ["hatchback", "sedan", "bike", "commercial"],
    bestModelExample: "CEAT SecuraDrive / Milaze X3",
    notes:
      "Wet-grip focus; F1-tech derived patterns. Popular bike + commuter range with broad availability.",
  },
  {
    id: "michelin",
    name: "Michelin",
    origin: "France",
    priceMinINR: 6500,
    priceMaxINR: 22000,
    lifeMinKm: 55000,
    lifeMaxKm: 80000,
    comfort: 5,
    durability: 5,
    mileage: 5,
    grip: 5,
    strongFor: ["highway", "long-distance", "mixed"],
    vehicles: ["sedan", "suv"],
    bestModelExample: "Michelin Energy XM2+ / Primacy 4",
    notes:
      "Best-in-class wet braking and tread life. Premium price; ideal for highway-heavy and long-distance use.",
  },
  {
    id: "bridgestone",
    name: "Bridgestone",
    origin: "Japan",
    priceMinINR: 5500,
    priceMaxINR: 18000,
    lifeMinKm: 50000,
    lifeMaxKm: 75000,
    comfort: 5,
    durability: 5,
    mileage: 4,
    grip: 5,
    strongFor: ["highway", "long-distance", "city"],
    vehicles: ["sedan", "suv", "bike"],
    bestModelExample: "Bridgestone Turanza T005 / Ecopia EP150",
    notes:
      "OEM choice for many Japanese brands. Refined ride, low road noise — strong all-rounder.",
  },
  {
    id: "jk",
    name: "JK Tyre",
    origin: "India",
    priceMinINR: 3200,
    priceMaxINR: 11000,
    lifeMinKm: 40000,
    lifeMaxKm: 65000,
    comfort: 4,
    durability: 4,
    mileage: 4,
    grip: 3,
    strongFor: ["village", "commercial", "daily"],
    vehicles: ["hatchback", "sedan", "commercial"],
    bestModelExample: "JK Ultima Sport / Vectra",
    notes:
      "Value-focused and durable. Good fit for taxi & commercial fleets with mixed road conditions.",
  },
  {
    id: "goodyear",
    name: "Goodyear",
    origin: "USA",
    priceMinINR: 4800,
    priceMaxINR: 16000,
    lifeMinKm: 45000,
    lifeMaxKm: 70000,
    comfort: 5,
    durability: 4,
    mileage: 4,
    grip: 5,
    strongFor: ["highway", "city", "long-distance"],
    vehicles: ["sedan", "suv"],
    bestModelExample: "Goodyear Assurance TripleMax 2 / Eagle F1",
    notes:
      "Strong wet performance and quiet ride. Good for urban commuters and long highway runs.",
  },
];

/** Score brands against the user's selection. Pure math — no AI required. */
export function recommendBrands(input: {
  vehicleType: VehicleType;
  budget: number;
  roadType: RoadType;
  usage: UsageType;
}) {
  return TYRE_BRANDS.map((b) => {
    const inVehicle = b.vehicles.includes(input.vehicleType) ? 1 : 0;
    const inBudget =
      input.budget >= b.priceMinINR
        ? input.budget >= b.priceMaxINR
          ? 1
          : 0.85
        : 0.35;
    const roadBonus = b.strongFor.includes(input.roadType) ? 1 : 0.7;
    const usageBonus = b.strongFor.includes(input.usage) ? 1 : 0.75;
    const ratingAvg = (b.comfort + b.durability + b.mileage + b.grip) / 4 / 5;
    const score =
      Math.round(
        (inVehicle * 0.25 +
          inBudget * 0.25 +
          roadBonus * 0.2 +
          usageBonus * 0.15 +
          ratingAvg * 0.15) *
          100,
      );
    return { brand: b, score, inVehicle: !!inVehicle, inBudget: inBudget >= 0.85 };
  })
    .sort((a, b) => b.score - a.score);
}
