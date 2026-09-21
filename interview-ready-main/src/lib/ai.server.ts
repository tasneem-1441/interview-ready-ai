/** Server-only helper for calling AI (Google Gemini directly) with strict JSON schema. */

const GEMINI_OPENAI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

export const AI_MODEL = "gemini-flash-lite-latest";

/** Candidate Gemini models in order of priority with automatic failover on 503/429/404 */
export const DIRECT_GEMINI_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
  "gemini-flash-latest",
] as const;

export class AiGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AiGatewayError";
  }
}

type Msg = { role: "system" | "user"; content: string };

export async function callGatewayJson<T>(
  messages: Msg[],
  schema: { name: string; schema: Record<string, unknown> },
  overrideKey?: string,
): Promise<T> {
  const geminiKey =
    overrideKey?.trim() || process.env["GEMINI_API_KEY"] || process.env["VITE_GEMINI_API_KEY"];

  if (!geminiKey) {
    throw new AiGatewayError(
      401,
      "No AI API key configured. Add GEMINI_API_KEY to your .env file or settings.",
    );
  }

  const endpoint = GEMINI_OPENAI_ENDPOINT;
  const modelsToTry = [...DIRECT_GEMINI_MODELS];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${geminiKey}`,
    "X-goog-api-key": geminiKey,
  };

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages,
          response_format: {
            type: "json_schema",
            json_schema: { name: schema.name, strict: true, schema: schema.schema },
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        let message = body.slice(0, 300);
        try {
          const parsed = JSON.parse(body) as any;
          if (Array.isArray(parsed) && parsed[0]?.error?.message) {
            message = parsed[0].error.message;
          } else if (parsed?.error?.message) {
            message = parsed.error.message;
          } else if (parsed?.message) {
            message = parsed.message;
          }
        } catch {
          /* keep raw text */
        }

        // If 503 (high demand), 429 (rate limit), or 404 (model unavailable), try next model
        if (
          (res.status === 503 || res.status === 429 || res.status === 404) &&
          modelsToTry.length > 1
        ) {
          console.warn(
            `Model ${model} returned ${res.status} (${message}), attempting failover to next model...`,
          );
          lastError = new AiGatewayError(res.status, message);
          continue;
        }

        if (res.status === 429)
          message = "The AI service is busy right now. Try again in a moment.";
        if (res.status === 402) message = message || "AI credits are exhausted for this workspace.";
        throw new AiGatewayError(res.status, message);
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new AiGatewayError(502, "The AI service returned an empty response.");
      return JSON.parse(content) as T;
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
    new AiGatewayError(
      503,
      "All AI model candidates are currently busy. Please try again in a moment.",
    )
  );
}
