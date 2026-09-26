import { useCallback, useEffect, useRef, useState } from "react";

type SpeechResultAlt = { transcript: string };
type SpeechResult = { isFinal: boolean; 0: SpeechResultAlt; length: number };
type SpeechEvent = {
  resultIndex: number;
  results: { length: number } & Record<number, SpeechResult>;
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Enhanced audio recording & speech-to-text hook.
 * Uses Web Speech API for real-time transcription where supported,
 * and MediaRecorder to capture playable audio blobs for candidate review and AI transcription.
 */
export function useSpeech() {
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [mediaRecorderSupported, setMediaRecorderSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [pauses, setPauses] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Audio capture state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const recRef = useRef<Recognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastSpeechRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSpeechRecognitionSupported(getCtor() !== null);
    setMediaRecorderSupported(
      Boolean(typeof navigator.mediaDevices?.getUserMedia === "function" && window.MediaRecorder),
    );
  }, []);

  const supported = speechRecognitionSupported || mediaRecorderSupported;

  useEffect(() => {
    if (!recording) return;
    const t = window.setInterval(() => {
      setSeconds((s) => s + 1);
      if (Date.now() - lastSpeechRef.current > 3000) {
        lastSpeechRef.current = Date.now();
        setPauses((p) => p + 1);
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [recording]);

  const stop = useCallback(() => {
    // Stop speech recognition
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        /* ignore if already stopped */
      }
      recRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* ignore if already stopped */
      }
    }

    // Stop microphone tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setRecording(false);
    setInterim("");
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    setInterim("");
    setSeconds(0);
    setPauses(0);
    lastSpeechRef.current = Date.now();

    // Revoke previous audio URL if any
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
    }

    // 1. Start MediaRecorder for capturing real audio
    audioChunksRef.current = [];
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "audio/ogg";

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          if (blob.size > 0) {
            setAudioBlob(blob);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
          }
        };

        recorder.start(250);
      } catch (err) {
        console.warn("MediaRecorder mic access error:", err);
      }
    }

    // 2. Start SpeechRecognition if supported for real-time client transcription
    const Ctor = getCtor();
    if (Ctor) {
      const rec = new Ctor();
      rec.lang = "en-IN";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        lastSpeechRef.current = Date.now();
        let live = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i]!;
          if (r.isFinal) setTranscript((prev) => `${prev} ${r[0].transcript}`.trim());
          else live += r[0].transcript;
        }
        setInterim(live);
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed") {
          setError("Microphone permission was blocked. Allow mic access, or type your answer.");
          setRecording(false);
        } else if (e.error !== "no-speech") {
          // If speech recognition error happens, fallback gracefully
          console.warn("Speech recognition warning:", e.error);
        }
      };
      rec.onend = () => {
        // Recognition ended
      };

      try {
        rec.start();
        recRef.current = rec;
      } catch (err) {
        console.warn("Web Speech API start error:", err);
      }
    }

    setRecording(true);
  }, [audioUrl]);

  const reset = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscript("");
    setInterim("");
    setSeconds(0);
    setPauses(0);
    setError(null);
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      recRef.current?.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    supported,
    speechRecognitionSupported,
    mediaRecorderSupported,
    recording,
    transcript,
    setTranscript,
    interim,
    seconds,
    pauses,
    error,
    audioUrl,
    audioBlob,
    start,
    stop,
    reset,
  };
}
