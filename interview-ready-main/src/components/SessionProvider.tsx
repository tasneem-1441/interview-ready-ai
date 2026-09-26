import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  EMPTY_SESSION,
  SessionContext,
  clearAttempts,
  clearStoredSession,
  loadAttempts,
  loadSession,
  persistSession,
  saveAttempts,
  type Attempt,
  type SessionState,
} from "@/lib/session-store";
import { useAuth } from "@/lib/use-auth";
import {
  deleteCloudData,
  loadCloudData,
  saveCloudAttempts,
  saveCloudJob,
  saveCloudResume,
} from "@/lib/cloud.functions";

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const fetchCloud = useServerFn(loadCloudData);
  const syncAttempts = useServerFn(saveCloudAttempts);
  const syncJob = useServerFn(saveCloudJob);
  const syncResume = useServerFn(saveCloudResume);
  const wipeCloud = useServerFn(deleteCloudData);

  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionState>(EMPTY_SESSION);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setSession(loadSession());
    setAttempts(loadAttempts());
    setReady(true);
  }, []);

  // Save session state to localStorage
  useEffect(() => {
    if (ready) persistSession(session);
  }, [ready, session]);

  // Two-way cloud sync when user is authenticated
  useEffect(() => {
    if (!ready || !user) return;

    fetchCloud()
      .then((cloud) => {
        if (!cloud) return;

        // Merge cloud attempts with local attempts
        setAttempts((localList) => {
          const map = new Map<string, Attempt>();

          cloud.attempts.forEach((ca) => {
            map.set(ca.localId, {
              id: ca.localId,
              at: ca.at,
              jobTitle: ca.jobTitle,
              org: ca.org,
              readiness: ca.readiness,
              metrics: ca.metrics,
              questionsAnswered: ca.questionsAnswered,
            });
          });

          localList.forEach((la) => {
            if (!map.has(la.id)) {
              map.set(la.id, la);
            }
          });

          const merged = Array.from(map.values()).sort((a, b) => a.at - b.at);
          saveAttempts(merged);

          // Upload local attempts that haven't been pushed to the cloud yet
          const unsynced = localList.filter(
            (la) => !cloud.attempts.some((ca) => ca.localId === la.id),
          );

          if (unsynced.length > 0) {
            void syncAttempts({
              data: {
                attempts: unsynced.map((u) => ({
                  localId: u.id,
                  at: u.at,
                  jobTitle: u.jobTitle,
                  org: u.org,
                  readiness: u.readiness,
                  metrics: u.metrics,
                  questionsAnswered: u.questionsAnswered,
                  transcript: [],
                  voiceMetrics: [],
                  star: [],
                })),
              },
            }).catch(() => {});
          }

          return merged;
        });

        // Hydrate cloud job & resume if local state is empty
        setSession((current) => {
          const updated = { ...current };
          if (!current.job && cloud.job) {
            updated.job = {
              title: cloud.job.title,
              org: cloud.job.org,
              location: cloud.job.location,
              description: cloud.job.description,
              skills: cloud.job.skills,
              source: (cloud.job.source as "ncs" | "custom") || "custom",
            };
          }
          if (!current.resumeText && cloud.resume?.content) {
            updated.resumeText = cloud.resume.content;
            updated.resumeName = cloud.resume.file_name;
          }
          return updated;
        });
      })
      .catch((err) => {
        console.warn("Cloud sync unavailable:", err);
      });
  }, [user, ready]);

  const update = useCallback(
    (patch: Partial<SessionState>) => {
      setSession((s) => ({ ...s, ...patch }));

      if (user) {
        if (patch.job) {
          void syncJob({
            data: {
              title: patch.job.title,
              org: patch.job.org || "",
              location: patch.job.location || "",
              description: patch.job.description || "",
              skills: patch.job.skills || [],
              source: patch.job.source || "custom",
            },
          }).catch(() => {});
        }

        if (patch.resumeText) {
          void syncResume({
            data: {
              fileName: patch.resumeName || null,
              content: patch.resumeText,
              wordCount: patch.analysis?.wordCount || 0,
            },
          }).catch(() => {});
        }
      }
    },
    [user],
  );

  const goToStep = useCallback((i: number) => {
    setSession((s) => ({ ...s, step: i, maxReached: Math.max(s.maxReached, i) }));
  }, []);

  const recordAttempt = useCallback(
    (a: Attempt) => {
      setAttempts((list) => {
        const next = [...list.filter((x) => x.id !== a.id), a];
        saveAttempts(next);
        return next;
      });

      if (user) {
        void syncAttempts({
          data: {
            attempts: [
              {
                localId: a.id,
                at: a.at,
                jobTitle: a.jobTitle,
                org: a.org,
                readiness: a.readiness,
                metrics: a.metrics,
                questionsAnswered: a.questionsAnswered,
                transcript: [],
                voiceMetrics: [],
                star: [],
              },
            ],
          },
        }).catch(() => {});
      }
    },
    [user],
  );

  const resetAll = useCallback(() => setSession(EMPTY_SESSION), []);

  const clearHistory = useCallback(() => {
    clearAttempts();
    setAttempts([]);
    if (user) {
      void wipeCloud().catch(() => {});
    }
  }, [user]);

  const deleteEverything = useCallback(() => {
    clearAttempts();
    clearStoredSession();
    setAttempts([]);
    setSession(EMPTY_SESSION);
    if (user) {
      void wipeCloud().catch(() => {});
    }
  }, [user]);

  const value = useMemo(
    () => ({
      ready,
      session,
      attempts,
      update,
      goToStep,
      recordAttempt,
      resetAll,
      clearHistory,
      deleteEverything,
    }),
    [
      ready,
      session,
      attempts,
      update,
      goToStep,
      recordAttempt,
      resetAll,
      clearHistory,
      deleteEverything,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
