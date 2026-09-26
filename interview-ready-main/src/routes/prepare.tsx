import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, RefreshCw, Sparkles } from "lucide-react";
import { Stepper } from "@/components/Stepper";
import { TargetJobStep } from "@/components/steps/TargetJobStep";
import { ResumeFitStep } from "@/components/steps/ResumeFitStep";
import { ScoringPanel, SimulatorStep } from "@/components/steps/SimulatorStep";
import { ReportStep } from "@/components/steps/ReportStep";
import { PracticePlanStep } from "@/components/steps/PracticePlanStep";
import { buildReport, type AiScoreOverride, type AnswerRecord } from "@/lib/interview-data";
import { generatePersonalizedPracticeTasks, scoreAnswersWithAi } from "@/lib/ai.functions";
import { useSession } from "@/lib/session-store";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthModal } from "@/components/AuthModal";

const TITLE = "Prepare — NCS InterviewReady AI";
const DESCRIPTION =
  "Five guided steps: choose a target job, check your resume fit, run a mock interview, read your readiness score, and get a practice plan.";

export const Route = createFileRoute("/prepare")({
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
  component: PreparePage,
});

function PreparePage() {
  const { user, loading: authLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { ready, session, update, goToStep, recordAttempt, resetAll } = useSession();
  const scoreWithAi = useServerFn(scoreAnswersWithAi);
  const getTasks = useServerFn(generatePersonalizedPracticeTasks);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [pending, setPending] = useState<AnswerRecord[] | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      setAuthModalOpen(true);
    }
  }, [authLoading, user]);

  const { job, analysis, report, step, maxReached, attempt, askedPrompts, micConsent, difficulty } =
    session;

  const finish = useCallback(
    async (answers: AnswerRecord[]) => {
      setPending(answers);
      setScoring(true);
      setScoreError(null);

      let ai: AiScoreOverride | null = null;
      const customKey =
        typeof window !== "undefined"
          ? localStorage.getItem("GEMINI_API_KEY") || undefined
          : undefined;

      try {
        if (job) {
          const res = await scoreWithAi({
            data: {
              apiKey: customKey,
              role: job.title,
              description: job.description.slice(0, 6000),
              answers: answers.map((a) => ({
                questionId: a.questionId,
                cls: a.cls,
                prompt: (a.prompt ?? "").slice(0, 600),
                text: a.text.slice(0, 6000),
              })),
            },
          });
          ai = res;
        }
      } catch (err) {
        console.warn("AI scoring unavailable, using built-in STAR rubric engine:", err);
        ai = null;
      }

      const gaps = (analysis?.gaps ?? []).map((g) => g.skill);
      const built = buildReport(analysis?.fitScore ?? 0, answers, ai, gaps, job?.title);

      // Fetch dynamic personalized practice tasks for weakest area
      const weakest = [...built.metrics].sort((a, b) => a.score - b.score)[0];
      if (job && weakest) {
        try {
          const wpmList = answers.filter((a) => a.wordsPerMinute > 0).map((a) => a.wordsPerMinute);
          const avgWpm = wpmList.length
            ? Math.round(wpmList.reduce((a, b) => a + b, 0) / wpmList.length)
            : 0;
          const fillerWords = answers.reduce((n, a) => n + a.fillerWords, 0);
          const longPauses = answers.reduce((n, a) => n + a.longPauses, 0);

          const starDeficits = (built.star ?? [])
            .filter((s) => s.result === "missing" || s.result === "weak" || s.action === "weak")
            .map(
              (s) =>
                `"${s.prompt.slice(0, 40)}...": Result=${s.result}, Action=${s.action} (${s.advice})`,
            );

          const shortAnswers = answers
            .filter((a) => a.text.trim().split(/\s+/).filter(Boolean).length < 45)
            .map(
              (a) =>
                `Q: "${(a.prompt ?? "").slice(0, 40)}..." had only ${a.text.trim().split(/\s+/).filter(Boolean).length} words`,
            );

          const taskRes = await getTasks({
            data: {
              apiKey: customKey,
              role: job.title,
              weakestKey: weakest.key,
              weakestLabel: weakest.label,
              score: weakest.score,
              gaps,
              reason: weakest.reason,
              avgWpm,
              fillerWords,
              longPauses,
              starDeficits,
              shortAnswers,
            },
          });
          if (taskRes?.tasks && taskRes.tasks.length > 0) {
            built.personalizedTasks = taskRes.tasks;
          }
        } catch {
          // Keep local fallback tasks if task generation fails
        }
      }

      update({ report: built, answers, step: 3, maxReached: Math.max(maxReached, 3) });
      if (job) {
        recordAttempt({
          id: `${job.title}-${attempt}-${Date.now()}`,
          at: Date.now(),
          jobTitle: job.title,
          org: job.org,
          readiness: built.readiness,
          metrics: built.metrics.map((m) => ({ key: m.key, label: m.label, score: m.score })),
          questionsAnswered: answers.length,
        });
      }
      setScoring(false);
      setPending(null);
    },
    [analysis, attempt, getTasks, job, maxReached, recordAttempt, scoreWithAi, update],
  );

  const scoreWithoutAi = useCallback(() => {
    if (!pending) return;
    const gaps = (analysis?.gaps ?? []).map((g) => g.skill);
    const built = buildReport(analysis?.fitScore ?? 0, pending, null, gaps, job?.title);
    update({ report: built, answers: pending, step: 3, maxReached: Math.max(maxReached, 3) });
    if (job) {
      recordAttempt({
        id: `${job.title}-${attempt}-${Date.now()}`,
        at: Date.now(),
        jobTitle: job.title,
        org: job.org,
        readiness: built.readiness,
        metrics: built.metrics.map((m) => ({ key: m.key, label: m.label, score: m.score })),
        questionsAnswered: pending.length,
      });
    }
    setScoring(false);
    setScoreError(null);
    setPending(null);
  }, [analysis, attempt, job, maxReached, pending, recordAttempt, update]);

  if (authLoading || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  // MANDATORY AUTH GUARD: Unauthenticated users cannot access preparation workflow
  if (!user) {
    return (
      <div className="panel hero-glow mx-auto max-w-lg p-6 sm:p-8 text-center space-y-5 mt-4">
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="size-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Sign In Required</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You must be logged in to access the NCS InterviewReady AI preparation simulator, analyze
            your resume fit, and save your practice scores to MongoDB.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setAuthModalOpen(true)}
          className="w-full min-h-12 text-base font-semibold"
        >
          Sign In or Create Account
        </Button>
      </div>
    );
  }

  const safeStep =
    step >= 1 && !job ? 0 : step >= 2 && !analysis ? 1 : step >= 3 && !report ? 2 : step;

  return (
    <div className="space-y-5">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">Preparation workflow</h1>
          <p className="truncate text-sm text-muted-foreground">
            {job
              ? `${job.title} · ${job.org} · attempt ${attempt}`
              : "Start by choosing a target job"}
          </p>
        </div>
        {maxReached > 0 && (
          <Button variant="ghost" size="sm" onClick={resetAll} className="min-h-11 shrink-0">
            <RefreshCw className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Start over</span>
            <span className="sr-only sm:hidden">Start over</span>
          </Button>
        )}
      </header>

      <Stepper current={safeStep} maxReached={maxReached} onSelect={(i) => update({ step: i })} />

      {safeStep === 0 && (
        <TargetJobStep
          initial={job}
          onNext={(j) => {
            update({
              job: j,
              analysis: null,
              resumeText: null,
              report: null,
              answers: null,
              askedPrompts: [],
            });
            goToStep(1);
          }}
        />
      )}

      {safeStep === 1 && job && (
        <ResumeFitStep
          job={job}
          analysis={analysis}
          resumeText={session.resumeText}
          difficulty={difficulty}
          onDifficultyChange={(d) => update({ difficulty: d })}
          onAnalysed={(a, text) =>
            update({ analysis: a, resumeText: text, resumeName: a.fileName })
          }
          onNext={() => goToStep(2)}
        />
      )}

      {safeStep === 2 &&
        job &&
        (scoring || scoreError ? (
          <ScoringPanel
            error={scoreError}
            onRetry={() => pending && void finish(pending)}
            onSkip={scoreWithoutAi}
          />
        ) : (
          <SimulatorStep
            key={`${attempt}-${difficulty}`}
            job={job}
            gaps={(analysis?.gaps ?? []).map((g) => g.skill)}
            attempt={attempt}
            avoid={askedPrompts}
            difficulty={difficulty}
            onDifficultyChange={(d) => update({ difficulty: d })}
            micConsent={micConsent}
            onGrantMicConsent={() => update({ micConsent: true })}
            onQuestionsAsked={(prompts) =>
              update({ askedPrompts: [...askedPrompts, ...prompts].slice(-60) })
            }
            onComplete={(answers) => void finish(answers)}
          />
        ))}

      {safeStep === 3 && report && <ReportStep report={report} onNext={() => goToStep(4)} />}

      {safeStep === 4 && report && (
        <PracticePlanStep
          report={report}
          onRetest={() =>
            update({
              attempt: attempt + 1,
              report: null,
              answers: null,
              step: 2,
              maxReached: 2,
            })
          }
        />
      )}
    </div>
  );
}
