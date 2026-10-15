import { useEffect, useRef } from "react";
import { Icon } from "./Icon";
export function ModelNotes({
  onClose,
  returnFocusTo,
}: {
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener =
      returnFocusTo ?? (document.activeElement as HTMLElement | null);
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      opener?.focus();
    };
  }, [returnFocusTo]);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      className="model-dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <span className="eyebrow">AN INSPECTABLE MODEL</span>
        <button
          className="icon-button"
          aria-label="Close model notes"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <h2>
        Simple by design.
        <br />
        Explicit about the assumptions.
      </h2>
      <p>
        This is a one-country teaching model, not a forecast of the real
        economy. All quantities are normalized. A model period has no calendar
        interpretation; each step is 0.1 period. At t = 0, the dashboard shows a
        steady-state reference; no transactions have run. After that, displayed
        output corresponds to actual consumption. Releasing a slider or
        finishing a control change executes one complete step, even while
        paused.
      </p>
      <h3>Production creates the real output.</h3>
      <p>
        One generic product passes through four synchronized stages, with 1:1
        input requirements and just-in-time replenishment. Each stage is limited
        by capacity, productivity, and opening input stock. All final goods are
        consumed. Y counts that final flow only; it excludes intermediate sales
        and inventory investment. Opening buffers are assumed endowments.
      </p>
      <h3>Money is a stock. Spending is a flow.</h3>
      <p>
        M is the sum of all five USD wallets. Each goods sale debits the buyer
        and credits the seller by the same amount. Firms return their
        value-added margins to households as owner income, closing the cash
        loop. Only the Currency Issuer changes M, distributing creation or
        removal proportionally across wallets.
      </p>
      <h3>What does P = MV / Y assume?</h3>
      <p>
        V is an assumed final-spending velocity, not turnover from all payments.
        The spending rule is E = MV per period. Households buy available final
        output, so a flexible price P = E/Y clears the market. This closure
        determines prices; the equation alone does not establish causality.
        Money has no effect on real output in this MVP.
      </p>
      <p>
        When final output is zero, P is undefined and the price line breaks.
        Goods stop moving and the automatic issuer holds the existing money
        stock.
      </p>
      <h3>Why can more money coexist with stable prices?</h3>
      <p>
        With Auto Stabilize enabled, M target = P target × Y / V. Each step
        closes 20% of the gap. Prices can move temporarily while the issuer
        catches up. With it disabled, M stays fixed until you change it. The
        displayed price change is from the previous step or control change, not
        annual inflation.
      </p>
      <h3>One step, with balanced payments.</h3>
      <ol>
        <li>Plan feasible final consumption from physical constraints.</li>
        <li>Adjust the money stock if automatic stabilization is enabled.</li>
        <li>Calculate the clearing price from M, V, and Y.</li>
        <li>Produce goods and transfer them along the chain.</li>
        <li>Settle payments from households back to raw materials.</li>
        <li>Pay owner income back to households and record metrics.</li>
      </ol>
      <p>
        Stage prices are 20%, 45%, 75%, and 100% of P. Value-added shares sum to
        the final price. Within the supported controls, households hold enough
        cash to fund each step without credit. Transfers and income occur within
        the step; animations summarize their direction, rather than representing
        each individual dollar.
      </p>
      <h3>The next layers</h3>
      <p>
        Europe/EUR and India/INR → international USD settlement → bounded FX
        markets → global currency demand. These are outside this first MVP.
        There are no banks, credit, taxes, bond markets, or interest-rate
        policy.
      </p>
      <div className="notes-footer">
        <Icon name="check" />
        Deterministic engine · conserved payments · reproducible scenarios
      </div>
    </dialog>
  );
}
