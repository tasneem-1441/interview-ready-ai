import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardCheck,
  FileSearch,
  Gauge,
  LineChart,
  Mic,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useSession } from "@/lib/session-store";
import { STEP_LABELS } from "@/components/Stepper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const TITLE = "NCS InterviewReady AI — Job Fit, Mock Interview & Readiness Score";
const DESCRIPTION =
  "Pick an NCS vacancy, check your real resume against it, run a typed or spoken mock interview, and get a weighted readiness score with a targeted practice plan.";

export const Route = createFileRoute("/")({
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
  component: Overview,
});

const FLOW = [
  { icon: Target, title: "Target job", text: "Choose an NCS vacancy or paste any job ad." },
  {
    icon: FileSearch,
    title: "Resume fit",
    text: "Your PDF or DOCX is read on this device and matched skill by skill.",
  },
  {
    icon: Mic,
    title: "Mock interview",
    text: "Six technical, HR and behavioural questions — typed or spoken.",
  },
  {
    icon: Gauge,
    title: "Readiness",
    text: "A weighted score across fit, answers, delivery and soft skills.",
  },
  {
    icon: ClipboardCheck,
    title: "Practice plan",
    text: "Timed tasks aimed at your weakest area, then retest.",
  },
];

function Overview() {
  const { ready, session, attempts } = useSession();
  const last = attempts[attempts.length - 1];
  const inProgress = ready && session.job !== null && session.maxReached < 4;

  return (
    <div className="space-y-8">
      <section className="hero-glow overflow-hidden rounded-3xl border border-border p-6 sm:p-10">
        <p className="eyebrow">National Career Service</p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl">
          Walk into your next interview <span className="text-gradient">already prepared</span>.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {DESCRIPTION}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-h-12 text-base font-semibold">
            <Link to="/prepare">
              {inProgress ? "Resume where you left off" : "Start preparing"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          {attempts.length > 0 && (
            <Button asChild size="lg" variant="outline" className="min-h-12 text-base">
              <Link to="/progress">
                <LineChart className="size-4" aria-hidden="true" /> View progress
              </Link>
            </Button>
          )}
        </div>

        {!ready ? (
          <Skeleton className="mt-6 h-16 w-full max-w-md rounded-xl" />
        ) : inProgress ? (
          <div className="mt-6 max-w-md rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              In progress
            </p>
            <p className="mt-1 text-sm font-medium">
              {session.job?.title} · next up: {STEP_LABELS[session.step]}
            </p>
          </div>
        ) : last ? (
          <div className="mt-6 max-w-md rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Last attempt
            </p>
            <p className="mt-1 text-sm font-medium">
              {last.jobTitle} · readiness {last.readiness}/100
            </p>
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="text-xl font-bold">How it works</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLOW.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="panel p-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <p className="min-w-0 truncate text-sm font-semibold">
                  {i + 1}. {title}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel p-6 space-y-3 border-l-4 border-l-primary">
        <div className="flex items-center gap-2 font-bold text-foreground">
          <ShieldCheck className="size-5 text-success" aria-hidden="true" />
          <span>Ethical AI & Candidate Safeguards (NCS Standards)</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 text-xs leading-relaxed text-muted-foreground">
          <div className="rounded-lg bg-secondary/50 p-3">
            <strong className="block font-semibold text-foreground mb-1">Preparation Only</strong>
            Evaluations are designed to help you prepare and build confidence. It is never used for
            automated hiring or screening decisions.
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <strong className="block font-semibold text-foreground mb-1">
              Fairness & Non-Discrimination
            </strong>
            Protected attributes including gender, caste, religion, age, and disability are strictly
            excluded from all scoring algorithms.
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <strong className="block font-semibold text-foreground mb-1">
              Measurable Speech Patterns Only
            </strong>
            Voice feedback evaluates objective pacing, pauses, and filler words—never subjective
            emotion or unscientific personality profiling.
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <strong className="block font-semibold text-foreground mb-1">
              Full Candidate Data Sovereignty
            </strong>
            Explicit microphone consent is requested, and you have complete control to wipe all
            practice data and attempts at any time.
          </div>
        </div>
      </section>
    </div>
  );
}
