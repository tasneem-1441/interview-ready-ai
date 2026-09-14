/** Server-only helper for calling AI (Google Gemini directly or via Lovable AI Gateway) with strict JSON schema. */

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GEMINI_OPENAI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

export const AI_MODEL = "google/gemini-3.8-flash";

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
  const lovableKey = process.env["LOVABLE_API_KEY"];

  if (!geminiKey && !lovableKey) {
    throw new AiGatewayError(
      401,
      "No AI API key configured. Add GEMINI_API_KEY to your .env file or settings.",
    );
  }

  const endpoint = geminiKey ? GEMINI_OPENAI_ENDPOINT : LOVABLE_GATEWAY;
  const modelsToTry = geminiKey ? [...DIRECT_GEMINI_MODELS] : [AI_MODEL];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (geminiKey) {
    headers["Authorization"] = `Bearer ${geminiKey}`;
    headers["X-goog-api-key"] = geminiKey;
  } else if (lovableKey) {
    headers["Lovable-API-Key"] = lovableKey;
    headers["X-Lovable-AIG-SDK"] = "fetch";
  }

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
