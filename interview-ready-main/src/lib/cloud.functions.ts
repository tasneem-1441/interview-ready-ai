import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

const MetricInput = z.object({
  key: z.string().max(40),
  label: z.string().max(120),
  score: z.number().int().min(0).max(100),
});

const AttemptInput = z.object({
  localId: z.string().min(1).max(200),
  at: z.number().int(),
  jobTitle: z.string().max(200).default(""),
  org: z.string().max(200).default(""),
  readiness: z.number().int().min(0).max(100),
  metrics: z.array(MetricInput).max(12).default([]),
  questionsAnswered: z.number().int().min(0).max(50).default(0),
  transcript: z
    .array(
      z.object({
        questionId: z.number().int(),
        cls: z.string().max(20),
        prompt: z.string().max(600).default(""),
        text: z.string().max(6000).default(""),
        mode: z.string().max(10).default("text"),
      }),
    )
    .max(20)
    .default([]),
  voiceMetrics: z
    .array(
      z.object({
        questionId: z.number().int(),
        seconds: z.number().int().min(0),
        fillerWords: z.number().int().min(0),
        longPauses: z.number().int().min(0),
        wordsPerMinute: z.number().int().min(0),
      }),
    )
    .max(20)
    .default([]),
  star: z.array(z.record(z.string(), z.unknown())).max(20).default([]),
});

export type CloudAttempt = {
  localId: string;
  at: number;
  jobTitle: string;
  org: string;
  readiness: number;
  metrics: { key: string; label: string; score: number }[];
  questionsAnswered: number;
};

/* ------------------------------------------------------------------ */
/* Read everything for the signed-in person                            */
/* ------------------------------------------------------------------ */

export const loadCloudData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [attemptsRes, resumeRes, jobRes] = await Promise.all([
      supabase
        .from("attempts")
        .select("local_id, taken_at, job_title, org, readiness, metrics, questions_answered")
        .eq("user_id", userId)
        .order("taken_at", { ascending: true })
        .limit(100),
      supabase
        .from("resumes")
        .select("file_name, content, word_count")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("target_jobs")
        .select("title, org, location, description, skills, source")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (attemptsRes.error) throw new Error(attemptsRes.error.message);

    const attempts: CloudAttempt[] = (attemptsRes.data ?? []).map((row: any) => ({
      localId: row.local_id,
      at: new Date(row.taken_at).getTime(),
      jobTitle: row.job_title,
      org: row.org,
      readiness: row.readiness,
      metrics: Array.isArray(row.metrics)
        ? (row.metrics as { key: string; label: string; score: number }[])
        : [],
      questionsAnswered: row.questions_answered,
    }));

    return {
      attempts,
      resume: resumeRes.data ?? null,
      job: jobRes.data ?? null,
    };
  });

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export const saveCloudAttempts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ attempts: z.array(AttemptInput).min(1).max(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const rows = data.attempts.map((a) => ({
      user_id: userId,
      local_id: a.localId,
      taken_at: new Date(a.at).toISOString(),
      job_title: a.jobTitle,
      org: a.org,
      readiness: a.readiness,
      metrics: a.metrics,
      transcript: a.transcript,
      voice_metrics: a.voiceMetrics,
      star: a.star,
      questions_answered: a.questionsAnswered,
    }));
    const { error } = await supabase
      .from("attempts")
      .upsert(rows as any, { onConflict: "user_id,local_id" });
    if (error) throw new Error(error.message);
    return { saved: rows.length };
  });

export const saveCloudResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fileName: z.string().max(300).nullable().default(null),
        content: z.string().max(200000).default(""),
        wordCount: z.number().int().min(0).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const existing = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload = {
      user_id: userId,
      file_name: data.fileName,
      content: data.content,
      word_count: data.wordCount,
    };

    const { error } = existing.data?.id
      ? await supabase.from("resumes").update(payload).eq("id", existing.data.id)
      : await supabase.from("resumes").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveCloudJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        org: z.string().max(200).default(""),
        location: z.string().max(200).default(""),
        description: z.string().max(20000).default(""),
        skills: z.array(z.string().max(80)).max(50).default([]),
        source: z.string().max(20).default("custom"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const existing = await supabase
      .from("target_jobs")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload = { user_id: userId, ...data };
    const { error } = existing.data?.id
      ? await supabase.from("target_jobs").update(payload).eq("id", existing.data.id)
      : await supabase.from("target_jobs").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Privacy safeguard: removes every stored row for the signed-in person. */
export const deleteCloudData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    for (const table of ["attempts", "resumes", "target_jobs"] as const) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
