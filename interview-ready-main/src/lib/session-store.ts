import { createContext, useContext } from "react";
import type { Report, ResumeAnalysis, AnswerRecord } from "./interview-data";
import type { TargetJob } from "./target-job";

export type Attempt = {
  id: string;
  at: number;
  jobTitle: string;
  org: string;
  readiness: number;
  metrics: { key: string; label: string; score: number }[];
  questionsAnswered: number;
};

export type SessionState = {
  job: TargetJob | null;
  resumeText: string | null;
  resumeName: string | null;
  analysis: ResumeAnalysis | null;
  answers: AnswerRecord[] | null;
  report: Report | null;
  step: number;
  maxReached: number;
  attempt: number;
  difficulty: "easy" | "medium" | "hard";
  /** Prompts already asked, so a re-test never repeats them. */
  askedPrompts: string[];
  /** Set once the user agrees to speech-to-text capture. */
  micConsent: boolean;
};

export const EMPTY_SESSION: SessionState = {
  job: null,
  resumeText: null,
  resumeName: null,
  analysis: null,
  answers: null,
  report: null,
  step: 0,
  maxReached: 0,
  attempt: 1,
  difficulty: "medium",
  askedPrompts: [],
  micConsent: false,
};

const SESSION_KEY = "ncs-interviewready:session:v1";
const ATTEMPTS_KEY = "ncs-interviewready:attempts:v1";

const canStore = () => typeof window !== "undefined";

export function loadSession(): SessionState {
  if (!canStore()) return EMPTY_SESSION;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return EMPTY_SESSION;
    return { ...EMPTY_SESSION, ...(JSON.parse(raw) as Partial<SessionState>) };
  } catch {
    return EMPTY_SESSION;
  }
}

export function persistSession(state: SessionState) {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — session simply won't survive a reload */
  }
}

export function loadAttempts(): Attempt[] {
  if (!canStore()) return [];
  try {
    const raw = window.localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Attempt[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAttempts(list: Attempt[]) {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(list.slice(-50)));
  } catch {
    /* ignore */
  }
}

export function clearAttempts() {
  if (!canStore()) return;
  window.localStorage.removeItem(ATTEMPTS_KEY);
}

export function clearStoredSession() {
  if (!canStore()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export type SessionApi = {
  ready: boolean;
  session: SessionState;
  attempts: Attempt[];
  update: (patch: Partial<SessionState>) => void;
  goToStep: (i: number) => void;
  recordAttempt: (a: Attempt) => void;
  resetAll: () => void;
  clearHistory: () => void;
  /** Wipes the session and every saved attempt from this browser. */
  deleteEverything: () => void;
};

export const SessionContext = createContext<SessionApi | null>(null);

export function useSession(): SessionApi {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
