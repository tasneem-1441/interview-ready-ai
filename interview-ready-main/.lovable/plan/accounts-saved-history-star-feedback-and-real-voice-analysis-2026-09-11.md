# Accounts, saved history, STAR feedback and real voice analysis

Finish the app: add a real backend with sign-in and saved practice history, deeper
STAR feedback on behavioural answers, and much better microphone handling.

## 0. Fix first

One small code error left over from the last session is blocking the app from
building (the scoring panel's "score without AI" button). Fixed before anything else.

## 1. Cloud backend + accounts

Turn on Lovable Cloud (database + logins, no external accounts needed).

Tables:

- `profiles` — display name, created date, one row per person.
- `resumes` — file name, extracted text, word count, uploaded date.
- `target_jobs` — chosen vacancy or pasted job ad, required skills.
- `attempts` — date, job title, readiness score, each sub-score with its reason,
  question + answer transcripts, voice metrics, STAR breakdown.

Every table is private to its owner (row-level security on `auth.uid()`), with the
grants each table needs.

Sign-in:

- New `/auth` page: email + password sign-up, log in, and a clear "continue as
  guest" path.
- Header shows who's signed in, with log out.
- Guest-to-account carry-over: anything already saved on the device (current job,
  resume, past attempts) is uploaded once on first sign-in, then kept in sync.
- Offline resilience stays: the device copy remains the source the screens read
  from, the cloud copy is written alongside it and re-read on a new device.

Privacy:

- "Delete practice data" on the Progress page wipes both the device copy and the
  account's rows (resumes, jobs, attempts), with a confirmation step.
- Guests keep the existing device-only wipe.

## 2. STAR scoring

The AI scorer already grades answers; it gains a STAR pass for behavioural
questions: for each one it marks Situation, Task, Action and Result as clear,
weak or missing, and writes one line of advice on restructuring the story.

The report page gets a STAR breakdown card: four labelled markers per behavioural
answer with the missing pieces highlighted, plus the rewrite advice. Non-behavioural
answers keep the existing strength/improvement feedback. If the AI is unreachable,
the card is simply not shown — no invented results.

## 3. Voice capture and analysis

Replace the browser-only dictation with a sturdier recorder:

- `MediaRecorder` captures the audio so it works on iPhone/Safari and Android,
  not only Chrome desktop.
- Live loudness meter and silence detection via the Web Audio API: real
  micro-pauses, long pauses, speaking time vs silent time, and average volume.
- The words come back from server-side transcription (Lovable AI speech-to-text),
  so accuracy no longer depends on the browser.
- Clear states throughout: ready → recording (with timer and level meter) →
  transcribing → done → error, each with a retry and a typed-answer fallback.
- Microphone consent is asked once, explicitly, before the first recording.

Delivery metrics (pace, filler words, pauses) are computed from this real data and
feed the existing 20% delivery weight — no change to the score formula.

## 4. UI

All new screens (auth, STAR card, recorder states, account menu) use the existing
light theme, spacing and components. Nothing existing is removed, and no placeholder
or sample content is added anywhere.

## Technical notes

- Lovable Cloud (Supabase) enabled; auth via the managed client; protected data
  read through authenticated server functions with RLS, never the admin client.
- Sync layer: `src/lib/cloud-sync.functions.ts` (save/load attempt, resume, job,
  delete-all) called from `SessionProvider`, which keeps LocalStorage as the
  offline cache and reconciles on sign-in.
- STAR: extend the JSON schema in `src/lib/ai.functions.ts` (`scoreAnswersWithAi`)
  with an optional `star` block per behavioural answer; widen `Report` in
  `interview-data.ts`; render in `ReportStep.tsx`.
- Audio: rewrite `src/lib/use-speech.ts` as `useVoiceAnswer` using `MediaRecorder`
  - `AnalyserNode` RMS sampling, uploading a WAV/webm blob to a new
    `transcribeAnswer` server function that calls the gateway
    `/v1/audio/transcriptions` endpoint with `google/gemini-3.5-transcribe`.
- Verification: typecheck, then a phone-sized browser run through sign-up, the
  full five-step flow, report, and delete-data.

## Not included

- Password reset emails and social sign-in (can be added later if wanted).
- Sharing or exporting reports.
