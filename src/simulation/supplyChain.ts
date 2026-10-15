import type { Country } from "./types";
export const PRICE_SHARES = [0.2, 0.45, 0.75, 1];
/** A synchronized, pull-based chain: downstream demand caps all four stages.
 * Intermediate goods transform 1:1; opening buffers make simultaneous production possible.
 * The MVP has no inventory investment and consumes all final production each step.
 */
export function planProduction(country: Country, dt: number): number {
  const producers = country.nodes.slice(0, -1);
  return Math.max(
    0,
    Math.min(
      ...producers.map((node) =>
        Math.min(
          country.capacity *
            country.productivity *
            node.productivity *
            dt *
            (node.capacity / 100),
          node.inputRequirement === 0
            ? Infinity
            : node.inventory.input / node.inputRequirement,
        ),
      ),
    ),
  );
}
export function produceAndTransfer(country: Country, quantity: number) {
  country.nodes.forEach((node, i) => {
    node.output = quantity;
    if (i < 4) {
      node.inventory.input -= node.inputRequirement * quantity;
      node.inventory.output += quantity;
    }
  });
  country.nodes.slice(0, -1).forEach((node, i) => {
    node.inventory.output -= quantity;
    if (i < 3) country.nodes[i + 1].inventory.input += quantity;
  });
}
