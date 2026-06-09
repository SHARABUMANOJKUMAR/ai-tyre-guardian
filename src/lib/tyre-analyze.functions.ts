import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestIP } from "@tanstack/react-start/server";

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Simple in-memory rate limit: max 5 requests per IP per minute.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, number[]>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const arr = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (arr.length >= RATE_LIMIT_MAX) return false;
  arr.push(now);
  rateBuckets.set(ip, arr);
  if (rateBuckets.size > 1000) {
    for (const [k, v] of rateBuckets) {
      if (!v.some((t) => now - t < RATE_LIMIT_WINDOW_MS)) rateBuckets.delete(k);
    }
  }
  return true;
}

export type TyreAnalysis = {
  isTyre: boolean;
  score: number;
  tread: number;
  cracks: "None" | "Minor" | "Moderate" | "Severe";
  remainingKm: number;
  confidence: number;
  recommendation: "Safe to Use" | "Monitor Soon" | "Replace Immediately" | "Inconclusive — Retake Photo";
  notes: string;
  observations: string[];
  imageQuality?: "Good" | "Fair" | "Poor";
  inconclusive?: boolean;
};

const PROMPT = `You are a forensic automotive tyre inspector. Analyse the photo and report ONLY what is clearly visible. Do NOT guess, estimate, or invent details.

Return ONLY valid JSON in this exact shape (no markdown, no commentary):
{
  "isTyre": boolean,
  "imageQuality": "Good" | "Fair" | "Poor",
  "score": number,
  "tread": number,
  "cracks": "None" | "Minor" | "Moderate" | "Severe",
  "remainingKm": number,
  "confidence": number,
  "recommendation": "Safe to Use" | "Monitor Soon" | "Replace Immediately" | "Inconclusive — Retake Photo",
  "notes": string,
  "observations": string[]
}

STRICT RULES (truth-first):
1. If the image is NOT a clear tyre/tread close-up (blurry, dark, far away, wrong subject, occluded, glare, or you cannot see tread blocks): set isTyre=false, imageQuality="Poor", confidence <= 30, score=0, tread=0, cracks="None", remainingKm=0, recommendation="Inconclusive — Retake Photo", and explain in notes what is missing.
2. NEVER invent tread depth, crack severity, brand, size, or mileage. If you cannot see it, mark it inconclusive.
3. Only set confidence >= 70 when tread blocks AND sidewall are both clearly visible and sharp.
4. Observations must each reference something you can literally see in the photo. If you can't list 2 real observations, the image is inconclusive.
5. tread = wear percentage (0 = brand new full tread, 100 = bald). cracks based only on visible sidewall damage.
6. remainingKm must be consistent with tread wear; if uncertain, return 0 and mark inconclusive.
7. Be conservative on safety — when in doubt, recommend inspection over "Safe to Use".
8. Also inspect for: sidewall damage, visible cracks, uneven wear patterns, puncture indicators, age-related deterioration, and any visible under-inflation signs.`;

const SYSTEM_PROMPT =
  "You are a forensic tyre inspector. You only report what is visually verifiable. You refuse to guess. When uncertain, you mark the result inconclusive and ask for a better photo. Always respond with valid JSON only, no markdown fences.";

// Vision-capable models only. Tyre analysis requires image input support.
const OPENROUTER_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash-001",
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-sonnet",
];

const USER_FACING_ERROR = "AI service temporarily unavailable. Please try again later.";
const MAX_RETRIES_PER_MODEL = 2;

async function callOpenRouter(model: string, apiKey: string, dataUrl: string): Promise<string> {
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      top_p: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`OpenRouter ${model} ${resp.status}: ${errText.slice(0, 200)}`);
  }
  const json = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error(`OpenRouter ${model}: empty response`);
  return text;
}


async function tryWithRetries(
  label: string,
  fn: () => Promise<string>,
  maxRetries: number,
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      console.warn(`[tyre-ai] ${label} attempt ${attempt}/${maxRetries} failed:`, e instanceof Error ? e.message : e);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export const analyzeTyre = createServerFn({ method: "POST" })
  .inputValidator((d: { imageBase64: string; mime: string }) => {
    if (!d?.imageBase64 || typeof d.imageBase64 !== "string") {
      throw new Error("Missing image data");
    }
    if (d.imageBase64.length > 8_000_000) {
      throw new Error("Image too large (max ~6MB)");
    }
    if (!d.mime || typeof d.mime !== "string" || !ALLOWED_MIMES.has(d.mime)) {
      throw new Error("Unsupported image type. Use JPEG, PNG, WEBP, or GIF.");
    }
    return d;
  })
  .handler(async ({ data }): Promise<TyreAnalysis> => {
    try {
      const ip =
        getRequestIP({ xForwardedFor: true }) ||
        getRequest().headers.get("cf-connecting-ip") ||
        "unknown";
      if (!checkRateLimit(ip)) {
        throw new Error("Too many requests. Please wait a minute and try again.");
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Too many")) throw e;
    }

    const openRouterKey = process.env.OpenRouter_API_Key999;

    const mime = data.mime || "image/jpeg";
    const dataUrl = `data:${mime};base64,${data.imageBase64}`;

    const started = Date.now();
    let rawText: string | null = null;
    let usedModel = "";
    const failures: string[] = [];

    if (!openRouterKey) {
      console.error("[tyre-ai] OpenRouter API key not configured");
      throw new Error(USER_FACING_ERROR);
    }

    for (const model of OPENROUTER_MODELS) {
      const modelStart = Date.now();
      try {
        rawText = await tryWithRetries(
          `openrouter:${model}`,
          () => callOpenRouter(model, openRouterKey, dataUrl),
          MAX_RETRIES_PER_MODEL,
        );
        usedModel = `openrouter:${model}`;
        console.info(`[tyre-ai] model=${model} status=success duration=${Date.now() - modelStart}ms`);
        break;
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        failures.push(`${model}: ${reason}`);
        console.warn(`[tyre-ai] model=${model} status=failure duration=${Date.now() - modelStart}ms reason=${reason}`);
      }
    }

    if (!rawText) {
      console.error("[tyre-ai] all vision models failed:", failures.join(" | "));
      throw new Error(USER_FACING_ERROR);
    }

    const durationMs = Date.now() - started;
    console.info(`[tyre-ai] success model=${usedModel} total_duration=${durationMs}ms`);

    let parsed: TyreAnalysis;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error("[tyre-ai] non-JSON response from", usedModel);
        throw new Error(USER_FACING_ERROR);
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        throw new Error(USER_FACING_ERROR);
      }
    }

    // Defensive clamping
    parsed.score = clamp(Number(parsed.score) || 0, 0, 100);
    parsed.tread = clamp(Number(parsed.tread) || 0, 0, 100);
    parsed.remainingKm = clamp(Number(parsed.remainingKm) || 0, 0, 60000);
    parsed.confidence = clamp(Number(parsed.confidence) || 0, 0, 100);
    if (!Array.isArray(parsed.observations)) parsed.observations = [];
    parsed.observations = parsed.observations
      .filter((o) => typeof o === "string" && o.trim().length > 4)
      .slice(0, 8);

    const tooLowConfidence = parsed.confidence < 60;
    const notATyre = parsed.isTyre === false;
    const poorImage = parsed.imageQuality === "Poor";
    const notEnoughEvidence = parsed.observations.length < 2;

    if (notATyre || tooLowConfidence || poorImage || notEnoughEvidence) {
      return {
        isTyre: parsed.isTyre ?? false,
        imageQuality: parsed.imageQuality ?? "Poor",
        score: 0,
        tread: 0,
        cracks: "None",
        remainingKm: 0,
        confidence: parsed.confidence,
        recommendation: "Inconclusive — Retake Photo",
        notes:
          parsed.notes && parsed.notes.length > 8
            ? parsed.notes
            : "We couldn't verify this image with confidence. Please upload a sharp close-up (about 30 cm away) directly facing the tread, with good lighting.",
        observations: parsed.observations,
        inconclusive: true,
      };
    }

    const derivedKm = Math.round(((100 - parsed.tread) / 100) * 50000);
    const crackPenalty =
      parsed.cracks === "Severe" ? 0.1
      : parsed.cracks === "Moderate" ? 0.4
      : parsed.cracks === "Minor" ? 0.75
      : 1;
    const safeKm = Math.round(derivedKm * crackPenalty);
    if (Math.abs(parsed.remainingKm - safeKm) / Math.max(safeKm, 1) > 0.5) {
      parsed.remainingKm = safeKm;
    }

    if (parsed.cracks === "Severe" || parsed.tread >= 80) {
      parsed.recommendation = "Replace Immediately";
    } else if (parsed.cracks === "Moderate" || parsed.tread >= 55) {
      if (parsed.recommendation === "Safe to Use") parsed.recommendation = "Monitor Soon";
    }

    parsed.inconclusive = false;
    return parsed;
  });

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}
