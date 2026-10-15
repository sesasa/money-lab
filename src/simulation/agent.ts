import type { EconomicNode, Stage } from "./types";
export const STAGES: Stage[] = [
  "raw",
  "processor",
  "manufacturer",
  "distributor",
  "consumer",
];
export const STAGE_NAMES = [
  "Raw materials",
  "Processor",
  "Manufacturer",
  "Distributor",
  "Households",
];
export function createNodes(): EconomicNode[] {
  return STAGES.map((stage, i) => ({
    id: `US-generic-${stage}`,
    country: "US",
    chainId: "generic",
    name: STAGE_NAMES[i],
    stage,
    inventory: { input: i > 0 && i < 4 ? 50 : 0, output: 0 },
    capacity: 100,
    productivity: 1,
    inputRequirement: i === 0 ? 0 : 1,
    output: 0,
    wallet: { USD: i === 4 ? 60 : 10, EUR: 0, INR: 0 },
  }));
}
