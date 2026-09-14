import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AiGatewayError, DIRECT_GEMINI_MODELS } from "./ai.server";

const TranscribeInput = z.object({
  audioBase64: z.string().min(10),
  mimeType: z.string().default("audio/webm"),
  apiKey: z.string().optional(),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TranscribeInput.parse(input))
  .handler(async ({ data }): Promise<{ transcript: string }> => {
    const geminiKey =
      data.apiKey?.trim() || process.env["GEMINI_API_KEY"] || process.env["VITE_GEMINI_API_KEY"];

    if (!geminiKey) {
      throw new AiGatewayError(
        401,
        "No AI API key found. Add your Gemini API key in settings to enable AI audio transcription.",
      );
    }

    let lastError: Error | null = null;

    for (const model of DIRECT_GEMINI_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": geminiKey,
            Authorization: `Bearer ${geminiKey}`,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "You are an accurate audio transcriber. Transcribe every spoken word in this audio recording precisely as spoken. Output ONLY the raw transcript text. Do not add quotes, commentary, or formatting.",
                  },
                  {
                    inline_data: {
                      mime_type: data.mimeType || "audio/webm",
                      data: data.audioBase64,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          if (res.status === 503 || res.status === 429 || res.status === 404) {
            lastError = new AiGatewayError(
              res.status,
              `Model ${model} busy: ${errorText.slice(0, 150)}`,
            );
            continue;
          }
          throw new AiGatewayError(res.status, `Transcription failed: ${errorText.slice(0, 200)}`);
        }

        const json = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };

        const transcript = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

        return { transcript };
      } catch (err) {
        if (
          err instanceof AiGatewayError &&
          (err.status === 503 || err.status === 429 || err.status === 404)
        ) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    throw (
      lastError ||
      new AiGatewayError(503, "Audio transcription service is currently experiencing high demand.")
    );
  });
