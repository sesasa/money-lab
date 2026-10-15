import type { Country } from "../simulation/types";
export const format = (n: number | null, digits = 1) =>
  n === null
    ? "—"
    : n.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
export function MetricPanel({ country }: { country: Country }) {
  const m = country.metrics;
  const metrics = [
    {
      key: "Y",
      name: "Real output",
      value: format(m.Y),
      unit: "final units / period",
      color: "orange",
      change: m.Y - 100,
    },
    {
      key: "M",
      name: "Money supply",
      value: format(m.M),
      unit: "USD in circulation",
      color: "green",
      change: m.M - 100,
    },
    {
      key: "V",
      name: "Velocity",
      value: format(m.V, 2),
      unit: "final spending turns / period",
      color: "blue",
      change: (m.V - 1) * 100,
    },
    {
      key: "P",
      name: "Price level",
      value: format(m.P, 3),
      unit: "USD / final unit",
      color: "purple",
      change: m.P === null ? null : (m.P - 1) * 100,
    },
  ];
  return (
    <section className="metrics-grid" aria-label="Economic indicators">
      {metrics.map((metric) => (
        <div key={metric.key} className={`metric ${metric.color}`}>
          <div className="metric-top">
            <span className="metric-symbol">{metric.key}</span>
            <span>{metric.name}</span>
          </div>
          <div className="metric-value">
            {metric.value}
            <span
              className={Math.abs(metric.change ?? 0) < 0.01 ? "neutral" : ""}
            >
              {metric.change === null
                ? "undefined"
                : Math.abs(metric.change) < 0.01
                  ? "baseline"
                  : `${metric.change > 0 ? "+" : ""}${format(metric.change)}%`}
            </span>
          </div>
          <div className="metric-unit">{metric.unit}</div>
        </div>
      ))}
    </section>
  );
}
export function EquationPanel({ country }: { country: Country }) {
  const { M, V, Y, P, inflation } = country.metrics;
  return (
    <div className="equation-panel">
      <div>
        <span className="eyebrow">THE MODEL’S CLOSURE</span>
        <div className="live-equation">
          <span className="purple-text">P</span>
          <span>=</span>
          <span className="fraction">
            <span>
              <b className="green-text">M</b> × <b className="blue-text">V</b>
            </span>
            <span className="orange-text">Y</span>
          </span>
          <span>=</span>
          <span className="equation-substitution">
            {format(M)} × {format(V, 2)} / {format(Y)}
          </span>
          <span>=</span>
          <strong className="purple-text">{format(P, 3)}</strong>
        </div>
      </div>
      <div className="inflation-indicator">
        <span>Price change / step</span>
        <strong>
          {inflation === null
            ? "—"
            : `${inflation >= 0 ? "+" : ""}${format(inflation, 2)}%`}
        </strong>
        <small>
          {Y === 0
            ? "No final sales; P is undefined."
            : "Flexible prices · supply-led output"}
        </small>
      </div>
    </div>
  );
}
