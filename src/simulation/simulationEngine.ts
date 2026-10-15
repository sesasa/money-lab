import { createEconomy } from "./economy";
import { moneySupply, setMoneySupply } from "./currency";
import { planProduction, produceAndTransfer } from "./supplyChain";
import { settleProduction } from "./transactions";
import { scenarios } from "./scenario";
import type { Parameters, SimulationState, TimelinePoint } from "./types";
export const HISTORY_LIMIT = 240;
export function point(state: SimulationState): TimelinePoint {
  const { M, V, P, Y } = state.countries[0].metrics;
  return { time: state.time, tick: state.tick, M, V, P, Y };
}
export function createSimulation(): SimulationState {
  const state: SimulationState = {
    tick: 0,
    time: 0,
    dt: 0.1,
    countries: [createEconomy()],
    currencies: [{ code: "USD", symbol: "$", issuerCountry: "US" }],
    fxMarkets: [],
    transactions: [],
    history: [],
    scenarioId: "baseline",
    explanation:
      "A balanced starting point: 100 units of final output, 100 dollars, and a velocity of 1. Follow the goods one way and the payments back.",
  };
  state.history = [point(state)];
  return state;
}
function calculateMetrics(
  state: SimulationState,
  Y: number,
  previousPrice: number | null,
  recordConsumption: boolean,
) {
  const country = state.countries[0];
  const M = moneySupply(country);
  const P = Y > 0 ? (M * country.velocity) / Y : null;
  country.metrics = {
    ...country.metrics,
    M,
    Y,
    V: country.velocity,
    P,
    inflation:
      P !== null && previousPrice !== null && previousPrice > 0
        ? (P / previousPrice - 1) * 100
        : null,
    capacity: country.capacity * country.productivity,
    consumption: Y,
    inventory: country.nodes.reduce(
      (s, n) => s + n.inventory.input + n.inventory.output,
      0,
    ),
    cumulativeConsumption:
      country.metrics.cumulativeConsumption +
      (recordConsumption ? Y * state.dt : 0),
  };
  country.issuer.targetSupply =
    Y > 0 ? (country.issuer.targetPrice * Y) / country.velocity : M;
}
/** Pure deterministic state transition. No clocks, DOM, random numbers, or React. */
export function stepSimulation(previous: SimulationState): SimulationState {
  const state = structuredClone(previous);
  state.tick++;
  state.time = Number((state.tick * state.dt).toFixed(6));
  const country = state.countries[0];
  const oldPrice = country.metrics.P;
  const quantity = planProduction(country, state.dt);
  const Y = quantity / state.dt;
  const target =
    Y > 0
      ? (country.issuer.targetPrice * Y) / country.velocity
      : moneySupply(country);
  country.issuer.lastAdjustment = 0;
  state.transactions = country.issuer.autoStabilize
    ? setMoneySupply(
        country,
        moneySupply(country) +
          (target - moneySupply(country)) * country.issuer.adjustmentRate,
        state.tick,
        "auto",
      )
    : [];
  calculateMetrics(state, Y, oldPrice, true);
  produceAndTransfer(country, quantity);
  if (country.metrics.P !== null)
    state.transactions.push(
      ...settleProduction(country, quantity, country.metrics.P, state.tick),
    );
  state.history.push(point(state));
  state.history = state.history.slice(-HISTORY_LIMIT);
  return state;
}
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
export function updateParameters(
  previous: SimulationState,
  update: Partial<Parameters>,
): SimulationState {
  const state = structuredClone(previous);
  const c = state.countries[0];
  state.scenarioId = "custom";
  if (update.productivity !== undefined && Number.isFinite(update.productivity))
    c.productivity = clamp(update.productivity, 0.5, 2);
  if (update.capacity !== undefined && Number.isFinite(update.capacity))
    c.capacity = clamp(update.capacity, 0, 200);
  if (update.velocity !== undefined && Number.isFinite(update.velocity))
    c.velocity = clamp(update.velocity, 0.25, 3);
  if (update.targetPrice !== undefined && Number.isFinite(update.targetPrice))
    c.issuer.targetPrice = clamp(update.targetPrice, 0.5, 2);
  if (update.autoStabilize !== undefined)
    c.issuer.autoStabilize = update.autoStabilize;
  const manualIssuance =
    update.moneySupply !== undefined && Number.isFinite(update.moneySupply)
      ? setMoneySupply(c, clamp(update.moneySupply, 10, 300), state.tick + 1)
      : [];
  if (update.productivity !== undefined || update.capacity !== undefined)
    state.explanation = c.issuer.autoStabilize
      ? "Production potential changed. With velocity unchanged, the issuer will adjust the dollar stock toward the amount needed for the larger or smaller flow of final goods."
      : "Production potential changed while money stays fixed. More final goods lower P; fewer final goods raise P in this model.";
  if (update.moneySupply !== undefined)
    state.explanation =
      "The issuer changed the dollar stock. With output and velocity unchanged, more dollars raise the model’s price level. Creating dollars does not create real goods.";
  if (update.velocity !== undefined)
    state.explanation = c.issuer.autoStabilize
      ? "The same dollars are spent at a different rate. With automatic stabilization on, higher velocity makes the issuer withdraw dollars; lower velocity makes it add dollars. Prices return toward the target as M adjusts."
      : "The same dollars are now spent at a different rate. A higher velocity raises nominal spending and P when M and Y stay fixed. No new money is required.";
  if (update.autoStabilize !== undefined || update.targetPrice !== undefined)
    state.explanation = c.issuer.autoStabilize
      ? "The issuer now adjusts M gradually toward P target × Y ÷ V. Price changes can appear while the money stock catches up."
      : "The money stock is now fixed until you change it. Output and velocity determine where the price level moves.";
  // Each control change executes one complete, accounted-for step, even while paused.
  // Metrics never describe unproduced goods and the ledger always matches final spending.
  const next = stepSimulation(state);
  next.transactions = [...manualIssuance, ...next.transactions];
  if (manualIssuance.length)
    next.countries[0].issuer.lastAdjustment += c.issuer.lastAdjustment;
  next.history[next.history.length - 1].event = Object.keys(update).join(", ");
  return next;
}
export function runScenario(id: string): SimulationState {
  const scenario = scenarios.find((s) => s.id === id);
  if (!scenario) return createSimulation();
  let state = createSimulation();
  for (let i = 0; i < 12; i++) state = stepSimulation(state);
  state = updateParameters(state, scenario.parameters);
  state.scenarioId = scenario.id;
  state.explanation = `${scenario.description} ${scenario.observation}`;
  return state;
}
