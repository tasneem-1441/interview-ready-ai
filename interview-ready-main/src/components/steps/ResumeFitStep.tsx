import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  FileText,
  Layers,
  Lightbulb,
  Loader2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { analyseResume, type ResumeAnalysis } from "@/lib/interview-data";
import { analyzeResumeSemantic, type SemanticResumeAnalysis } from "@/lib/ai.functions";
import type { TargetJob } from "@/lib/target-job";
import { ResumeParseError, extractResumeText } from "@/lib/resume-parse";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/interview-data";
import { DifficultySelector } from "@/components/DifficultySelector";

export function ResumeFitStep({
  job,
  analysis,
  resumeText,
  difficulty = "medium",
  onDifficultyChange,
  onAnalysed,
  onNext,
}: {
  job: TargetJob;
  analysis: ResumeAnalysis | null;
  resumeText?: string | null;
  difficulty?: Difficulty;
  onDifficultyChange?: (d: Difficulty) => void;
  onAnalysed: (a: ResumeAnalysis, resumeText: string) => void;
  onNext: () => void;
}) {
  const runSemanticAnalysis = useServerFn(analyzeResumeSemantic);
  const [currentText, setCurrentText] = useState(resumeText || "");
  const [semanticData, setSemanticData] = useState<SemanticResumeAnalysis | null>(null);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState<string | null>(null);

  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (name: string, text: string) => {
    setCurrentText(text);
    setSemanticData(null);
    onAnalysed(analyseResume(name, text, job.skills), text);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setParsing(true);
    try {
      const text = await extractResumeText(file);
      run(file.name, text);
    } catch (e) {
      setError(
        e instanceof ResumeParseError
          ? e.message
          : "Something went wrong while reading that file. Please try another one.",
      );
    } finally {
      setParsing(false);
    }
  };

  const handleSemanticAnalysis = async () => {
    const textToUse = currentText || resumeText || "";
    if (!textToUse || textToUse.trim().length < 60) return;
    setSemanticLoading(true);
    setSemanticError(null);
    try {
      const customKey =
        typeof window !== "undefined"
          ? localStorage.getItem("GEMINI_API_KEY") || undefined
          : undefined;

      const res = await runSemanticAnalysis({
        data: {
          role: job.title,
          jobDescription: job.description,
          jobSkills: job.skills,
          resumeText: textToUse.slice(0, 20000),
          apiKey: customKey,
        },
      });
      setSemanticData(res);
    } catch (err) {
      setSemanticError(
        err instanceof Error
          ? err.message
          : "Semantic analysis failed. You can add a free Gemini key in settings.",
      );
    } finally {
      setSemanticLoading(false);
    }
  };

  const depthColor = (depth: string) => {
    switch (depth) {
      case "expert":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "practical":
        return "bg-primary/15 text-primary border-primary/30";
      default:
        return "bg-secondary text-muted-foreground border-border";
    }
  };

  return (
    <section className="panel p-5 sm:p-7">
      <header className="mb-5">
        <p className="eyebrow">Step 2 of 5</p>
        <h2 className="mt-1 text-2xl font-bold">Resume fit check</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your resume is read here on your device and compared line by line against{" "}
          <span className="font-medium text-foreground">{job.title}</span>.
        </p>
      </header>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload your resume file"
        aria-busy={parsing}
        onClick={() => !parsing && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-secondary/40 hover:border-primary/60 hover:bg-secondary",
        )}
      >
        {parsing ? (
          <>
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Reading your resume…</p>
          </>
        ) : analysis ? (
          <>
            <FileText className="size-8 text-success" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">{analysis.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {analysis.wordCount} words read · tap to replace
            </p>
          </>
        ) : (
          <>
            <UploadCloud className="size-8 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Drag & drop your resume</p>
            <p className="text-xs text-muted-foreground">or tap to browse — PDF, DOCX, TXT</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="mt-3 text-center">
        <Button variant="link" size="sm" onClick={() => setPasteOpen((v) => !v)}>
          {pasteOpen ? "Hide text box" : "Or paste your resume text instead"}
        </Button>
      </div>

      {pasteOpen && (
        <div className="mt-2">
          <label htmlFor="resume-text" className="mb-2 block text-sm font-medium">
            Resume text
          </label>
          <Textarea
            id="resume-text"
            rows={8}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Paste the full text of your resume…"
            className="text-sm"
          />
          <Button
            className="mt-2 min-h-11 w-full"
            variant="secondary"
            disabled={pasted.trim().length < 120}
            onClick={() => {
              setError(null);
              run("Pasted resume text", pasted.replace(/\s+/g, " ").trim());
            }}
          >
            Analyse pasted text
          </Button>
          {pasted.trim().length > 0 && pasted.trim().length < 120 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {pasted.trim().length}/120 characters minimum.
            </p>
          )}
        </div>
      )}

      {analysis && (
        <>
          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">Resume–job fit</span>
              <span className="font-display text-2xl font-bold text-gradient">
                {analysis.fitScore}%
              </span>
            </div>
            <Progress value={analysis.fitScore} className="mt-2 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {analysis.matched.length} of {analysis.matched.length + analysis.gaps.length} required
              skills evidenced in your resume.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-success/30 bg-success/5 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-success">
                <CheckCircle2 className="size-4" aria-hidden="true" /> Matched (
                {analysis.matched.length})
              </h3>
              <ul className="mt-3 space-y-2.5">
                {analysis.matched.map((m) => (
                  <li key={m.skill}>
                    <p className="text-sm font-medium">{m.skill}</p>
                    <p className="text-xs text-muted-foreground">{m.note}</p>
                  </li>
                ))}
                {!analysis.matched.length && (
                  <li className="text-xs text-muted-foreground">
                    None of the required skills appear in your resume text yet.
                  </li>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertTriangle className="size-4" aria-hidden="true" /> Gaps ({analysis.gaps.length}
                )
              </h3>
              <ul className="mt-3 space-y-2.5">
                {analysis.gaps.map((g) => (
                  <li key={g.skill}>
                    <p className="text-sm font-medium">{g.skill}</p>
                    <p className="text-xs text-muted-foreground">{g.note}</p>
                  </li>
                ))}
                {!analysis.gaps.length && (
                  <li className="text-xs text-muted-foreground">
                    No blocking gaps — your resume covers every required skill.
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* AI Semantic NLP Depth Analysis Card */}
          <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Deep AI Semantic & Seniority Analysis (NLP)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Analyzes conceptual skill equivalence and production experience depth.
                  </p>
                </div>
              </div>

              {!semanticData && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={semanticLoading}
                  onClick={() => void handleSemanticAnalysis()}
                  className="min-h-9 text-xs font-semibold"
                >
                  {semanticLoading ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Evaluating semantic
                      depth…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 size-3.5 text-primary" /> Run AI Semantic Fit
                    </>
                  )}
                </Button>
              )}
            </div>

            {semanticError && (
              <p role="alert" className="mt-3 text-xs text-destructive">
                {semanticError}
              </p>
            )}

            {semanticData && (
              <div className="mt-4 space-y-4 border-t border-primary/20 pt-4 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 font-semibold text-primary">
                    <Award className="size-3.5" /> Assessed Seniority: {semanticData.seniorityFit}
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 font-semibold text-foreground border border-border">
                    <Layers className="size-3.5 text-primary" /> Semantic Fit Score:{" "}
                    {semanticData.semanticFitScore}/100
                  </div>
                </div>

                <p className="rounded-lg bg-card p-3 leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Experience Synthesis: </strong>
                  {semanticData.experienceSummary}
                </p>

                {semanticData.semanticMatches.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">
                      Recognized Semantic & Conceptual Skills ({semanticData.semanticMatches.length}
                      )
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {semanticData.semanticMatches.map((sm, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-card p-2.5 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{sm.skill}</span>
                            <span
                              className={cn(
                                "rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                depthColor(sm.depth),
                              )}
                            >
                              {sm.depth}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{sm.evidence}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {semanticData.criticalGaps.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-destructive mb-2">
                      Critical Impact Gaps Identified by NLP
                    </h4>
                    <ul className="space-y-1.5">
                      {semanticData.criticalGaps.map((cg, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2 text-destructive"
                        >
                          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                          <span>
                            <strong>{cg.skill}: </strong>
                            <span className="text-foreground">{cg.impact}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3">
                  <Lightbulb className="size-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <strong className="text-foreground">AI Positioning Recommendation: </strong>
                    <span className="text-muted-foreground">{semanticData.recommendation}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {onDifficultyChange && (
            <div className="mt-6 border-t border-border pt-6">
              <DifficultySelector value={difficulty} onChange={onDifficultyChange} />
            </div>
          )}

          <Button
            size="lg"
            onClick={onNext}
            className="mt-6 min-h-12 w-full text-base font-semibold"
          >
            Start the mock interview <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </>
      )}
    </section>
  );
}
