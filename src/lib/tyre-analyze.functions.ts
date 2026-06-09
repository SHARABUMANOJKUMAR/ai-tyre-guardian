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
  // Light cleanup
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
  recommendation: "Safe to Use" | "Monitor Soon" | "Replace Immediately";
  notes: string;
  observations: string[];
};

const PROMPT = `You are an expert automotive tyre inspector. Carefully analyse the provided photo of a tyre and produce an HONEST, conservative safety report.

Return ONLY valid JSON with this exact shape (no markdown, no commentary):
{
  "isTyre": boolean,                       // false if the image is not clearly a tyre/wheel
  "score": number,                         // overall health 0-100 (100 = brand new)
  "tread": number,                         // estimated tread WEAR percentage 0-100 (0 = full tread, 100 = bald)
  "cracks": "None" | "Minor" | "Moderate" | "Severe",
  "remainingKm": number,                   // realistic remaining life in km (0 - 60000)
  "confidence": number,                    // your confidence 0-100
  "recommendation": "Safe to Use" | "Monitor Soon" | "Replace Immediately",
  "notes": string,                         // one short customer-friendly sentence
  "observations": string[]                 // 2-4 short factual observations from the photo
}

Rules:
- Be truthful. If the photo is blurry, dark, or not a tyre, set isTyre=false, confidence low, score 0 and explain in notes.
- If tread is heavily worn, sidewall cracks visible, or bulges present, recommend "Replace Immediately".
- If moderate wear, recommend "Monitor Soon".
- Base remainingKm on visible tread depth; bald/cracked = near 0 km.
- Do NOT invent details that are not visible. Stay conservative on safety.`;

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
      // If request context is unavailable, proceed without throttle.
    }

    const apiKey = process.env.OpenRouter_API_Key999;
    if (!apiKey) {
      throw new Error("Server is missing OpenRouter API key configuration.");
    }

    const mime = data.mime || "image/jpeg";
    const dataUrl = `data:${mime};base64,${data.imageBase64}`;

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
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
      const errText = await resp.text();
      console.error("OpenRouter API error:", resp.status, errText);
      throw new Error(`AI service error (${resp.status}). Please try again.`);
    }

    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = json.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty response from AI model.");

    let parsed: TyreAnalysis;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI response was not valid JSON.");
      parsed = JSON.parse(match[0]);
    }

    // Defensive clamping
    parsed.score = clamp(Number(parsed.score) || 0, 0, 100);
    parsed.tread = clamp(Number(parsed.tread) || 0, 0, 100);
    parsed.remainingKm = clamp(Number(parsed.remainingKm) || 0, 0, 60000);
    parsed.confidence = clamp(Number(parsed.confidence) || 0, 0, 100);
    if (!Array.isArray(parsed.observations)) parsed.observations = [];

    return parsed;
  });

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}
