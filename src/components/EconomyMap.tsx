import { useEffect, useRef, useState } from "react";
import type {
  Country,
  EconomicNode,
  SimulationState,
} from "../simulation/types";
import { Icon } from "./Icon";
import { format } from "./MetricPanel";

function StageDrawing({ stage }: { stage: string }) {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {stage === "raw" ? (
        <>
          <path d="m-25 13 14-25 12 20 7-11 16 23Z" />
          <path d="m-16-3 5 4 4-4M-23 19h49" />
          <path d="M16-13v15m-6-4 6-6 6 6" />
        </>
      ) : stage === "processor" ? (
        <>
          <path d="M-22 18v-29h16V2l13-8v11l14-9v22Z" />
          <path d="M-18-17h8M-15 9v5M-4 9v5M7 9v5M16 9v5" />
          <path d="M-14-23c-9-5 3-10-3-14" />
        </>
      ) : stage === "manufacturer" ? (
        <>
          <rect x="-25" y="9" width="50" height="12" rx="5" />
          <circle cx="-16" cy="15" r="2" />
          <circle cy="15" r="2" />
          <circle cx="16" cy="15" r="2" />
          <path d="M-17 9V-4H-2V9M11 9V-4h10V9M-5-17l10 8 8-17M-5-17l-9-7 6-8 11 6 10 0M11-4l4-5 5 5" />
          <circle cx="5" cy="-9" r="3" />
        </>
      ) : stage === "distributor" ? (
        <>
          <path d="M-26 0h32v19h-32ZM6 6h12l8 9v4H6M-21-5v-10H0v10M-16-15v6h6v-6M17 6v9h9" />
          <circle cx="-16" cy="20" r="5" fill="#fafbf8" />
          <circle cx="17" cy="20" r="5" fill="#fafbf8" />
        </>
      ) : (
        <>
          <path d="m-25 0 25-20L25 0M-19-5v27h38V-5M-5 22V9H7v13M-13 3h5M9 3h5" />
          <path d="M15-13v-10h7v16" />
        </>
      )}
    </g>
  );
}
function NodeInspector({
  node,
  country,
  started,
}: {
  node: EconomicNode;
  country: Country;
  started: boolean;
}) {
  const consumer = node.stage === "consumer";
  return (
    <div className="node-inspector">
      <div className="inspector-name">
        <span className="tiny-dot orange" />
        <strong>{node.name}</strong>
        <span>{consumer ? "Final consumption" : "Production stage"}</span>
      </div>
      <div>
        <span>Wallet</span>
        <b>${format(node.wallet.USD, 2)}</b>
      </div>
      <div>
        <span>{consumer ? "Consumed / step" : "Input inventory"}</span>
        <b>
          {consumer && !started
            ? "No steps yet"
            : `${format(consumer ? node.output : node.inventory.input)} units`}
        </b>
      </div>
      <div>
        <span>{consumer ? "Final output / period" : "Effective capacity"}</span>
        <b>
          {format(consumer ? country.metrics.Y : country.metrics.capacity)}{" "}
          units
        </b>
      </div>
    </div>
  );
}
export function EconomyMap({
  state,
  playing,
  speed,
  pulse,
}: {
  state: SimulationState;
  playing: boolean;
  speed: number;
  pulse: boolean;
}) {
  const country = state.countries[0];
  const [selected, setSelected] = useState(4);
  const svg = useRef<SVGSVGElement>(null);
  const moving = (playing || pulse) && country.metrics.Y > 0;
  useEffect(() => {
    if (!svg.current) return;
    if (moving) svg.current.unpauseAnimations();
    else svg.current.pauseAnimations();
  }, [moving]);
  const positions = [94, 277, 460, 643, 826];
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = `${Math.max(0.6, 2.8 / speed)}s`;
  const tokens = Math.max(1, Math.min(4, Math.ceil(country.metrics.Y / 100)));
  const moneyTokens = Math.max(
    1,
    Math.min(5, Math.ceil((country.metrics.M * country.metrics.V) / 100)),
  );
  return (
    <>
      <div className="network-legend">
        <span>
          <i className="goods-key" />
          Real goods <span className="legend-arrow">→</span>
        </span>
        <span>
          <i className="money-key">$</i>USD payments{" "}
          <span className="legend-arrow">←</span>
        </span>
        <span className="legend-hint">Select a stage to inspect</span>
      </div>
      <div className="map-scroll">
        <svg
          ref={svg}
          className="economy-svg"
          viewBox="0 0 920 375"
          role="group"
          aria-label="Supply chain. Goods travel right; dollar payments travel left. Owner income returns to households."
        >
          <defs>
            <marker
              id="arrow-goods"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0 0 10 5 0 10" fill="#c28d50" />
            </marker>
            <marker
              id="arrow-money"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0 0 10 5 0 10" fill="#34856f" />
            </marker>
            <pattern
              id="dots"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="0.65" fill="#cfd5cc" />
            </pattern>
          </defs>
          <rect
            width="920"
            height="280"
            y="20"
            fill="url(#dots)"
            opacity=".5"
          />
          <text x="32" y="34" className="map-section-label">
            REAL ECONOMY
          </text>
          <text x="32" y="239" className="map-section-label green-label">
            MONETARY ECONOMY
          </text>
          {positions.slice(0, -1).map((x, i) => (
            <g key={x}>
              <path
                d={`M${x + 28} 72 H${positions[i + 1] - 28}`}
                className="goods-path"
                markerEnd="url(#arrow-goods)"
              />
              <path
                d={`M${positions[i + 1] - 27} 265 H${x + 27}`}
                className="money-path"
                markerEnd="url(#arrow-money)"
              />
              <path
                d={`M${x} 95V73M${positions[i + 1]} 95V73`}
                className="connector-path"
              />
              {country.metrics.Y > 0 &&
                Array.from({ length: tokens }, (_, j) => (
                  <rect
                    key={`goods${j}`}
                    transform={
                      reducedMotion
                        ? `translate(${x + 50 + j * 20} 72)`
                        : undefined
                    }
                    width="10"
                    height="10"
                    x="-5"
                    y="-5"
                    rx="2"
                    fill="#ca9556"
                    stroke="#fff"
                    strokeWidth="1.5"
                  >
                    {!reducedMotion && (
                      <animateMotion
                        dur={duration}
                        repeatCount="indefinite"
                        begin={`${(-j * 2.8) / speed / tokens}s`}
                        path={`M${x + 30} 72 L${positions[i + 1] - 35} 72`}
                      />
                    )}
                  </rect>
                ))}
              {country.metrics.Y > 0 &&
                Array.from({ length: moneyTokens }, (_, j) => (
                  <g
                    key={`money${j}`}
                    transform={
                      reducedMotion
                        ? `translate(${x + 45 + j * 20} 265)`
                        : undefined
                    }
                  >
                    <circle r="8" fill="#e7f3ec" stroke="#34856f" />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fontSize="10"
                      fill="#22634f"
                    >
                      $
                    </text>
                    {!reducedMotion && (
                      <animateMotion
                        dur={duration}
                        begin={`${(-j * 2.8) / speed / moneyTokens}s`}
                        repeatCount="indefinite"
                        path={`M${positions[i + 1] - 30} 265 L${x + 35} 265`}
                      />
                    )}
                  </g>
                ))}
              <text
                x={(x + positions[i + 1]) / 2}
                y="91"
                textAnchor="middle"
                className="flow-label"
              >
                {format(country.metrics.Y)} units / period
              </text>
              <text
                x={(x + positions[i + 1]) / 2}
                y="286"
                textAnchor="middle"
                className="payment-label"
              >
                $
                {format(
                  country.metrics.Y > 0
                    ? country.metrics.M *
                        country.metrics.V *
                        [0.2, 0.45, 0.75, 1][i]
                    : 0,
                )}{" "}
                / period
              </text>
            </g>
          ))}
          {country.nodes.map((node, i) => (
            <g
              key={node.id}
              tabIndex={0}
              role="button"
              aria-label={`Inspect ${node.name}`}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(i);
                }
              }}
              className={`economic-node ${selected === i ? "is-selected" : ""}`}
            >
              <rect
                x={positions[i] - 67}
                y="108"
                width="134"
                height="105"
                rx="12"
                className="node-card"
              />
              <g
                transform={`translate(${positions[i]},148)`}
                className="stage-drawing"
              >
                <StageDrawing stage={node.stage} />
              </g>
              <text
                x={positions[i]}
                y="193"
                textAnchor="middle"
                className="node-title"
              >
                {node.name}
              </text>
              <circle cx={positions[i]} cy="108" r="3" fill="#c89457" />
              <path
                d={`M${positions[i]} 213V251`}
                className="wallet-connector"
              />
              <rect
                x={positions[i] - 27}
                y="251"
                width="54"
                height="28"
                rx="14"
                className="wallet-pill"
              />
              <text
                x={positions[i]}
                y="269"
                textAnchor="middle"
                className="wallet-amount"
              >
                ${format(node.wallet.USD, 1)}
              </text>
            </g>
          ))}
          <path
            d="M94 282v17q0 12 12 12h708q12 0 12-12v-17"
            fill="none"
            stroke="#9bb6a5"
            strokeDasharray="4 4"
            markerEnd="url(#arrow-money)"
          />
          {positions.slice(1, 4).map((x) => (
            <path
              key={`income-${x}`}
              d={`M${x} 280V311`}
              fill="none"
              stroke="#9bb6a5"
              strokeDasharray="4 4"
            />
          ))}
          <rect
            x="297"
            y="300"
            width="335"
            height="23"
            rx="10"
            fill="#fafbf8"
          />
          <text x="460" y="315" textAnchor="middle" className="income-label">
            Owner income returns to households · money circulates
          </text>
          {country.metrics.Y > 0 && !reducedMotion && (
            <circle r="4" fill="#72a48b">
              <animateMotion
                dur={`${4 / speed}s`}
                repeatCount="indefinite"
                path="M94 282v17q0 12 12 12h708q12 0 12-12v-17"
              />
            </circle>
          )}
          <g transform="translate(25 336)">
            <rect
              width="206"
              height="30"
              rx="7"
              fill="#edf2e9"
              stroke="#d8e2d1"
            />
            <text x="12" y="20" className="issuer-label">
              ⊕ Currency Issuer
            </text>
            <text x="190" y="20" textAnchor="end" className="issuer-status">
              {country.issuer.autoStabilize ? "AUTO" : "MANUAL"}
            </text>
          </g>
          {Math.abs(country.issuer.lastAdjustment) > 0.005 && (
            <g>
              <path
                d="M42 336V295Q42 288 48 288H75V280"
                fill="none"
                stroke="#699257"
                strokeDasharray="3 3"
                markerEnd={
                  country.issuer.lastAdjustment > 0
                    ? "url(#arrow-money)"
                    : undefined
                }
                markerStart={
                  country.issuer.lastAdjustment < 0
                    ? "url(#arrow-money)"
                    : undefined
                }
              />
              {!reducedMotion && (
                <circle r="5" fill="#7da467">
                  <animateMotion
                    dur={`${1.6 / speed}s`}
                    repeatCount="indefinite"
                    path={
                      country.issuer.lastAdjustment > 0
                        ? "M42 336V295Q42 288 48 288H75V280"
                        : "M75 280V288H48Q42 288 42 295V336"
                    }
                  />
                </circle>
              )}
            </g>
          )}
          <text x="248" y="356" className="issuer-note">
            {Math.abs(country.issuer.lastAdjustment) < 0.005
              ? "Balanced · no issuance needed"
              : `${country.issuer.lastAdjustment > 0 ? "Issuing" : "Removing"} $${format(Math.abs(country.issuer.lastAdjustment), 2)} this step → all wallets`}
          </text>
          <text x="897" y="356" textAnchor="end" className="issuer-note">
            Y counts final consumption only
          </text>
        </svg>
      </div>
      <div className="mobile-map-hint">
        Scroll the network sideways to follow the full supply chain →
      </div>
      <NodeInspector
        node={country.nodes[selected]}
        country={country}
        started={state.tick > 0}
      />
    </>
  );
}
export function TransactionLedger({ state }: { state: SimulationState }) {
  const country = state.countries[0];
  const name = (id: string) =>
    id === "issuer"
      ? "Currency Issuer"
      : (country.nodes.find((n) => n.id === id)?.name ?? id);
  const valueAdded = state.transactions
    .filter((t) => t.kind === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const finalSale =
    state.transactions.find(
      (t) => t.kind === "goods" && t.from.endsWith("consumer"),
    )?.amount ?? 0;
  return (
    <div className="ledger">
      <div className="ledger-intro">
        <Icon name="info" />
        <span>
          Actual payments from the latest step. Goods move in the opposite
          direction.
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Payment</th>
              <th>From → to</th>
              <th>Goods</th>
              <th>USD</th>
            </tr>
          </thead>
          <tbody>
            {state.transactions.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  Advance one step to inspect the first transactions.
                </td>
              </tr>
            ) : (
              state.transactions.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className={`ledger-tag ${t.kind}`}>
                      {t.kind === "goods"
                        ? t.from.endsWith("consumer")
                          ? "Final sale"
                          : "Intermediate"
                        : t.kind === "income"
                          ? "Owner income"
                          : "Issuer"}
                    </span>
                  </td>
                  <td>
                    {name(t.from)} <span className="muted">→</span> {name(t.to)}
                  </td>
                  <td>
                    {t.quantity !== undefined
                      ? `${format(t.quantity)} units ←`
                      : "—"}
                  </td>
                  <td>${format(t.amount, 2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="value-added">
        Σ value added <b>${format(valueAdded, 2)}</b>
        <span>=</span> final sales <b>${format(finalSale, 2)}</b>
        <small>Intermediate sales are excluded from final output.</small>
      </div>
    </div>
  );
}
