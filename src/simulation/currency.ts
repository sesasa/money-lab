import type { Country, Transaction } from "./types";
export const moneySupply = (country: Country) =>
  country.nodes.reduce((sum, node) => sum + node.wallet[country.currency], 0);
/** Issuance/removal is explicit and proportional. Ordinary payments never change M. */
export function setMoneySupply(
  country: Country,
  target: number,
  tick: number,
  source = "manual",
): Transaction[] {
  const before = moneySupply(country);
  const difference = target - before;
  const transactions: Transaction[] = [];
  country.nodes.forEach((node, index) => {
    const delta =
      difference *
      (before > 0
        ? node.wallet[country.currency] / before
        : 1 / country.nodes.length);
    node.wallet[country.currency] += delta;
    if (Math.abs(delta) > 1e-8)
      transactions.push({
        id: `${tick}-issue-${source}-${index}`,
        tick,
        kind: "issuance",
        from: delta > 0 ? "issuer" : node.id,
        to: delta > 0 ? node.id : "issuer",
        currency: country.currency,
        amount: Math.abs(delta),
      });
  });
  country.issuer.netIssued += difference;
  country.issuer.lastAdjustment = difference;
  return transactions;
}
