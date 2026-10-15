import { useEffect, useRef, useState } from "react";
import {
  createSimulation,
  runScenario,
  stepSimulation,
  updateParameters,
} from "./simulation/simulationEngine";
import type { Parameters } from "./simulation/types";
import { ScenarioControls } from "./components/ScenarioControls";
import { MetricPanel, EquationPanel, format } from "./components/MetricPanel";
import { EconomyMap, TransactionLedger } from "./components/EconomyMap";
import { TimelineCharts } from "./components/TimelineCharts";
import { ModelNotes } from "./components/ModelNotes";
import { Icon } from "./components/Icon";

export default function App() {
  const [state, setState] = useState(createSimulation);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState<"network" | "ledger">("network");
  const [notes, setNotes] = useState(false);
  const notesOpener = useRef<HTMLElement | null>(null);
  const [pulse, setPulse] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => setState(stepSimulation), 800 / speed);
    return () => clearInterval(interval);
  }, [playing, speed]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const country = state.countries[0];
  const change = (parameters: Partial<Parameters>) =>
    setState((old) => updateParameters(old, parameters));
  const reset = () => {
    setState(createSimulation());
    setPlaying(false);
    setPulse(false);
    clearTimeout(timer.current);
  };
  const step = () => {
    setState(stepSimulation);
    setPulse(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPulse(false), 750);
  };
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="./" aria-label="Money Lab home">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          money<span className="brand-light">lab</span>
          <span className="brand-period">.</span>
        </a>
        <span className="header-divider" />
        <span className="header-descriptor">A SMALL MODEL OF A BIG SYSTEM</span>
        <div className="header-right">
          <span className="version-badge">
            <span className="tiny-dot green" />
            DOMESTIC ECONOMY · V0.1
          </span>
          <button
            className="text-button"
            onClick={(e) => {
              notesOpener.current = e.currentTarget;
              setNotes(true);
            }}
          >
            <Icon name="book" size={16} />
            Model notes
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </header>
      <main>
        <div className="page-intro">
          <div>
            <div className="eyebrow intro-eyebrow">THE ECONOMIC LABORATORY</div>
            <h1>
              The economy, <em>in motion.</em>
            </h1>
            <p>
              Real goods. Circulating money. A few assumptions that change
              everything.
            </p>
          </div>
          <div className="intro-note">
            <span className="intro-note-line" />
            <span>
              Money coordinates the economy.
              <br />
              <strong>Production creates the wealth.</strong>
            </span>
          </div>
        </div>
        <nav className="mobile-jump-nav" aria-label="Laboratory sections">
          <a href="#economy-live">
            View the economy <Icon name="chart" size={14} />
          </a>
          <a href="#experiment-controls">
            Change an assumption <Icon name="sliders" size={14} />
          </a>
        </nav>
        <div className="lab-layout">
          <ScenarioControls
            country={country}
            scenarioId={state.scenarioId}
            onChange={change}
            onScenario={(id) => {
              setState(runScenario(id));
              setPlaying(true);
              if (window.matchMedia("(max-width:680px)").matches)
                document.getElementById("economy-live")?.scrollIntoView({
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "instant"
                    : "smooth",
                });
            }}
          />
          <div className="lab-main" id="economy-live">
            <section className="economy-panel panel">
              <div className="economy-toolbar">
                <div className="country-heading">
                  <span className="country-flag">US</span>
                  <div>
                    <h2>
                      United States <span className="currency-badge">USD</span>
                    </h2>
                    <p>
                      {state.tick === 0
                        ? "Steady-state starting point · press Play"
                        : "One supply chain. Two connected flows."}
                    </p>
                  </div>
                </div>
                <div className="playback">
                  <span className="time-display">
                    t <b>{format(state.time)}</b>
                  </span>
                  <button
                    className="icon-button"
                    title="Reset to baseline"
                    aria-label="Reset to baseline"
                    onClick={reset}
                  >
                    <Icon name="reset" size={17} />
                  </button>
                  <button
                    className="icon-button step-button"
                    title="Advance one step"
                    aria-label="Advance one step"
                    onClick={step}
                    disabled={playing}
                  >
                    <Icon name="step" size={17} />
                  </button>
                  <select
                    value={speed}
                    aria-label="Simulation speed"
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  >
                    <option value="0.5">0.5×</option>
                    <option value="1">1×</option>
                    <option value="2">2×</option>
                    <option value="4">4×</option>
                  </select>
                  <button
                    className="play-button"
                    onClick={() => setPlaying(!playing)}
                  >
                    <Icon name={playing ? "pause" : "play"} size={15} />
                    {playing ? "Pause" : "Play"}
                  </button>
                </div>
              </div>
              <div className="network-tabs">
                <div
                  role="tablist"
                  aria-label="Economy view"
                  onKeyDown={(e) => {
                    if (
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                    ) {
                      e.preventDefault();
                      const next =
                        e.key === "Home"
                          ? "network"
                          : e.key === "End"
                            ? "ledger"
                            : tab === "network"
                              ? "ledger"
                              : "network";
                      setTab(next);
                      document.getElementById(`tab-${next}`)?.focus();
                    }
                  }}
                >
                  <button
                    id="tab-network"
                    role="tab"
                    aria-controls="panel-network"
                    tabIndex={tab === "network" ? 0 : -1}
                    aria-selected={tab === "network"}
                    onClick={() => setTab("network")}
                  >
                    Live network
                  </button>
                  <button
                    id="tab-ledger"
                    role="tab"
                    aria-controls="panel-ledger"
                    tabIndex={tab === "ledger" ? 0 : -1}
                    aria-selected={tab === "ledger"}
                    onClick={() => setTab("ledger")}
                  >
                    Transaction ledger
                  </button>
                </div>
                <span className="run-status">
                  <span className={`tiny-dot ${playing ? "green" : "gray"}`} />
                  {playing
                    ? "RUNNING"
                    : state.tick === 0
                      ? "BASELINE"
                      : "PAUSED"}
                  <span>·</span>CLOSED ECONOMY
                </span>
              </div>
              <div
                id={`panel-${tab}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab}`}
                tabIndex={0}
              >
                {tab === "network" ? (
                  <EconomyMap
                    state={state}
                    playing={playing}
                    speed={speed}
                    pulse={pulse}
                  />
                ) : (
                  <TransactionLedger state={state} />
                )}
              </div>
            </section>
            <div className="section-caption">
              <span>THE FOUR VARIABLES</span>
              <span>Changes relative to the starting point</span>
            </div>
            <MetricPanel country={country} />
            <EquationPanel country={country} />
            <div className="bottom-grid">
              <TimelineCharts history={state.history} />
              <section className="insight-panel panel">
                <div className="insight-title">
                  <span className="insight-icon">↗</span>
                  <span className="eyebrow">WHAT’S HAPPENING?</span>
                </div>
                <h2>
                  {state.scenarioId === "baseline"
                    ? "A balanced starting point."
                    : state.scenarioId === "healthy"
                      ? "Growth can be price-stable."
                      : state.scenarioId === "fixed"
                        ? "More goods. Same money."
                        : state.scenarioId === "money"
                          ? "More money. Same goods."
                          : state.scenarioId === "velocity"
                            ? "Money moves more often."
                            : state.scenarioId === "capacity"
                              ? "Less output, higher prices."
                              : "One change, a new balance."}
                </h2>
                <p aria-live="polite">{state.explanation}</p>
                <div className="insight-equation">
                  <span>REAL OUTPUT</span>
                  <b>Final consumption only.</b>
                  <small>
                    Intermediate goods help create Y.
                    <br />
                    Adding their sales again would double-count production.
                  </small>
                </div>
                <button
                  className="text-button"
                  onClick={(e) => {
                    notesOpener.current = e.currentTarget;
                    setNotes(true);
                  }}
                >
                  Understand the assumptions
                  <Icon name="arrow" size={15} />
                </button>
              </section>
            </div>
            <div className="model-footnote">
              <Icon name="info" size={14} />
              <span>
                A simplified model, not a forecast. P = MV/Y is a chosen
                closure; the equation alone does not prove causality.
              </span>
            </div>
          </div>
        </div>
      </main>
      <footer>
        <span>
          MONEY LAB <span className="footer-dot">/</span> An experiment in
          understanding.
        </span>
        <span>Real resources first. Money alongside.</span>
      </footer>
      {notes && (
        <ModelNotes
          onClose={() => setNotes(false)}
          returnFocusTo={notesOpener.current}
        />
      )}
    </div>
  );
}
