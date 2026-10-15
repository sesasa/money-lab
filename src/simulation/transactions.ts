import type { Country, Transaction } from "./types";
import { PRICE_SHARES } from "./supplyChain";
/** Downstream receipts finance upstream inputs. Ownership income closes the cash loop.
 * A sequence of settlement rounds allows high turnover without credit or negative wallets.
 */
export function settleProduction(
  country: Country,
  quantity: number,
  price: number,
  tick: number,
): Transaction[] {
  if (quantity <= 0) return [];
  const nodes = country.nodes;
  const currency = country.currency;
  const household = nodes[4];
  const totals = [0, 0, 0, 0];
  const incomes = [0, 0, 0, 0];
  let remaining = quantity;
  let rounds = 0;
  while (remaining > 1e-9) {
    if (++rounds > 1000) throw new Error("Settlement did not converge");
    const batch = Math.min(remaining, household.wallet[currency] / price);
    if (batch < 1e-10)
      throw new Error("Household has insufficient circulating liquidity");
    for (let i = 3; i >= 0; i--) {
      const amount = batch * price * PRICE_SHARES[i];
      nodes[i + 1].wallet[currency] -= amount;
      nodes[i].wallet[currency] += amount;
      totals[i] += amount;
    }
    for (let i = 0; i < 4; i++) {
      const margin =
        batch * price * (PRICE_SHARES[i] - (PRICE_SHARES[i - 1] ?? 0));
      nodes[i].wallet[currency] -= margin;
      household.wallet[currency] += margin;
      incomes[i] += margin;
    }
    remaining -= batch;
  }
  return [
    ...totals.map(
      (amount, i): Transaction => ({
        id: `${tick}-goods-${i}`,
        tick,
        kind: "goods",
        from: nodes[i + 1].id,
        to: nodes[i].id,
        currency,
        amount,
        quantity,
        unitPrice: price * PRICE_SHARES[i],
        good: "generic",
      }),
    ),
    ...incomes.map(
      (amount, i): Transaction => ({
        id: `${tick}-income-${i}`,
        tick,
        kind: "income",
        from: nodes[i].id,
        to: household.id,
        currency,
        amount,
      }),
    ),
  ];
}
