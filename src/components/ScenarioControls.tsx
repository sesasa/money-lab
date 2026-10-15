import { useEffect, useRef, useState } from "react";
import { scenarios } from "../simulation/scenario";
import type { Country, Parameters } from "../simulation/types";
import { Icon } from "./Icon";
export function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (n: number) => void;
  hint?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const committed = useRef(value);
  useEffect(() => {
    setDraft(value);
    committed.current = value;
  }, [value]);
  const commit = (value: number) => {
    if (Math.abs(value - committed.current) > 1e-8) {
      committed.current = value;
      onChange(value);
    }
  };
  return (
    <label className={`slider-field ${disabled ? "disabled" : ""}`}>
      <span className="slider-title">
        {label}
        <output>
          {Math.abs(draft - value) > 1e-8
            ? step < 1
              ? draft.toFixed(2)
              : draft.toFixed(0)
            : display}
        </output>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(Number(e.target.value))}
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerUp={(e) => commit(Number(e.currentTarget.value))}
        onKeyUp={(e) => commit(Number(e.currentTarget.value))}
        onBlur={(e) => commit(Number(e.currentTarget.value))}
        onPointerCancel={() => setDraft(value)}
        style={
          {
            "--range-progress": `${((draft - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
      />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}
function PriceTarget({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const next = Number(draft);
    if (draft.trim() && Number.isFinite(next)) {
      const bounded = Math.max(0.5, Math.min(2, next));
      setDraft(String(bounded));
      if (bounded !== value) onChange(bounded);
    } else setDraft(String(value));
  };
  return (
    <input
      id="price-target"
      aria-label="Target price level"
      type="number"
      min="0.5"
      max="2"
      step="0.1"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
export function ScenarioControls({
  country,
  scenarioId,
  onChange,
  onScenario,
}: {
  country: Country;
  scenarioId: string;
  onChange: (p: Partial<Parameters>) => void;
  onScenario: (id: string) => void;
}) {
  return (
    <aside className="control-panel" id="experiment-controls">
      <div className="panel-heading">
        <Icon name="sliders" />
        <h2>Your experiment</h2>
        <span className="small-tag">01</span>
      </div>
      <p className="muted control-intro">
        Change an assumption.
        <br />
        Follow what happens next.
      </p>
      <div className="control-section-label">
        <span className="tiny-dot orange" /> THE REAL ECONOMY
      </div>
      <Slider
        label="Productivity"
        value={country.productivity}
        min={0.5}
        max={2}
        step={0.05}
        display={`${country.productivity.toFixed(2)}×`}
        onChange={(productivity) => onChange({ productivity })}
        hint="Output per unit of capacity"
      />
      <Slider
        label="Production capacity"
        value={country.capacity}
        min={0}
        max={200}
        step={5}
        display={`${country.capacity.toFixed(0)}`}
        onChange={(capacity) => onChange({ capacity })}
        hint="Base units per period"
      />
      <div className="control-section-label money-label">
        <span className="tiny-dot green" /> THE MONETARY ECONOMY
      </div>
      <Slider
        label="Money supply · M"
        value={Math.max(10, Math.min(300, country.metrics.M))}
        min={10}
        max={300}
        step={5}
        display={`$${country.metrics.M.toFixed(1)}`}
        onChange={(moneySupply) => onChange({ moneySupply })}
        disabled={country.issuer.autoStabilize}
        hint={
          country.metrics.M > 300 || country.metrics.M < 10
            ? "Supply is outside the manual slider range (10–300)"
            : country.issuer.autoStabilize
              ? "Managed by the Currency Issuer"
              : "Total dollars across all five wallets"
        }
      />
      <Slider
        label="Velocity · V"
        value={country.velocity}
        min={0.25}
        max={3}
        step={0.05}
        display={`${country.velocity.toFixed(2)}×`}
        onChange={(velocity) => onChange({ velocity })}
        hint="Final spending / money, per period"
      />
      <div className="stabilizer">
        <div className="toggle-row">
          <label htmlFor="stabilize">Auto Stabilize Prices</label>
          <button
            id="stabilize"
            role="switch"
            aria-checked={country.issuer.autoStabilize}
            aria-label="Auto Stabilize Prices"
            className={`switch ${country.issuer.autoStabilize ? "on" : ""}`}
            onClick={() =>
              onChange({ autoStabilize: !country.issuer.autoStabilize })
            }
          >
            <span />
          </button>
        </div>
        <p>
          {country.issuer.autoStabilize
            ? "M adjusts toward the price target."
            : "You control M. The price level adjusts."}
        </p>
        {country.issuer.autoStabilize && (
          <>
            <div className="target-row">
              <label htmlFor="price-target">Target P</label>
              <PriceTarget
                value={country.issuer.targetPrice}
                onChange={(targetPrice) => onChange({ targetPrice })}
              />
            </div>
            <code>M target = P target × Y / V</code>
          </>
        )}
      </div>
      <div className="scenario-heading">
        <h3>Try a scenario</h3>
        <span>RESETS RUN</span>
      </div>
      <div className="scenario-list">
        {scenarios.map((scenario, i) => (
          <button
            key={scenario.id}
            title={scenario.description}
            className={`scenario-button ${scenarioId === scenario.id ? "selected" : ""}`}
            onClick={() => onScenario(scenario.id)}
          >
            <span className="scenario-index">0{i + 1}</span>
            <span>
              {scenario.name}
              <small>{scenario.tag}</small>
            </span>
            <Icon name="arrow" size={14} />
          </button>
        ))}
      </div>
      <div className="scope-note">
        <Icon name="globe" size={17} />
        <p>
          <strong>Start small. See the system.</strong>One economy, one product,
          one currency. International trade & FX are the next layer.
        </p>
      </div>
    </aside>
  );
}
