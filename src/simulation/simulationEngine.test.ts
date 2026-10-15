import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSimulation,
  runScenario,
  stepSimulation,
  updateParameters,
  HISTORY_LIMIT,
} from "./simulationEngine";
import { moneySupply } from "./currency";
import type { SimulationState } from "./types";
const near = (actual: number, expected: number, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);
function advance(state: SimulationState, steps = 100) {
  for (let i = 0; i < steps; i++) state = stepSimulation(state);
  return state;
}
function checkAccounting(previous: SimulationState, state: SimulationState) {
  const c = state.countries[0];
  const before = previous.countries[0];
  const balances = new Map(before.nodes.map((n) => [n.id, n.wallet.USD]));
  let issued = 0;
  for (const t of state.transactions) {
    assert.ok(t.amount >= 0);
    if (t.from === "issuer") issued += t.amount;
    else balances.set(t.from, balances.get(t.from)! - t.amount);
    if (t.to === "issuer") issued -= t.amount;
    else balances.set(t.to, balances.get(t.to)! + t.amount);
    if (t.kind === "goods") near(t.amount, t.quantity! * t.unitPrice!);
  }
  near(moneySupply(c) - moneySupply(before), issued);
  c.nodes.forEach((n) => {
    near(n.wallet.USD, balances.get(n.id)!);
    assert.ok(n.wallet.USD >= -1e-10);
    assert.ok(n.inventory.input >= 0);
    assert.ok(n.inventory.output >= 0);
  });
  const sales = state.transactions.filter((t) => t.kind === "goods");
  if (c.metrics.Y > 0) {
    assert.equal(sales.length, 4);
    const final = sales.find((t) => t.from.endsWith("consumer"))!;
    near(c.metrics.Y, final.quantity! / state.dt);
    near(final.amount / state.dt, c.metrics.M * c.metrics.V);
    near(c.metrics.P! * c.metrics.Y, c.metrics.M * c.metrics.V);
    const margins = state.transactions
      .filter((t) => t.kind === "income")
      .reduce((s, t) => s + t.amount, 0);
    near(margins, final.amount);
  } else {
    assert.equal(sales.length, 0);
    assert.equal(c.metrics.P, null);
  }
}
test("baseline is stable and cash is conserved for 1000 steps", () => {
  let state = createSimulation();
  for (let i = 0; i < 1000; i++) {
    const next = stepSimulation(state);
    checkAccounting(state, next);
    state = next;
  }
  near(state.countries[0].metrics.Y, 100);
  near(state.countries[0].metrics.P!, 1);
  near(state.countries[0].metrics.cumulativeConsumption, 10000);
  assert.deepEqual(
    state.countries[0].nodes.map((n) => n.wallet.USD),
    [10, 10, 10, 10, 60],
  );
  assert.equal(state.history.length, HISTORY_LIMIT);
});
test("healthy growth converges to M120 Y120 P1 without persistent inflation", () => {
  const initial = runScenario("healthy");
  assert.ok(initial.countries[0].metrics.P! < 1);
  const c = advance(initial).countries[0];
  near(c.metrics.M, 120);
  near(c.metrics.Y, 120);
  near(c.metrics.P!, 1);
});
test("fixed money growth reproduces 100/120, without counting intermediates", () => {
  const c = advance(runScenario("fixed")).countries[0];
  near(c.metrics.Y, 120);
  near(c.metrics.M, 100);
  near(c.metrics.P!, 100 / 120);
});
test("money shock has P1.5 while physical output stays100", () => {
  const c = advance(runScenario("money")).countries[0];
  near(c.metrics.Y, 100);
  near(c.metrics.M, 150);
  near(c.metrics.P!, 1.5);
});
test("velocity shock raises prices20% with no money creation", () => {
  const c = advance(runScenario("velocity")).countries[0];
  near(c.metrics.V, 1.2);
  near(c.metrics.M, 100);
  near(c.issuer.netIssued, 0);
  near(c.metrics.P!, 1.2);
});
test("supply contraction raises prices without money creation", () => {
  const c = advance(runScenario("capacity")).countries[0];
  near(c.metrics.Y, 80);
  near(c.metrics.P!, 1.25);
  near(c.issuer.netIssued, 0);
});
test("manual controls execute a full balanced step with the issuance journal retained", () => {
  const previous = createSimulation();
  const next = updateParameters(previous, {
    moneySupply: 150,
    autoStabilize: false,
  });
  checkAccounting(previous, next);
  near(next.countries[0].issuer.lastAdjustment, 50);
  assert.equal(next.tick, 1);
});
test("zero output produces no sales, undefined price and no automatic money destruction", () => {
  const previous = createSimulation();
  const state = updateParameters(previous, { capacity: 0 });
  checkAccounting(previous, state);
  assert.equal(state.countries[0].metrics.P, null);
  near(state.countries[0].metrics.M, 100);
  near(advance(state).countries[0].metrics.M, 100);
  const recovery = updateParameters(state, { capacity: 100 });
  near(recovery.countries[0].metrics.P!, 1);
});
test("repeated extreme parameter changes preserve wallets, nominal spending and balanced journals", () => {
  let state = createSimulation();
  for (let i = 0; i < 200; i++) {
    const next = updateParameters(state, {
      productivity: i % 2 === 0 ? 2 : 0.5,
      capacity: i % 3 === 0 ? 200 : 5,
      velocity: i % 2 === 0 ? 3 : 0.25,
      moneySupply: i % 2 === 0 ? 300 : 10,
      autoStabilize: i % 3 === 0,
      targetPrice: i % 2 === 0 ? 2 : 0.5,
    });
    checkAccounting(state, next);
    state = next;
  }
});
test("all scenarios reproduce identically and stepping never mutates the input", () => {
  const baseline = createSimulation();
  const serialized = JSON.stringify(baseline);
  stepSimulation(baseline);
  assert.equal(JSON.stringify(baseline), serialized);
  for (const id of ["healthy", "fixed", "money", "velocity", "capacity"])
    assert.deepEqual(advance(runScenario(id)), advance(runScenario(id)));
});
