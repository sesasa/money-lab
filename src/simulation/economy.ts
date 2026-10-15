import { createNodes } from "./agent";
import type { Country } from "./types";
export function createEconomy(): Country {
  return {
    id: "US",
    name: "United States",
    currency: "USD",
    nodes: createNodes(),
    productivity: 1,
    capacity: 100,
    velocity: 1,
    issuer: {
      autoStabilize: true,
      targetPrice: 1,
      adjustmentRate: 0.2,
      targetSupply: 100,
      netIssued: 0,
      lastAdjustment: 0,
    },
    metrics: {
      Y: 100,
      M: 100,
      V: 1,
      P: 1,
      inflation: 0,
      capacity: 100,
      inventory: 150,
      consumption: 100,
      cumulativeConsumption: 0,
      imports: 0,
      exports: 0,
    },
  };
}
