import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Keyboard,
  Loader2,
  Mic,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Square,
  Terminal,
  Volume2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  buildQuestions,
  scoreAnswer,
  toQuestions,
  type AnswerRecord,
  type Question,
  type QuestionClass,
  type Difficulty,
} from "@/lib/interview-data";
import { generateFollowUp, generateQuestions } from "@/lib/ai.functions";
import { transcribeAudio } from "@/lib/audio-transcribe.functions";
import type { TargetJob } from "@/lib/target-job";
import { useSpeech } from "@/lib/use-speech";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DifficultyBadge } from "@/components/DifficultySelector";

const CLASSES: QuestionClass[] = ["Technical", "HR", "Behavioral"];

export function SimulatorStep({
  job,
  gaps,
  attempt,
  avoid,
  difficulty = "medium",
  onDifficultyChange,
  micConsent,
  onGrantMicConsent,
  onQuestionsAsked,
  onComplete,
}: {
  job: TargetJob;
  gaps: string[];
  attempt: number;
  avoid: string[];
  difficulty?: Difficulty;
  onDifficultyChange?: (d: Difficulty) => void;
  micConsent: boolean;
  onGrantMicConsent: () => void;
  onQuestionsAsked: (prompts: string[]) => void;
  onComplete: (answers: AnswerRecord[]) => void;
}) {
  const generate = useServerFn(generateQuestions);
  const askFollowUp = useServerFn(generateFollowUp);
  const askTranscribe = useServerFn(transcribeAudio);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [source, setSource] = useState<"ai" | "fallback">("ai");
  const [genError, setGenError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"text" | "audio">("text");
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false);
  const [transcribingAudio, setTranscribingAudio] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const logRef = useRef<HTMLDivElement>(null);
  const speech = useSpeech();

  const load = useCallback(async () => {
    setLoading(true);
    setGenError(null);
    try {
      const customKey =
        typeof window !== "undefined"
          ? localStorage.getItem("GEMINI_API_KEY") || undefined
          : undefined;
      const res = await generate({
        data: {
          apiKey: customKey,
          role: job.title,
          org: job.org,
          description: job.description.slice(0, 6000),
          skills: job.skills.slice(0, 30),
          gaps: gaps.slice(0, 30),
          attempt,
          avoid: avoid.slice(-40),
          difficulty,
        },
      });
      const qs = toQuestions(res.questions);
      setQuestions(qs);
      setSource("ai");
      onQuestionsAsked(qs.map((q) => q.prompt));
    } catch (err) {
      const qs = buildQuestions(job.title, attempt, avoid, difficulty);
      setQuestions(qs);
      setSource("fallback");
      setGenError(err instanceof Error ? err.message : "Could not reach the AI coach.");
      onQuestionsAsked(qs.map((q) => q.prompt));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, difficulty, job.title]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [answers.length, index]);

  if (loading || !questions) {
    return (
      <section className="panel space-y-4 p-5 sm:p-7" aria-busy="true">
        <p className="eyebrow">Step 3 of 5</p>
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="size-5 animate-pulse text-primary" aria-hidden="true" />
          Writing your interview
        </h2>
        <p className="text-sm text-muted-foreground">
          Preparing fresh questions for {job.title} from the job description
          {gaps.length ? " and your skill gaps" : ""}…
        </p>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </section>
    );
  }

  const question = questions[index]!;
  const spoken = `${speech.transcript} ${speech.interim}`.trim();
  const body = (mode === "audio" ? spoken : text).trim();

  const submit = async () => {
    if (!body) return;
    const dur = mode === "audio" ? Math.max(speech.seconds, 5) : 0;
    const stats = scoreAnswer(body, dur, mode);

    if (followUp) {
      const record: AnswerRecord = {
        questionId: question.id * 100,
        prompt: `Follow-up: ${followUp}`,
        cls: question.cls,
        mode,
        text: body,
        seconds: Math.round(dur),
        fillerWords: stats.fillerWords,
        fillerBreakdown: stats.fillerBreakdown,
        longPauses: mode === "audio" ? speech.pauses : 0,
        wordsPerMinute: stats.wordsPerMinute,
        audioUrl:
          mode === "audio" && speech.audioBlob ? URL.createObjectURL(speech.audioBlob) : undefined,
      };
      const next = [...answers, record];
      setAnswers(next);
      setText("");
      speech.reset();
      setFollowUp(null);
      if (index + 1 >= questions.length) onComplete(next);
      else setIndex(index + 1);
      return;
    }

    const record: AnswerRecord = {
      questionId: question.id,
      prompt: question.prompt,
      cls: question.cls,
      mode,
      text: body,
      seconds: Math.round(dur),
      fillerWords: stats.fillerWords,
      fillerBreakdown: stats.fillerBreakdown,
      longPauses: mode === "audio" ? speech.pauses : 0,
      wordsPerMinute: stats.wordsPerMinute,
      audioUrl:
        mode === "audio" && speech.audioBlob ? URL.createObjectURL(speech.audioBlob) : undefined,
    };
    const next = [...answers, record];
    setAnswers(next);
    setText("");
    speech.reset();

    const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
    if (question.cls !== "HR" && wordCount >= 6) {
      setGeneratingFollowUp(true);
      const customKey =
        typeof window !== "undefined"
          ? localStorage.getItem("GEMINI_API_KEY") || undefined
          : undefined;
      try {
        const res = await askFollowUp({
          data: {
            apiKey: customKey,
            role: job.title,
            question: question.prompt,
            cls: question.cls,
            answer: body,
          },
        });
        if (res.shouldAsk && res.followUpPrompt) {
          setFollowUp(res.followUpPrompt);
          setGeneratingFollowUp(false);
          return;
        }
      } catch {
        // Continue if follow up generation fails
      } finally {
        setGeneratingFollowUp(false);
      }
    }

    if (index + 1 >= questions.length) onComplete(next);
    else setIndex(index + 1);
  };

  const skipFollowUp = () => {
    setFollowUp(null);
    setText("");
    speech.reset();
    if (index + 1 >= questions.length) onComplete(answers);
    else setIndex(index + 1);
  };

  const handleTranscribeAudio = async () => {
    if (!speech.audioBlob) return;
    setTranscribingAudio(true);
    setTranscribeError(null);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(",")[1];
          if (base64) resolve(base64);
          else reject(new Error("Failed to encode audio"));
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(speech.audioBlob);
      const audioBase64 = await base64Promise;

      const customKey =
        typeof window !== "undefined"
          ? localStorage.getItem("GEMINI_API_KEY") || undefined
          : undefined;

      const res = await askTranscribe({
        data: {
          audioBase64,
          mimeType: speech.audioBlob.type || "audio/webm",
          apiKey: customKey,
        },
      });

      if (res.transcript) {
        speech.setTranscript(res.transcript);
      } else {
        setTranscribeError("Audio was received, but no words were recognized.");
      }
    } catch (err) {
      setTranscribeError(
        err instanceof Error ? err.message : "AI transcription failed. Please type or re-record.",
      );
    } finally {
      setTranscribingAudio(false);
    }
  };

  const progressFor = (cls: QuestionClass) => {
    const total = questions.filter((q) => q.cls === cls).length;
    const done = answers.filter((a) => a.cls === cls).length;
    return { done, total, pct: total ? (done / total) * 100 : 0 };
  };

  const startRecording = () => {
    if (!micConsent) {
      onGrantMicConsent();
    }
    speech.start();
  };

  return (
    <section className="panel overflow-hidden">
      <header className="border-b border-border px-5 py-4 sm:px-7">
        <p className="eyebrow">Step 3 of 5</p>
        <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold">
          <Terminal className="size-5 text-primary" aria-hidden="true" /> Mock interview
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {job.title} — question {index + 1} of {questions.length}. Answer by typing or speaking.
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <DifficultyBadge difficulty={difficulty} />
          {source === "ai" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" /> Questions written for this job
              (round {attempt})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 font-medium text-foreground">
              <AlertTriangle className="size-3.5 text-warning" aria-hidden="true" /> Offline
              question set
            </span>
          )}

          {answers.length === 0 && onDifficultyChange && (
            <div className="inline-flex items-center rounded-full border border-border bg-secondary/50 p-0.5 text-[11px] font-medium">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDifficultyChange(d)}
                  className={cn(
                    "rounded-full px-2 py-0.5 capitalize transition-colors",
                    difficulty === d
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {answers.length === 0 && (
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-medium hover:bg-secondary"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" /> New questions
            </button>
          )}
        </div>
        {genError && (
          <p role="alert" className="mt-2 text-xs text-muted-foreground">
            {genError} Using the built-in question bank instead — your score still works.
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {CLASSES.map((cls) => {
            const p = progressFor(cls);
            return (
              <div key={cls} className="rounded-lg border border-border bg-secondary/40 p-2.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>{cls}</span>
                  <span className="text-muted-foreground">
                    {p.done}/{p.total}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </header>

      <div
        ref={logRef}
        aria-live="polite"
        className="max-h-72 space-y-4 overflow-y-auto bg-secondary/30 px-5 py-4 text-sm leading-relaxed sm:px-7"
      >
        {answers.map((a) => (
          <div key={a.questionId} className="space-y-1.5">
            <p className="font-medium text-foreground">{a.prompt}</p>
            <p className="rounded-xl bg-card p-3 text-muted-foreground shadow-sm">
              <span className="mr-2 rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold uppercase">
                {a.mode}
              </span>
              {a.text}
            </p>
          </div>
        ))}
        {followUp ? (
          <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/10 p-3.5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                Follow-up Question
              </span>
              <span className="text-xs text-muted-foreground">Contextual probe</span>
            </div>
            <p className="font-semibold text-foreground">{followUp}</p>
            <p className="text-xs text-muted-foreground">
              Provide concrete technical details or explain how you arrived at that decision.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="font-semibold text-primary">{question.prompt}</p>
            <p className="text-xs text-muted-foreground">
              {question.cls} question · aim for 90–140 words with a concrete result.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-4 sm:px-7">
        <div
          role="tablist"
          aria-label="Answer mode"
          className="mb-3 inline-flex rounded-lg border border-border bg-secondary/60 p-1"
        >
          {(["text", "audio"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors",
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {m === "text" ? (
                <>
                  <Keyboard className="size-3.5" aria-hidden="true" /> Type
                </>
              ) : (
                <>
                  <Mic className="size-3.5" aria-hidden="true" /> Speak
                </>
              )}
            </button>
          ))}
        </div>

        {mode === "text" ? (
          <>
            <label htmlFor="answer" className="sr-only">
              Your answer
            </label>
            <Textarea
              id="answer"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Type your answer…"
              className="text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {text.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </>
        ) : (
          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-center">
            {!speech.supported && (
              <p className="mb-3 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-left text-xs text-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                This browser can't capture speech. Chrome or Edge support it — otherwise switch to
                the Type tab.
              </p>
            )}
            {!micConsent && speech.supported && (
              <p className="mb-3 rounded-lg border border-border bg-card p-3 text-left text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Before you record: </span>
                your voice is turned into text inside this browser only. No audio file is saved or
                uploaded, and you can delete everything at any time from the Progress page.
              </p>
            )}
            <div className="flex items-end justify-center gap-1.5" aria-hidden="true">
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "w-1 rounded-full bg-primary/70 transition-all",
                    speech.recording ? "animate-pulse" : "opacity-30",
                  )}
                  style={{
                    height: speech.recording ? `${8 + ((i * 7) % 26)}px` : "8px",
                    animationDelay: `${i * 40}ms`,
                  }}
                />
              ))}
            </div>
            <p className="mt-3 font-mono text-sm">
              {String(Math.floor(speech.seconds / 60)).padStart(2, "0")}:
              {String(speech.seconds % 60).padStart(2, "0")}
            </p>
            <Button
              variant={speech.recording ? "destructive" : "secondary"}
              className="mt-3 min-h-11"
              disabled={!speech.supported}
              onClick={() => (speech.recording ? speech.stop() : startRecording())}
            >
              {speech.recording ? (
                <>
                  <Square className="size-4" aria-hidden="true" /> Stop recording
                </>
              ) : (
                <>
                  <Mic className="size-4" aria-hidden="true" />{" "}
                  {micConsent ? "Record answer" : "Agree & record answer"}
                </>
              )}
            </Button>

            {speech.audioUrl && !speech.recording && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speech.reset()}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="mr-1.5 size-3.5" /> Discard & re-record
                </Button>
              </div>
            )}

            {speech.error && (
              <p role="alert" className="mt-3 text-xs text-destructive">
                {speech.error}
              </p>
            )}

            {/* Audio playback preview */}
            {speech.audioUrl && !speech.recording && (
              <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Volume2 className="size-4 text-primary" /> Audio Preview (Review Recording)
                  </span>
                  <span className="text-muted-foreground">{speech.seconds}s audio</span>
                </div>
                <audio controls src={speech.audioUrl} className="mt-2 h-9 w-full" />
              </div>
            )}

            {spoken && (
              <p className="mt-3 rounded-lg bg-card p-3 text-left text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Live transcript: </span>
                {spoken}
              </p>
            )}

            {!spoken && speech.audioBlob && !speech.recording && (
              <div className="mt-3 rounded-xl border border-border bg-card p-3 text-left">
                <p className="text-xs text-muted-foreground">
                  Browser speech recognition did not detect words in real time. You can transcribe
                  this recording directly using AI.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={transcribingAudio}
                  onClick={() => void handleTranscribeAudio()}
                  className="mt-2 w-full min-h-9 text-xs font-semibold"
                >
                  {transcribingAudio ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Transcribing recording…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 size-3.5 text-primary" /> Transcribe recording
                      with AI STT
                    </>
                  )}
                </Button>
                {transcribeError && (
                  <p className="mt-1.5 text-xs text-destructive">{transcribeError}</p>
                )}
              </div>
            )}

            {!spoken &&
              !speech.audioBlob &&
              !speech.recording &&
              !speech.error &&
              speech.supported && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Nothing recorded yet — press record and answer out loud.
                </p>
              )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {followUp && (
            <Button
              type="button"
              variant="outline"
              onClick={skipFollowUp}
              className="min-h-12 flex-1"
            >
              Skip follow-up & continue
            </Button>
          )}
          <Button
            size="lg"
            disabled={!body || speech.recording || generatingFollowUp}
            onClick={() => void submit()}
            className={cn("min-h-12 text-base font-semibold", followUp ? "flex-1" : "w-full")}
          >
            {generatingFollowUp ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Considering follow-up…
              </>
            ) : followUp ? (
              <>
                Submit follow-up <ArrowRight className="size-4" aria-hidden="true" />
              </>
            ) : index + 1 >= questions.length ? (
              <>
                Finish & score me <ArrowRight className="size-4" aria-hidden="true" />
              </>
            ) : (
              <>
                Submit answer <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function ScoringPanel({
  error,
  onRetry,
  onSkip,
}: {
  error: string | null;
  onRetry: () => void;
  onSkip?: () => void;
}) {
  return (
    <section className="panel p-6 text-center sm:p-8">
      {error ? (
        <>
          <AlertTriangle className="mx-auto size-6 text-warning" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold">Couldn't reach the AI coach</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={onRetry} className="min-h-11">
              <RefreshCw className="size-4" aria-hidden="true" /> Try scoring again
            </Button>
            {onSkip && (
              <Button variant="outline" onClick={onSkip} className="min-h-11">
                Score without the AI coach
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <Loader2 className="mx-auto size-6 animate-spin text-primary" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold">Scoring your answers</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The AI coach is reading every answer against the STAR rubric. This takes a few seconds.
          </p>
        </>
      )}
    </section>
  );
}
