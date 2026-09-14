import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LineChart, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { useSession } from "@/lib/session-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReadinessChart } from "@/components/ReadinessChart";

const TITLE = "Progress — NCS InterviewReady AI";
const DESCRIPTION =
  "Track every mock interview attempt: readiness score over time, and how your fit, answers, delivery and soft skills change.";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { ready, attempts, clearHistory } = useSession();

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <section className="panel flex flex-col items-center p-8 text-center sm:p-12">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <LineChart className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-bold">No attempts yet</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Finish one mock interview and your readiness score will be saved here so you can watch it
          climb.
        </p>
        <Button asChild className="mt-5 min-h-12">
          <Link to="/prepare">
            Start preparing <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>
    );
  }

  const ordered = [...attempts].sort((a, b) => a.at - b.at);
  const best = Math.max(...ordered.map((a) => a.readiness));
  const latest = ordered[ordered.length - 1]!;
  const first = ordered[0]!;
  const delta = latest.readiness - first.readiness;
  const max = Math.max(best, 100);

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Your progress</h1>
          <p className="text-sm text-muted-foreground">
            {ordered.length} practice session{ordered.length > 1 ? "s" : ""} completed · Stored
            privately on this device (no limit)
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearHistory} className="min-h-11 shrink-0">
          <Trash2 className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Clear history</span>
          <span className="sr-only sm:hidden">Clear history</span>
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Latest readiness", value: `${latest.readiness}/100` },
          { label: "Best readiness", value: `${best}/100` },
          { label: "Change since first", value: `${delta >= 0 ? "+" : ""}${delta}` },
        ].map((s) => (
          <div key={s.label} className="panel p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 flex items-center gap-2 font-display text-2xl font-bold">
              {s.value}
              {s.label === "Change since first" &&
                (delta >= 0 ? (
                  <TrendingUp className="size-5 text-success" aria-hidden="true" />
                ) : (
                  <TrendingDown className="size-5 text-destructive" aria-hidden="true" />
                ))}
            </p>
          </div>
        ))}
      </div>

      <ReadinessChart attempts={ordered} />

      {/* Measurable Improvement Comparison (when 2+ attempts exist) */}
      {ordered.length >= 2 &&
        (() => {
          const prev = ordered[ordered.length - 2]!;
          const overallDelta = latest.readiness - prev.readiness;

          return (
            <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <TrendingUp className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold">Measurable Improvement Breakdown</h2>
                    <p className="text-xs text-muted-foreground">
                      Comparing your latest attempt against the previous one
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 font-display text-sm font-bold",
                    overallDelta >= 0
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {overallDelta >= 0 ? `+${overallDelta} Points Gain` : `${overallDelta} Points`}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {latest.metrics.map((cur) => {
                  const prevMetric = prev.metrics.find((m) => m.key === cur.key);
                  const prevScore = prevMetric?.score ?? 0;
                  const mDelta = cur.score - prevScore;

                  return (
                    <div
                      key={cur.key}
                      className="rounded-xl border border-border bg-card p-3.5 space-y-1.5"
                    >
                      <p className="truncate text-xs font-semibold text-muted-foreground">
                        {cur.label}
                      </p>
                      <div className="flex items-baseline justify-between">
                        <span className="font-display text-lg font-bold text-foreground">
                          {cur.score}/100
                        </span>
                        <span
                          className={cn(
                            "text-xs font-bold",
                            mDelta > 0
                              ? "text-success"
                              : mDelta < 0
                                ? "text-destructive"
                                : "text-muted-foreground",
                          )}
                        >
                          {mDelta > 0 ? `+${mDelta}` : mDelta === 0 ? "±0" : `${mDelta}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Was {prevScore}/100 in previous attempt
                      </p>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {overallDelta >= 0
                  ? "Your deliberate practice drills are translating into clearer STAR structure, reduced pauses, and higher domain relevance."
                  : "Target the lowest-scoring category in your next practice plan to recover momentum."}
              </p>
            </section>
          );
        })()}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Attempt history</h2>
        {[...ordered].reverse().map((a) => (
          <article key={a.id} className="panel p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{a.jobTitle}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.org} · {new Date(a.at).toLocaleString()} · {a.questionsAnswered} answers
                </p>
              </div>
              <span className="shrink-0 font-display text-xl font-bold">{a.readiness}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {a.metrics.map((m) => (
                <div key={m.key}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="truncate text-muted-foreground">{m.label}</span>
                    <span className="shrink-0 font-medium">{m.score}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        m.score >= 75
                          ? "bg-success"
                          : m.score >= 55
                            ? "bg-warning"
                            : "bg-destructive",
                      )}
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <Button asChild size="lg" className="min-h-12 w-full">
        <Link to="/prepare">
          Run another attempt <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
