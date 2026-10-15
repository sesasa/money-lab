import { useState } from "react";
import type { TimelinePoint } from "../simulation/types";
import { format } from "./MetricPanel";
import { Icon } from "./Icon";
type Series = "Y" | "M" | "V" | "P";
const SERIES: { key: Series; label: string; color: string; scale: number }[] = [
  { key: "Y", label: "Output", color: "#bc8846", scale: 1 },
  { key: "M", label: "Money", color: "#2f806a", scale: 1 },
  { key: "V", label: "Velocity", color: "#648bb4", scale: 100 },
  { key: "P", label: "Prices", color: "#9c7aab", scale: 100 },
];
export function TimelineCharts({ history }: { history: TimelinePoint[] }) {
  const [enabled, setEnabled] = useState<Series[]>(["Y", "M", "V", "P"]);
  const [hover, setHover] = useState<number | null>(null);
  const latest = history.at(-1)!;
  const focus =
    hover === null ? latest : history[Math.min(hover, history.length - 1)];
  const values = history.flatMap((p) =>
    SERIES.filter((s) => enabled.includes(s.key)).map(
      (s) => (p[s.key] ?? 1) * s.scale,
    ),
  );
  const low = Math.max(0, Math.floor((Math.min(80, ...values) - 10) / 20) * 20);
  const high = Math.ceil((Math.max(120, ...values) + 10) / 20) * 20;
  const start = history[0].time;
  const end = Math.max(start + 6, latest.time);
  const x = (p: TimelinePoint) => 46 + ((p.time - start) / (end - start)) * 628;
  const y = (n: number) => 174 - ((n - low) / (high - low)) * 142;
  const ticks = Array.from(
    { length: 5 },
    (_, i) => low + ((high - low) * i) / 4,
  );
  const exportData = () => {
    const csv =
      "period,Y,M,V,P\n" +
      history
        .map((p) => [p.time, p.Y, p.M, p.V, p.P ?? ""].join(","))
        .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "money-lab-timeline.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="chart-panel panel">
      <div className="panel-heading">
        <Icon name="chart" />
        <h2>The story over time</h2>
        <button
          className="icon-button"
          onClick={exportData}
          title="Download timeline as CSV"
          aria-label="Download timeline as CSV"
        >
          <Icon name="download" size={16} />
        </button>
      </div>
      <div className="chart-topline">
        <span>Indexed to the starting point = 100</span>
        <span>
          {hover === null ? "LATEST" : "INSPECTING"} · t {format(focus.time)}
        </span>
      </div>
      <div className="series-controls">
        {SERIES.map((s) => (
          <button
            key={s.key}
            aria-pressed={enabled.includes(s.key)}
            className={!enabled.includes(s.key) ? "series-hidden" : ""}
            onClick={() =>
              setEnabled((previous) =>
                previous.includes(s.key)
                  ? previous.filter((k) => k !== s.key)
                  : [...previous, s.key],
              )
            }
          >
            <span style={{ background: s.color }} />
            <b>{s.key}</b> {s.label}
            <strong>
              {format(focus[s.key], s.key === "P" || s.key === "V" ? 2 : 1)}
            </strong>
          </button>
        ))}
      </div>
      <svg
        viewBox="0 0 700 214"
        role="img"
        aria-label="Timeline of output, money supply, velocity, and price level, indexed to 100 at baseline. Hover to inspect exact values."
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const coordinate = ((e.clientX - rect.left) / rect.width) * 700;
          const time = start + ((coordinate - 46) / 628) * (end - start);
          let nearest = 0;
          history.forEach((p, i) => {
            if (
              Math.abs(p.time - time) <= Math.abs(history[nearest].time - time)
            )
              nearest = i;
          });
          setHover(nearest);
        }}
        onPointerLeave={() => setHover(null)}
        className="timeline-svg"
      >
        {ticks.map((t) => (
          <g key={t}>
            <path
              d={`M46 ${y(t)}H674`}
              stroke="#e9ece4"
              strokeDasharray="3 4"
            />
            <text x="34" y={y(t) + 4} textAnchor="end" className="axis-label">
              {Math.round(t)}
            </text>
          </g>
        ))}
        <path d={`M46 ${y(100)}H674`} stroke="#c3cbbd" strokeDasharray="4 4" />
        {history
          .filter((p) => p.event)
          .map((p) => (
            <g key={p.tick}>
              <path
                d={`M${x(p)} 22V174`}
                stroke="#d3dacb"
                strokeDasharray="2 4"
              />
              <path d={`M${x(p) - 3} 19h6l-3 5Z`} fill="#93a583" />
              <title>
                Period {p.time}: {p.event}
              </title>
            </g>
          ))}
        {SERIES.filter((s) => enabled.includes(s.key)).map((s) => (
          <path
            key={s.key}
            d={history
              .map((p, index) =>
                p[s.key] === null
                  ? ""
                  : `${index === 0 || history[index - 1][s.key] === null ? "M" : "L"}${x(p)},${y(p[s.key]! * s.scale)}`,
              )
              .join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={
              s.key === "V" ? "6 5" : s.key === "P" ? "2 4" : undefined
            }
          />
        ))}
        {Array.from({ length: 5 }, (_, i) => {
          const time = start + ((end - start) * i) / 4;
          return (
            <text
              key={i}
              x={46 + (628 * i) / 4}
              y="198"
              textAnchor="middle"
              className="axis-label"
            >
              {format(time)}
            </text>
          );
        })}
        {hover !== null && (
          <g>
            <path
              d={`M${x(focus)} 25V177`}
              stroke="#6c756a"
              strokeDasharray="3 4"
            />
            {SERIES.filter(
              (s) => enabled.includes(s.key) && focus[s.key] !== null,
            ).map((s) => (
              <circle
                key={s.key}
                cx={x(focus)}
                cy={y(focus[s.key]! * s.scale)}
                r="4"
                fill={s.color}
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </g>
        )}
      </svg>
      <div className="chart-foot">
        <span>Hover to inspect · select a legend to isolate</span>
        <span>Time in model periods</span>
      </div>
    </section>
  );
}
