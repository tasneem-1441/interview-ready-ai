import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AiGatewayError, callGatewayJson } from "./ai.server";

/* ------------------------------------------------------------------ */
/* Question generation                                                 */
/* ------------------------------------------------------------------ */

const QuestionsInput = z.object({
  role: z.string().min(1).max(200),
  org: z.string().max(200).default(""),
  description: z.string().max(6000).default(""),
  skills: z.array(z.string().max(80)).max(30).default([]),
  gaps: z.array(z.string().max(80)).max(30).default([]),
  attempt: z.number().int().min(1).max(99).default(1),
  avoid: z.array(z.string().max(400)).max(40).default([]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  apiKey: z.string().max(300).optional(),
});

export type GeneratedQuestion = { cls: "Technical" | "HR" | "Behavioral"; prompt: string };

const questionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["cls", "prompt"],
        properties: {
          cls: { type: "string", enum: ["Technical", "HR", "Behavioral"] },
          prompt: { type: "string" },
        },
      },
    },
  },
} as const;

export const generateQuestions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => QuestionsInput.parse(input))
  .handler(async ({ data }) => {
    try {
      const difficultyGuide = {
        easy: "Difficulty Tier: EASY. Focus on core foundational concepts, standard textbook knowledge, entry-level definitions, straightforward HR motivations/strengths, and accessible team collaboration behavioral prompts.",
        medium:
          "Difficulty Tier: MEDIUM. Focus on real-world application scenarios, practical tooling named in the job, engineering trade-offs between speed and quality, team disagreements under deadlines, and situational decision-making.",
        hard: "Difficulty Tier: HARD. Probe complex edge cases, distributed scale and system design under concurrency, fault tolerance, high-stakes stakeholder conflicts, production triage, and rigorous technical trade-offs. Challenge the candidate deeply.",
      }[data.difficulty || "medium"];

      const result = await callGatewayJson<{ questions: GeneratedQuestion[] }>(
        [
          {
            role: "system",
            content:
              "You are an experienced Indian hiring panel member preparing a mock interview. " +
              "Write exactly 6 questions: 2 Technical, 2 HR, 2 Behavioral, in that order. " +
              "Questions must be specific to the role and job description, never generic filler. " +
              `${difficultyGuide} ` +
              "If the candidate has skill gaps, probe at least one of them fairly. " +
              "Each question is one or two sentences, under 45 words, conversational, no numbering.",
          },
          {
            role: "user",
            content: [
              `Role: ${data.role}`,
              `Selected Interview Difficulty: ${(data.difficulty || "medium").toUpperCase()}`,
              data.org ? `Organisation: ${data.org}` : "",
              data.skills.length ? `Required skills: ${data.skills.join(", ")}` : "",
              data.gaps.length ? `Candidate skill gaps: ${data.gaps.join(", ")}` : "",
              data.description ? `Job description:\n${data.description}` : "",
              `This is practice round ${data.attempt}. Vary the angle from earlier rounds.`,
              data.avoid.length
                ? `Do NOT repeat or paraphrase these previously asked questions:\n- ${data.avoid.join("\n- ")}`
                : "",
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
        {
          name: "interview_questions",
          schema: questionSchema as unknown as Record<string, unknown>,
        },
        data.apiKey,
      );

      const clean = result.questions
        .filter((q) => q.prompt && q.prompt.trim().length > 10)
        .slice(0, 6);
      if (clean.length < 6) throw new AiGatewayError(502, "Incomplete question set.");
      return { questions: clean };
    } catch (err) {
      throw toClientError(err);
    }
  });

/* ------------------------------------------------------------------ */
/* Answer scoring                                                      */
/* ------------------------------------------------------------------ */

const ScoreInput = z.object({
  role: z.string().min(1).max(200),
  description: z.string().max(6000).default(""),
  apiKey: z.string().max(300).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.number().int(),
        cls: z.string().max(20),
        prompt: z.string().max(600),
        text: z.string().max(6000),
      }),
    )
    .min(1)
    .max(12),
});

export type AiAnswerFeedback = {
  questionId: number;
  score: number;
  strength: string;
  improvement: string;
};

export type AiStarBreakdown = {
  questionId: number;
  prompt: string;
  situation: "clear" | "weak" | "missing";
  task: "clear" | "weak" | "missing";
  action: "clear" | "weak" | "missing";
  result: "clear" | "weak" | "missing";
  advice: string;
};

export type AiScoring = {
  answerQuality: number;
  softSkills: number;
  answerReason: string;
  softReason: string;
  perAnswer: AiAnswerFeedback[];
  star: AiStarBreakdown[];
};

const starLevel = { type: "string", enum: ["clear", "weak", "missing"] } as const;

const scoringSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answerQuality", "softSkills", "answerReason", "softReason", "perAnswer", "star"],
  properties: {
    answerQuality: { type: "integer", minimum: 0, maximum: 100 },
    softSkills: { type: "integer", minimum: 0, maximum: 100 },
    answerReason: { type: "string" },
    softReason: { type: "string" },
    perAnswer: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["questionId", "score", "strength", "improvement"],
        properties: {
          questionId: { type: "integer" },
          score: { type: "integer", minimum: 0, maximum: 100 },
          strength: { type: "string" },
          improvement: { type: "string" },
        },
      },
    },
    star: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["questionId", "prompt", "situation", "task", "action", "result", "advice"],
        properties: {
          questionId: { type: "integer" },
          prompt: { type: "string" },
          situation: starLevel,
          task: starLevel,
          action: starLevel,
          result: starLevel,
          advice: { type: "string" },
        },
      },
    },
  },
} as const;

export const scoreAnswersWithAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScoreInput.parse(input))
  .handler(async ({ data }): Promise<AiScoring> => {
    try {
      const result = await callGatewayJson<AiScoring>(
        [
          {
            role: "system",
            content:
              "You are a strict but fair interview coach scoring a candidate's mock interview answers. " +
              "Score each answer 0-100 using the STAR rubric: is there a concrete Situation/Task, specific Actions " +
              "owned by the candidate, and a measurable Result? Reward specificity, role relevance and honesty; " +
              "penalise vagueness, buzzwords, missing outcomes and answers under 40 words. " +
              "answerQuality is the overall content score across all answers. " +
              "softSkills reflects communication, collaboration, ownership and self-awareness shown in the answers. " +
              "Reasons are one plain sentence each. strength and improvement are one short sentence each, addressed to the candidate as 'you'. " +
              "In 'star', add ONE entry for every Behavioral question only (skip Technical and HR). " +
              "For each, mark Situation, Task, Action and Result as 'clear' when the candidate stated it concretely, " +
              "'weak' when only hinted at or vague, and 'missing' when absent. Copy the question text into 'prompt'. " +
              "'advice' is one sentence telling the candidate how to restructure that specific story so the missing or weak parts land. " +
              "If there are no Behavioral questions, return an empty star array.",
          },
          {
            role: "user",
            content: [
              `Role: ${data.role}`,
              data.description ? `Job description:\n${data.description}` : "",
              "Answers:",
              ...data.answers.map(
                (a) =>
                  `[id ${a.questionId}] (${a.cls}) Q: ${a.prompt}\nA: ${a.text || "(no answer given)"}`,
              ),
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
        { name: "answer_scoring", schema: scoringSchema as unknown as Record<string, unknown> },
        data.apiKey,
      );
      return result;
    } catch (err) {
      throw toClientError(err);
    }
  });

/* ------------------------------------------------------------------ */
/* Follow-up question generation                                       */
/* ------------------------------------------------------------------ */

const FollowUpInput = z.object({
  role: z.string().min(1).max(200),
  question: z.string().min(1).max(600),
  cls: z.string().max(30),
  answer: z.string().max(6000),
  apiKey: z.string().max(300).optional(),
});

export type GeneratedFollowUp = {
  shouldAsk: boolean;
  followUpPrompt: string;
};

const followUpSchema = {
  type: "object",
  additionalProperties: false,
  required: ["shouldAsk", "followUpPrompt"],
  properties: {
    shouldAsk: { type: "boolean" },
    followUpPrompt: { type: "string" },
  },
} as const;

export const generateFollowUp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FollowUpInput.parse(input))
  .handler(async ({ data }): Promise<GeneratedFollowUp> => {
    try {
      const words = data.answer.trim().split(/\s+/).filter(Boolean);
      if (words.length < 8) {
        return {
          shouldAsk: true,
          followUpPrompt: "Could you expand on that with a specific example or tool you utilized?",
        };
      }

      const result = await callGatewayJson<GeneratedFollowUp>(
        [
          {
            role: "system",
            content:
              "You are an active interviewer conducting a realistic mock interview. " +
              "Based on the candidate's answer to the current question, decide if a short follow-up is warranted. " +
              "If the answer was good or touched on a project, ask one sharp, role-specific follow-up question (under 25 words) to probe deeper. " +
              "If the answer was completely comprehensive, set shouldAsk to false.",
          },
          {
            role: "user",
            content: `Role: ${data.role}\nQuestion (${data.cls}): ${data.question}\nCandidate Answer: ${data.answer}`,
          },
        ],
        {
          name: "follow_up_question",
          schema: followUpSchema as unknown as Record<string, unknown>,
        },
        data.apiKey,
      );
      return result;
    } catch {
      // Offline fallback: generate a relevant probe based on question class
      let prompt =
        "What was the measurable outcome of this action, and what would you do differently?";
      if (data.cls === "Technical") {
        prompt =
          "How did you test and verify that your implementation met latency and reliability requirements?";
      } else if (data.cls === "Behavioral") {
        prompt =
          "How did the other team members or stakeholders react, and how did you reach alignment?";
      }
      return {
        shouldAsk: true,
        followUpPrompt: prompt,
      };
    }
  });

/* ------------------------------------------------------------------ */
/* Dynamic practice plan generation                                   */
/* ------------------------------------------------------------------ */

const PracticePlanInput = z.object({
  role: z.string().min(1).max(200),
  weakestKey: z.string().max(50),
  weakestLabel: z.string().max(100),
  score: z.number().int().min(0).max(100),
  gaps: z.array(z.string().max(80)).max(20).default([]),
  reason: z.string().max(400).default(""),
  avgWpm: z.number().default(0),
  fillerWords: z.number().default(0),
  longPauses: z.number().default(0),
  starDeficits: z.array(z.string().max(300)).max(10).default([]),
  shortAnswers: z.array(z.string().max(300)).max(10).default([]),
  apiKey: z.string().max(300).optional(),
});

export type GeneratedPracticeTask = {
  title: string;
  detail: string;
  minutes: number;
  tag?: string;
};

const practicePlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["tasks"],
  properties: {
    tasks: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail", "minutes", "tag"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          minutes: { type: "integer", minimum: 5, maximum: 180 },
          tag: { type: "string" },
        },
      },
    },
  },
} as const;

export const generatePersonalizedPracticeTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PracticePlanInput.parse(input))
  .handler(async ({ data }): Promise<{ tasks: GeneratedPracticeTask[] }> => {
    try {
      const result = await callGatewayJson<{ tasks: GeneratedPracticeTask[] }>(
        [
          {
            role: "system",
            content:
              "You are a master interview and communication coach. " +
              "Generate 3 to 4 hyper-specific, non-repetitive practice tasks for a candidate preparing for an interview re-test. " +
              "Address the repetitive advice problem by anchoring EVERY task directly in the candidate's actual diagnostics: " +
              "1. Actual missing resume skills: assign a concrete proof-of-concept project. " +
              "2. Measured speech patterns: cite their exact filler word count, WPM calibration (target 120-150), or long pauses. " +
              "3. Specific STAR deficits: cite the exact behavioral question and guide how to quantify the Result or state personal Action. " +
              "4. Keep titles under 8 words, details under 32 words with clear instructions, realistic duration in minutes, and 'tag' as a short diagnostic badge (e.g. 'Skill Gap: Docker', 'Acoustics: 7 Fillers', 'Pacing: 95 WPM', 'STAR Deficit: Missing Result').",
          },
          {
            role: "user",
            content: [
              `Target Role: ${data.role}`,
              `Weakest Pillar: ${data.weakestLabel} (${data.score}/100)`,
              `Diagnostic Feedback: ${data.reason}`,
              data.gaps.length ? `Actual Missing Resume Skills: ${data.gaps.join(", ")}` : "",
              data.avgWpm > 0
                ? `Measured Speech Pace: ${data.avgWpm} WPM (Target: 120–150 WPM)`
                : "",
              data.fillerWords > 0 ? `Detected Filler Words: ${data.fillerWords} occurrences` : "",
              data.longPauses > 0
                ? `Detected Long Pauses (>2.5s): ${data.longPauses} occurrences`
                : "",
              data.starDeficits.length
                ? `Behavioral STAR Deficits Identified:\n- ${data.starDeficits.join("\n- ")}`
                : "",
              data.shortAnswers.length
                ? `Under-developed Answers (<45 words):\n- ${data.shortAnswers.join("\n- ")}`
                : "",
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
        {
          name: "practice_tasks",
          schema: practicePlanSchema as unknown as Record<string, unknown>,
        },
        data.apiKey,
      );
      return result;
    } catch {
      return { tasks: [] };
    }
  });

/* ------------------------------------------------------------------ */
/* Semantic Resume & Job Fit Analysis                                  */
/* ------------------------------------------------------------------ */

const SemanticResumeInput = z.object({
  role: z.string().min(1).max(200),
  jobDescription: z.string().max(8000).default(""),
  jobSkills: z.array(z.string().max(80)).max(30).default([]),
  resumeText: z.string().min(60).max(30000),
  apiKey: z.string().max(300).optional(),
});

export type SemanticMatch = {
  skill: string;
  evidence: string;
  depth: "foundational" | "practical" | "expert";
};

export type SemanticGap = {
  skill: string;
  impact: string;
};

export type SemanticResumeAnalysis = {
  semanticFitScore: number;
  seniorityFit: string;
  experienceSummary: string;
  semanticMatches: SemanticMatch[];
  criticalGaps: SemanticGap[];
  recommendation: string;
};

const semanticResumeSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "semanticFitScore",
    "seniorityFit",
    "experienceSummary",
    "semanticMatches",
    "criticalGaps",
    "recommendation",
  ],
  properties: {
    semanticFitScore: { type: "integer", minimum: 0, maximum: 100 },
    seniorityFit: { type: "string" },
    experienceSummary: { type: "string" },
    semanticMatches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skill", "evidence", "depth"],
        properties: {
          skill: { type: "string" },
          evidence: { type: "string" },
          depth: { type: "string", enum: ["foundational", "practical", "expert"] },
        },
      },
    },
    criticalGaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["skill", "impact"],
        properties: {
          skill: { type: "string" },
          impact: { type: "string" },
        },
      },
    },
    recommendation: { type: "string" },
  },
} as const;

export const analyzeResumeSemantic = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SemanticResumeInput.parse(input))
  .handler(async ({ data }): Promise<SemanticResumeAnalysis> => {
    try {
      const result = await callGatewayJson<SemanticResumeAnalysis>(
        [
          {
            role: "system",
            content:
              "You are an expert technical talent evaluator and NLP recruitment analyst for the National Career Service (NCS). " +
              "Perform a deep semantic evaluation of the candidate's resume against the target job description. " +
              "Go beyond keyword matching: recognize conceptual equivalence (e.g. Docker/containerization matches Kubernetes; AWS ECS/Cloud matches distributed deployment). " +
              "Evaluate the depth of experience: foundational (academic/tutorial), practical (shipped features in teams), or expert (architecture/optimization/lead). " +
              "semanticFitScore is an integer 0-100 reflecting genuine readiness for this job. " +
              "seniorityFit should be one of 'Junior / Entry', 'Mid-Level', 'Senior / Lead'. " +
              "Keep all string notes concise, professional, and directly actionable.",
          },
          {
            role: "user",
            content: [
              `Target Role: ${data.role}`,
              data.jobSkills.length ? `Key Required Skills: ${data.jobSkills.join(", ")}` : "",
              data.jobDescription ? `Job Description:\n${data.jobDescription}` : "",
              `Candidate Resume Text:\n${data.resumeText}`,
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
        {
          name: "semantic_resume_analysis",
          schema: semanticResumeSchema as unknown as Record<string, unknown>,
        },
        data.apiKey,
      );
      return result;
    } catch (err) {
      throw toClientError(err);
    }
  });

function toClientError(err: unknown) {
  if (err instanceof AiGatewayError) return new Error(err.message);
  if (err instanceof SyntaxError)
    return new Error("The AI service returned an unreadable response.");
  return new Error(err instanceof Error ? err.message : "AI request failed.");
}
