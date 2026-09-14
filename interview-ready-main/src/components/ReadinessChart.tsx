import { useState } from "react";
import { BarChart3, LineChart, Target } from "lucide-react";
import type { Attempt } from "@/lib/session-store";
import { cn } from "@/lib/utils";

export function ReadinessChart({ attempts }: { attempts: Attempt[] }) {
  const [chartMode, setChartMode] = useState<"curve" | "bars">("curve");
  const [activePoint, setActivePoint] = useState<number | null>(null);

  const width = 640;
  const height = 220;
  const padLeft = 45;
  const padRight = 35;
  const padTop = 35;
  const padBottom = 40;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Calculate coordinates for points
  const points = attempts.map((a, i) => {
    const x =
      attempts.length === 1 ? padLeft + chartW / 2 : padLeft + (i / (attempts.length - 1)) * chartW;
    const y = padTop + (1 - Math.max(0, Math.min(100, a.readiness)) / 100) * chartH;
    return { x, y, attempt: a, index: i };
  });

  const benchmarkY = padTop + (1 - 70 / 100) * chartH;

  // Build SVG path
  let linePath = "";
  let areaPath = "";

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (points.length === 1 && firstPoint) {
    linePath = `M ${firstPoint.x - 60} ${firstPoint.y} L ${firstPoint.x + 60} ${firstPoint.y}`;
  } else if (points.length >= 2 && firstPoint && lastPoint) {
    linePath = `M ${firstPoint.x} ${firstPoint.y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      if (!p0 || !p1) continue;
      const cx = (p0.x + p1.x) / 2;
      linePath += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    const baselineY = padTop + chartH;
    areaPath = `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;
  }

  return (
    <section className="panel overflow-hidden p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">Readiness Over Time</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
              <Target className="size-3" /> Target: 70+
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Progress trajectory across {attempts.length} practice session
            {attempts.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setChartMode("curve")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors cursor-pointer",
              chartMode === "curve"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LineChart className="size-3.5" /> Trend Curve
          </button>
          <button
            type="button"
            onClick={() => setChartMode("bars")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors cursor-pointer",
              chartMode === "bars"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <BarChart3 className="size-3.5" /> Bar Breakdown
          </button>
        </div>
      </div>

      {chartMode === "curve" ? (
        <div className="relative w-full rounded-xl border border-border/70 bg-card/40 p-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[250px] overflow-visible"
            aria-label="Readiness trajectory chart"
          >
            <defs>
              <linearGradient id="readinessAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
                <stop offset="85%" stopColor="var(--primary)" stopOpacity="0.04" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="3"
                  floodColor="var(--primary)"
                  floodOpacity="0.3"
                />
              </filter>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Scale */}
            {[0, 25, 50, 75, 100].map((val) => {
              const yVal = padTop + (1 - val / 100) * chartH;
              return (
                <g key={val} className="text-muted-foreground">
                  <line
                    x1={padLeft}
                    y1={yVal}
                    x2={width - padRight}
                    y2={yVal}
                    stroke="currentColor"
                    strokeOpacity={val === 0 ? "0.25" : "0.08"}
                    strokeDasharray={val === 0 ? undefined : "3 3"}
                  />
                  <text
                    x={padLeft - 8}
                    y={yVal + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fill="currentColor"
                    className="font-mono text-[10px] opacity-70"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Benchmark line at 70 points */}
            <line
              x1={padLeft}
              y1={benchmarkY}
              x2={width - padRight}
              y2={benchmarkY}
              stroke="var(--success)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              strokeOpacity="0.85"
            />
            <text
              x={width - padRight}
              y={benchmarkY - 6}
              textAnchor="end"
              fontSize="9.5"
              fontWeight="600"
              fill="var(--success)"
            >
              🎯 70 Ready Benchmark
            </text>

            {/* Area fill */}
            {areaPath && <path d={areaPath} fill="url(#readinessAreaGrad)" />}

            {/* Line stroke */}
            <path
              d={linePath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#glowEffect)"
            />

            {/* Interactive Data Nodes */}
            {points.map((p) => {
              const isReady = p.attempt.readiness >= 70;
              const prevAttempt =
                p.index > 0 && points[p.index - 1] ? points[p.index - 1]!.attempt : null;
              const deltaFromPrev = prevAttempt
                ? p.attempt.readiness - prevAttempt.readiness
                : null;
              const isHovered = activePoint === p.index;

              return (
                <g
                  key={p.attempt.id}
                  className="cursor-pointer transition-transform"
                  onMouseEnter={() => setActivePoint(p.index)}
                  onMouseLeave={() => setActivePoint(null)}
                >
                  {/* Subtle vertical indicator on hover */}
                  {isHovered && (
                    <line
                      x1={p.x}
                      y1={padTop}
                      x2={p.x}
                      y2={padTop + chartH}
                      stroke="var(--primary)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      strokeOpacity="0.5"
                    />
                  )}

                  {/* Outer halo */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? "10" : "7"}
                    fill="var(--background)"
                    stroke="var(--primary)"
                    strokeWidth={isHovered ? "3.5" : "2.5"}
                    className="transition-all duration-200"
                  />
                  {/* Inner dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? "4" : "3"}
                    fill={isReady ? "var(--success)" : "var(--primary)"}
                  />

                  {/* Score pill above node */}
                  <g transform={`translate(${p.x}, ${p.y - 14})`}>
                    <rect
                      x="-16"
                      y="-16"
                      width="32"
                      height="17"
                      rx="8.5"
                      fill={isReady ? "var(--success)" : "var(--card)"}
                      stroke={isReady ? "var(--success)" : "var(--border)"}
                      strokeWidth="1"
                      className="shadow-xs"
                    />
                    <text
                      x="0"
                      y="-4.5"
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={isReady ? "var(--success-foreground)" : "var(--foreground)"}
                      className="font-display"
                    >
                      {p.attempt.readiness}
                    </text>
                  </g>

                  {/* Delta tag if increased */}
                  {deltaFromPrev !== null && (
                    <g transform={`translate(${p.x}, ${p.y - 35})`}>
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill={deltaFromPrev >= 0 ? "var(--success)" : "var(--destructive)"}
                      >
                        {deltaFromPrev >= 0 ? `+${deltaFromPrev}` : deltaFromPrev}
                      </text>
                    </g>
                  )}

                  {/* X-axis label */}
                  <text
                    x={p.x}
                    y={padTop + chartH + 18}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill="var(--foreground)"
                  >
                    Round {p.index + 1}
                  </text>
                  <text
                    x={p.x}
                    y={padTop + chartH + 30}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--muted-foreground)"
                  >
                    {new Date(p.attempt.at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip when hovering a point */}
          {activePoint !== null &&
            points[activePoint] &&
            (() => {
              const p = points[activePoint]!;
              const isReady = p.attempt.readiness >= 70;
              return (
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-border bg-popover/95 p-2.5 shadow-lg backdrop-blur-xs text-xs space-y-1 transition-all"
                  style={{
                    left: `${(p.x / width) * 100}%`,
                    top: "12px",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-foreground">
                      Round {p.index + 1}: {p.attempt.jobTitle}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isReady ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
                      )}
                    >
                      {isReady ? "Interview Ready" : "Developing"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground gap-4">
                    <span>
                      Score: <strong className="text-foreground">{p.attempt.readiness}/100</strong>
                    </span>
                    <span>
                      {new Date(p.attempt.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })()}
        </div>
      ) : (
        /* Bar Breakdown View */
        <div className="relative h-56 w-full rounded-xl border border-border/70 bg-card/40 pt-8 pb-4 px-4 sm:px-8 flex items-end justify-around gap-4">
          {/* 70 Benchmark line across bars */}
          <div
            className="absolute left-4 right-4 border-b border-dashed border-success/60 z-0 pointer-events-none flex items-center justify-end"
            style={{ bottom: "calc(16px + (100% - 48px) * 0.70)" }}
          >
            <span className="text-[10px] font-bold text-success bg-background/90 px-1.5 py-0.5 rounded shadow-xs -translate-y-1/2">
              70 Benchmark
            </span>
          </div>

          {attempts.map((a, i) => {
            const isReady = a.readiness >= 70;
            const prevScore = i > 0 && attempts[i - 1] ? attempts[i - 1]!.readiness : null;
            const diff = prevScore !== null ? a.readiness - prevScore : null;

            return (
              <div
                key={a.id}
                className="h-full flex flex-col justify-end items-center flex-1 max-w-28 relative group z-1"
              >
                {/* Score and optional delta badge */}
                <div className="mb-2 flex flex-col items-center">
                  {diff !== null && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-1.5 py-0.2 rounded-full mb-1",
                        diff >= 0
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {diff >= 0 ? `+${diff}` : diff}
                    </span>
                  )}
                  <span className="font-display text-sm font-bold text-foreground">
                    {a.readiness}
                  </span>
                </div>

                {/* Vertical Bar Container */}
                <div className="w-full h-32 flex items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-xl transition-all duration-500 shadow-sm group-hover:brightness-110",
                      isReady
                        ? "bg-gradient-to-t from-primary to-primary/80"
                        : "bg-gradient-to-t from-primary/60 to-primary/40",
                    )}
                    style={{ height: `${Math.max(12, a.readiness)}%` }}
                    role="img"
                    aria-label={`${a.jobTitle}: ${a.readiness} out of 100`}
                  />
                </div>

                {/* X-axis label */}
                <div className="mt-2 text-center">
                  <span className="block text-xs font-semibold text-foreground">Round {i + 1}</span>
                  <span className="block text-[10px] text-muted-foreground truncate max-w-24">
                    {new Date(a.at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
