import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Gauge,
  Info,
  Keyboard,
  Lightbulb,
  Mic,
  ShieldCheck,
  Sparkles,
  Target,
  Volume2,
  XCircle,
} from "lucide-react";
import type { Report, StarLevel } from "@/lib/interview-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function band(score: number) {
  if (score >= 80) return { label: "Interview ready", tone: "text-success" };
  if (score >= 60) return { label: "Nearly there", tone: "text-warning" };
  return { label: "Needs practice", tone: "text-destructive" };
}

function StarBadge({ label, level }: { label: string; level: StarLevel }) {
  const config = {
    clear: {
      color: "bg-success/10 text-success border-success/30",
      icon: CheckCircle2,
      text: "Clear",
    },
    weak: {
      color: "bg-warning/10 text-warning border-warning/30",
      icon: AlertTriangle,
      text: "Vague / Weak",
    },
    missing: {
      color: "bg-destructive/10 text-destructive border-destructive/30",
      icon: XCircle,
      text: "Missing",
    },
  }[level];

  const Icon = config.icon;

  return (
    <div
      className={cn("flex flex-col items-center rounded-xl border p-2.5 text-center", config.color)}
    >
      <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      <span className="mt-1 flex items-center gap-1 text-xs font-semibold">
        <Icon className="size-3.5" aria-hidden="true" /> {config.text}
      </span>
    </div>
  );
}

export function ReportStep({ report, onNext }: { report: Report; onNext: () => void }) {
  const b = band(report.readiness);
  const circumference = 2 * Math.PI * 54;

  return (
    <section className="panel p-5 sm:p-7">
      <header className="mb-5">
        <p className="eyebrow">Step 4 of 5</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <Gauge className="size-5 text-primary" aria-hidden="true" /> Your readiness score
          </h2>
          {report.aiScored ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> AI Evaluated with STAR Rubric
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground border border-border">
              <ShieldCheck className="size-3.5 text-primary" /> Built-in STAR Engine (Offline)
            </span>
          )}
        </div>
        {!report.aiScored && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary shrink-0" />
              Scored using the built-in STAR rubric. You can add a free Google Gemini API key to
              unlock live AI interview coaching.
            </span>
          </div>
        )}
      </header>

      {/* Main Readiness Gauge */}
      <div className="hero-glow flex flex-col items-center rounded-2xl border border-border p-6">
        <div className="relative size-40">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="10"
              className="stroke-secondary"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className="stroke-primary transition-all duration-1000"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - report.readiness / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-bold">{report.readiness}</span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">score</span>
          </div>
        </div>
        <p className={cn("mt-3 text-sm font-semibold", b.tone)}>{b.label}</p>

        {/* Executive Synthesis: Reasons Behind the Score (Page 4 requirement) */}
        <div className="mt-4 w-full max-w-xl rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center justify-center gap-1.5">
            <Sparkles className="size-3.5" /> Diagnostic Reasons Behind Your Score
          </p>
          <p className="mt-1.5 text-xs font-medium text-foreground leading-relaxed">
            {report.metrics.map((m) => m.reason).join(" · ")}
          </p>
        </div>
      </div>

      {/* Mathematical Breakdown Formula */}
      <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Info className="size-3.5" aria-hidden="true" /> Weighted Formula Calculation
        </p>
        <p className="mt-2 font-mono text-xs leading-relaxed text-foreground/90">
          {report.metrics.map((m) => `(${Math.round(m.weight * 100)}% × ${m.score})`).join(" + ")} ={" "}
          <span className="font-bold text-primary">{report.readiness}</span>
        </p>
      </div>

      {/* 4 Core Pillars Sub-metrics */}
      <div className="mt-5 space-y-4">
        {report.metrics.map((m) => (
          <div key={m.key} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">{m.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                weight {Math.round(m.weight * 100)}% ·{" "}
                <span className="font-display text-base font-bold text-foreground">{m.score}</span>
                /100
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  m.score >= 75 ? "bg-success" : m.score >= 55 ? "bg-warning" : "bg-destructive",
                )}
                style={{ width: `${m.score}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{m.reason}</p>
          </div>
        ))}
      </div>

      {/* Acoustic & Speech Pattern Diagnostics (Voice & Delivery deep dive) */}
      {/* Acoustic & Speech Pattern Diagnostics */}
      {report.acousticSummary && report.acousticSummary.hasAudio ? (
        <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-primary" aria-hidden="true" />
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Acoustic & Speech Pattern Diagnostics
                </h3>
                <p className="text-xs text-muted-foreground">
                  Measurable delivery cadence, verbal crutches, and pause distribution.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Mic className="size-3.5" /> Analyzed from {report.acousticSummary.audioCount} voice
              answer{report.acousticSummary.audioCount > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* Pacing Tempo */}
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Gauge className="size-3.5 text-primary" /> Spoken Pace
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-foreground">
                  {report.acousticSummary.avgWpm}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">WPM</span>
              </div>
              <span
                className={cn(
                  "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                  report.acousticSummary.wpmStatus === "ideal"
                    ? "bg-success/15 text-success"
                    : report.acousticSummary.wpmStatus === "hesitant"
                      ? "bg-warning/15 text-warning"
                      : "bg-destructive/15 text-destructive",
                )}
              >
                {report.acousticSummary.wpmStatus === "ideal"
                  ? "Target Tempo (120–150)"
                  : report.acousticSummary.wpmStatus === "hesitant"
                    ? "Hesitant (<120 WPM)"
                    : "Rushed (>150 WPM)"}
              </span>
            </div>

            {/* Filler Words */}
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mic className="size-3.5 text-primary" /> Verbal Fillers
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-foreground">
                  {report.acousticSummary.totalFillers}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">detected</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {report.acousticSummary.totalFillers === 0
                  ? "Flawless speech clarity!"
                  : report.acousticSummary.totalFillers <= 3
                    ? "Acceptable conversational frequency"
                    : "Excessive verbal crutches"}
              </p>
            </div>

            {/* Pauses & Time */}
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" /> Dead-Air Pauses
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-display text-2xl font-bold text-foreground">
                  {report.acousticSummary.totalPauses}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  &gt;2.5s silences
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {report.acousticSummary.totalSpeakingTimeSeconds}s total speaking time
              </p>
            </div>
          </div>

          {/* Filler Word Specific Breakdown */}
          {Object.keys(report.acousticSummary.fillerBreakdown).length > 0 && (
            <div className="rounded-xl bg-card p-3 border border-border text-xs">
              <span className="font-semibold text-foreground mr-2">Detected Filler Words:</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(report.acousticSummary.fillerBreakdown).map(([word, count]) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-medium text-foreground"
                  >
                    "{word}": <strong className="text-warning">{count}x</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-secondary/20 p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-muted-foreground" aria-hidden="true" />
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Acoustic & Speech Pattern Diagnostics
                </h3>
                <p className="text-xs text-muted-foreground">
                  Delivery cadence, verbal crutches, and pause distribution.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Keyboard className="size-3.5 text-primary" /> Text-Mode Session (
              {report.acousticSummary?.textCount ?? 6} typed answers)
            </span>
          </div>
          <div className="rounded-xl border border-border bg-card/70 p-4 space-y-2">
            <p className="text-xs leading-relaxed text-muted-foreground">
              You completed this mock interview by typing your responses. Acoustic metrics—such as
              real-time <strong>speaking pace (WPM)</strong>,{" "}
              <strong>spoken filler words ("um", "uh", "actually")</strong>, and{" "}
              <strong>dead-air pauses (&gt;2.5s)</strong>—are captured when answering via
              microphone.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-foreground pt-1">
              <span className="grid size-5 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
                🎙️
              </span>
              <span>
                Tip: Click <strong>Speak</strong> in your next round to benchmark your verbal
                cadence and acoustic delivery!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STAR Rubric Behavioral Evaluation Card */}
      {report.star && report.star.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-primary" aria-hidden="true" />
            <h3 className="text-base font-bold">STAR Structure Analysis (Behavioral)</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Indian hiring panels look for structured answers: clear Situation, Task, Action, and
            measurable Result.
          </p>

          <div className="space-y-4">
            {report.star.map((s, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  Question: <span className="text-foreground">{s.prompt}</span>
                </p>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <StarBadge label="Situation" level={s.situation} />
                  <StarBadge label="Task" level={s.task} />
                  <StarBadge label="Action" level={s.action} />
                  <StarBadge label="Result" level={s.result} />
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
                  <div>
                    <span className="font-semibold text-foreground">Coaching Advice: </span>
                    <span className="text-muted-foreground">{s.advice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Per-Question Coaching Feedback */}
      {report.feedback && report.feedback.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 text-primary" aria-hidden="true" />
            <h3 className="text-base font-bold">Detailed Answer Strengths & Improvements</h3>
          </div>

          <div className="space-y-3">
            {report.feedback.map((f) => (
              <div key={f.questionId} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Question #{f.questionId} Feedback
                  </span>
                  <span className="rounded bg-secondary px-2 py-0.5 font-bold">{f.score}/100</span>
                </div>
                <div className="mt-3 space-y-2 text-xs leading-relaxed">
                  <div className="flex items-start gap-2 text-success">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      <strong className="text-foreground">Strength: </strong>
                      {f.strength}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-primary">
                    <Target className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      <strong className="text-foreground">To Improve: </strong>
                      {f.improvement}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ethical AI Safeguard Notice */}
      <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <ShieldCheck className="size-4 text-success" aria-hidden="true" />
          <span>Fairness & Preparation Safeguards</span>
        </div>
        <p className="mt-1 leading-relaxed">
          This readiness score is designed strictly for candidate practice and interview
          preparation. In accordance with ethical AI guidelines, protected attributes (gender,
          caste, religion, age, disability) are never evaluated. Voice metrics evaluate pace,
          pauses, and speech clarity only.
        </p>
      </div>

      <Button size="lg" onClick={onNext} className="mt-6 min-h-12 w-full text-base font-semibold">
        See my practice plan <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </section>
  );
}
