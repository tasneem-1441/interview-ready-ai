import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  LineChart,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { TASKS_BY_METRIC, type Report, type Task } from "@/lib/interview-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PracticePlanStep({ report, onRetest }: { report: Report; onRetest: () => void }) {
  const weakest = [...report.metrics].sort((a, b) => a.score - b.score)[0]!;
  const tasks: Task[] =
    report.personalizedTasks && report.personalizedTasks.length > 0
      ? report.personalizedTasks
      : (TASKS_BY_METRIC[weakest.key] ?? []).slice(0, 3);

  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const toggleTask = (title: string) => {
    setCompleted((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const doneCount = Object.values(completed).filter(Boolean).length;

  return (
    <section className="panel p-5 sm:p-7">
      <header className="mb-5">
        <p className="eyebrow">Step 5 of 5</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <Target className="size-5 text-primary" aria-hidden="true" /> Your practice plan
          </h2>
          {report.personalizedTasks && report.personalizedTasks.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> AI-Personalized Tasks
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground border border-border">
              <Target className="size-3.5 text-primary" /> Diagnostic Practice Drills
            </span>
          )}
        </div>
      </header>

      {/* Weakest Area Card */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-destructive">
          <TrendingDown className="size-3.5" aria-hidden="true" /> Priority Growth Area
        </p>
        <p className="mt-1 text-lg font-bold">
          {weakest.label} — {weakest.score}/100
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{weakest.reason}</p>
      </div>

      {/* Tasks checklist */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Targeted Practice Drills (Tied to your diagnostics)</span>
          <span>
            {doneCount} of {tasks.length} completed
          </span>
        </div>

        <ol className="mt-3 space-y-3">
          {tasks.map((t, i) => {
            const isDone = Boolean(completed[t.title]);
            return (
              <li
                key={t.title}
                onClick={() => toggleTask(t.title)}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl border p-4 transition-all",
                  isDone
                    ? "border-success/40 bg-success/5 opacity-80"
                    : "border-border bg-card hover:border-primary/50",
                )}
              >
                <button
                  type="button"
                  aria-label={`Mark task ${i + 1} as ${isDone ? "incomplete" : "complete"}`}
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-lg text-sm font-bold transition-colors",
                    isDone
                      ? "bg-success text-success-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {isDone ? <CheckCircle2 className="size-4" /> : i + 1}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isDone && "line-through text-muted-foreground",
                      )}
                    >
                      {t.title}
                    </p>
                    {t.tag && (
                      <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {t.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.detail}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Clock className="size-3.5" aria-hidden="true" /> {t.minutes} min estimated
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <Button size="lg" onClick={onRetest} className="mt-6 min-h-12 w-full text-base font-semibold">
        <RotateCcw className="size-4" aria-hidden="true" /> Retest now
      </Button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Restarts the mock interview for the same job and resume with fresh, rotated questions.
      </p>

      <Button asChild variant="outline" className="mt-3 min-h-11 w-full">
        <Link to="/progress">
          <LineChart className="size-4" aria-hidden="true" /> View progress & attempt history
        </Link>
      </Button>
    </section>
  );
}
