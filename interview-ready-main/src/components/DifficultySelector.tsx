import { Flame, Layers, Sparkles } from "lucide-react";
import type { Difficulty } from "@/lib/interview-data";
import { cn } from "@/lib/utils";

const TIERS: {
  id: Difficulty;
  label: string;
  tagline: string;
  detail: string;
  icon: typeof Sparkles;
  accent: {
    active: string;
    border: string;
    text: string;
    badge: string;
  };
}[] = [
  {
    id: "easy",
    label: "Easy",
    tagline: "Foundational & Standard",
    detail:
      "Core concepts, entry-level syntax, straightforward HR questions, and standard behavioral prompts.",
    icon: Sparkles,
    accent: {
      active: "bg-success/15 border-success text-success-foreground dark:text-success",
      border: "border-success/40",
      text: "text-success",
      badge: "bg-success/15 text-success border-success/30",
    },
  },
  {
    id: "medium",
    label: "Medium",
    tagline: "Real-world & Trade-offs",
    detail:
      "Production application scenarios, architectural trade-offs, and practical situational challenges.",
    icon: Layers,
    accent: {
      active: "bg-primary/15 border-primary text-foreground",
      border: "border-primary/40",
      text: "text-primary",
      badge: "bg-primary/15 text-primary border-primary/30",
    },
  },
  {
    id: "hard",
    label: "Hard",
    tagline: "Distributed Scale & Edge Cases",
    detail:
      "System design under load, high-concurrency race conditions, executive friction, and crisis management.",
    icon: Flame,
    accent: {
      active: "bg-destructive/15 border-destructive text-foreground",
      border: "border-destructive/40",
      text: "text-destructive",
      badge: "bg-destructive/15 text-destructive border-destructive/30",
    },
  },
];

export function DifficultySelector({
  value,
  onChange,
  disabled = false,
}: {
  value: Difficulty;
  onChange: (val: Difficulty) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Interview Difficulty Tier
        </label>
        <span className="text-xs text-muted-foreground">
          Calibrates question depth and evaluation rigor
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {TIERS.map((tier) => {
          const isSelected = value === tier.id;
          const Icon = tier.icon;
          return (
            <button
              key={tier.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(tier.id)}
              className={cn(
                "group relative flex flex-col items-start rounded-xl border p-3.5 text-left transition-all",
                isSelected
                  ? cn(tier.accent.active, "shadow-sm ring-1 ring-primary/40")
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary/50",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-sm">
                  <Icon className={cn("size-4", tier.accent.text)} />
                  {tier.label}
                </span>
                {isSelected && (
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide",
                      tier.accent.badge,
                    )}
                  >
                    Active
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs font-medium text-foreground/90">{tier.tagline}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {tier.detail}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const tier = TIERS.find((t) => t.id === difficulty) || TIERS[1]!;
  const Icon = tier.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tier.accent.badge,
      )}
    >
      <Icon className="size-3" />
      {tier.label} Tier
    </span>
  );
}
