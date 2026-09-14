import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const STEP_LABELS = [
  "Target job",
  "Resume fit",
  "Mock interview",
  "Readiness",
  "Practice plan",
] as const;

export function Stepper({
  current,
  maxReached,
  onSelect,
}: {
  current: number;
  maxReached: number;
  onSelect: (i: number) => void;
}) {
  const pct = (current / (STEP_LABELS.length - 1)) * 100;

  return (
    <nav aria-label="Progress" className="panel p-3 sm:p-4">
      <ol className="flex items-center gap-1.5">
        {STEP_LABELS.map((label, i) => {
          const done = i < maxReached;
          const active = i === current;
          const reachable = i <= maxReached;
          return (
            <li key={label} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                onClick={() => reachable && onSelect(i)}
                className={cn(
                  "flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl border px-2 py-2 transition-colors sm:justify-start sm:px-3",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : reachable
                      ? "border-border bg-card text-muted-foreground hover:bg-secondary"
                      : "cursor-not-allowed border-transparent bg-secondary/50 text-muted-foreground/60",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-lg text-xs font-semibold",
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                        ? "bg-success text-success-foreground"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <span className="hidden truncate text-xs font-semibold md:inline">{label}</span>
                <span className="sr-only">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-center gap-3 md:hidden">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="shrink-0 text-xs font-medium text-muted-foreground">
          {current + 1}/5 · {STEP_LABELS[current]}
        </p>
      </div>
    </nav>
  );
}
