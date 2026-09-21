import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireMongoAuth } from "./auth-jwt";
import { getCollections } from "./mongodb";

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
  .middleware([requireMongoAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { attempts, resumes, targetJobs } = await getCollections();

    const [attemptDocs, resumeDoc, jobDoc] = await Promise.all([
      attempts.find({ userId }).sort({ takenAt: 1 }).limit(100).toArray(),
      resumes.findOne({ userId }, { sort: { updatedAt: -1 } }),
      targetJobs.findOne({ userId }, { sort: { updatedAt: -1 } }),
    ]);

    const mappedAttempts: CloudAttempt[] = attemptDocs.map((row) => ({
      localId: row.localId,
      at: new Date(row.takenAt).getTime(),
      jobTitle: row.jobTitle,
      org: row.org,
      readiness: row.readiness,
      metrics: Array.isArray(row.metrics)
        ? row.metrics.map((m) => ({
            key: String(m.key ?? ""),
            label: String(m.label ?? ""),
            score: Number(m.score ?? 0),
          }))
        : [],
      questionsAnswered: row.questionsAnswered,
    }));

    const resume = resumeDoc
      ? {
          fileName: resumeDoc.fileName,
          file_name: resumeDoc.fileName,
          content: resumeDoc.content,
          wordCount: resumeDoc.wordCount,
        }
      : null;

    const job = jobDoc
      ? {
          title: jobDoc.title,
          org: jobDoc.org,
          location: jobDoc.location,
          description: jobDoc.description,
          skills: jobDoc.skills ?? [],
          source: jobDoc.source,
        }
      : null;

    return {
      attempts: mappedAttempts,
      resume,
      job,
      targetJob: job,
    };
  });

/* ------------------------------------------------------------------ */
/* Append / Upsert multiple attempts                                   */
/* ------------------------------------------------------------------ */

export const saveCloudAttempts = createServerFn({ method: "POST" })
  .middleware([requireMongoAuth])
  .validator((data: unknown) =>
    z
      .object({
        attempts: z.array(AttemptInput).max(50),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { attempts } = await getCollections();
    const now = new Date();

    for (const a of data.attempts) {
      await attempts.updateOne(
        { userId, localId: a.localId },
        {
          $set: {
            takenAt: new Date(a.at),
            jobTitle: a.jobTitle,
            org: a.org,
            readiness: a.readiness,
            metrics: a.metrics,
            questionsAnswered: a.questionsAnswered,
            transcript: a.transcript,
            voiceMetrics: a.voiceMetrics,
            star: a.star,
          },
          $setOnInsert: {
            userId,
            localId: a.localId,
            createdAt: now,
          },
        },
        { upsert: true },
      );
    }

    return { ok: true };
  });

/* Single attempt fallback */
export const saveCloudAttempt = createServerFn({ method: "POST" })
  .middleware([requireMongoAuth])
  .validator((data: unknown) => AttemptInput.parse(data))
  .handler(async ({ context, data: a }) => {
    const { userId } = context;
    const { attempts } = await getCollections();
    const now = new Date();

    await attempts.updateOne(
      { userId, localId: a.localId },
      {
        $set: {
          takenAt: new Date(a.at),
          jobTitle: a.jobTitle,
          org: a.org,
          readiness: a.readiness,
          metrics: a.metrics,
          questionsAnswered: a.questionsAnswered,
          transcript: a.transcript,
          voiceMetrics: a.voiceMetrics,
          star: a.star,
        },
        $setOnInsert: {
          userId,
          localId: a.localId,
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Upsert latest resume                                               */
/* ------------------------------------------------------------------ */

export const saveCloudResume = createServerFn({ method: "POST" })
  .middleware([requireMongoAuth])
  .validator((data: unknown) =>
    z
      .object({
        fileName: z.string().max(255).nullable().default(null),
        content: z.string().max(60000),
        wordCount: z.number().int().min(0),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { resumes } = await getCollections();
    const now = new Date();

    await resumes.updateOne(
      { userId },
      {
        $set: {
          fileName: data.fileName,
          content: data.content,
          wordCount: data.wordCount,
          updatedAt: now,
        },
        $setOnInsert: {
          userId,
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Upsert latest target job                                           */
/* ------------------------------------------------------------------ */

export const saveCloudJob = createServerFn({ method: "POST" })
  .middleware([requireMongoAuth])
  .validator((data: unknown) =>
    z
      .object({
        title: z.string().max(200),
        org: z.string().max(200),
        location: z.string().max(200).optional(),
        description: z.string().max(30000),
        skills: z.array(z.string().max(100)).max(60),
        source: z.string().max(50),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { targetJobs } = await getCollections();
    const now = new Date();

    await targetJobs.updateOne(
      { userId },
      {
        $set: {
          title: data.title,
          org: data.org,
          location: data.location,
          description: data.description,
          skills: data.skills,
          source: data.source,
          updatedAt: now,
        },
        $setOnInsert: {
          userId,
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Delete everything for the signed-in person (privacy wipe)           */
/* ------------------------------------------------------------------ */

export const deleteCloudData = createServerFn({ method: "POST" })
  .middleware([requireMongoAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { attempts, resumes, targetJobs } = await getCollections();

    await Promise.all([
      attempts.deleteMany({ userId }),
      resumes.deleteMany({ userId }),
      targetJobs.deleteMany({ userId }),
    ]);

    return { ok: true };
  });
