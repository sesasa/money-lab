import type { Scenario } from "./types";
export const scenarios: Scenario[] = [
  {
    id: "healthy",
    name: "Healthy economic growth",
    tag: "Y ↑ · M follows",
    description:
      "Productivity rises 20%. The issuer gradually supplies the money needed to keep the price target at 1.",
    observation:
      "More real goods. More circulating dollars. Prices return toward 1 as the issuer catches up.",
    parameters: { productivity: 1.2, autoStabilize: true },
  },
  {
    id: "fixed",
    name: "Growth, fixed money",
    tag: "Y ↑ · M fixed",
    description:
      "Productivity rises 20%, with M fixed at 100 and V fixed at 1.",
    observation:
      "The same money supports more final goods. P = 100 ÷ 120 ≈ 0.833.",
    parameters: { productivity: 1.2, autoStabilize: false },
  },
  {
    id: "money",
    name: "Excess money creation",
    tag: "M ↑ · Y fixed",
    description:
      "The issuer increases M from 100 to 150. Production and velocity stay unchanged.",
    observation:
      "Dollar balances grow, but output stays 100. The model’s price level becomes 1.500.",
    parameters: { moneySupply: 150, autoStabilize: false },
  },
  {
    id: "velocity",
    name: "Velocity increase",
    tag: "V ↑ · M fixed",
    description:
      "V rises from 1 to 1.2. The same money is spent more often, with no additional money creation.",
    observation:
      "Nominal spending increases 20%. With output unchanged, P rises to 1.200.",
    parameters: { velocity: 1.2, autoStabilize: false },
  },
  {
    id: "capacity",
    name: "A production slowdown",
    tag: "Y ↓ · M fixed",
    description:
      "Capacity falls from 100 to 80. Money supply and velocity stay unchanged.",
    observation:
      "Fewer goods are available. Even without new money, the price level rises to 1.250.",
    parameters: { capacity: 80, autoStabilize: false },
  },
];
