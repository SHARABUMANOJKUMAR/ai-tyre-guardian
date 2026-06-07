import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Generic AI explainer used by all calculator tools.
 * Takes the calculated result as JSON + a tool context string and returns
 * a short, plain-language interpretation + recommendations.
 *
 * Uses OpenRouter (OpenRouter_API_Key999) with a small free-tier model,
 * falls back to Lovable AI Gateway if OpenRouter is unavailable.
 *
 * IMPORTANT: only used for explanations / recommendations.
 * Numerical results stay separate (calculated client-side).
 */
const Schema = z.object({
  toolName: z.string().min(1).max(80),
  prompt: z.string().min(1).max(4000),
});

interface AiExplanation {
  text: string;
  confidence: number; // 0-100
  source: "openrouter" | "lovable" | "fallback";
}

async function callOpenRouter(toolName: string, prompt: string): Promise<string | null> {
  const key = process.env.OpenRouter_API_Key999;
  if (!key) return null;
  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "You are a senior automotive technician at Manoj Wheels, a tyre and service workshop in India. Explain calculator results in clear, friendly English (under 120 words). Always end with a 1-2 line recommendation. Never invent specific measurements you weren't given.",
          },
          { role: "user", content: `Tool: ${toolName}\n\n${prompt}` },
        ],
        temperature: 0.4,
        max_tokens: 320,
      }),
    });
    if (!resp.ok) return null;
    const j = await resp.json();
    return (j?.choices?.[0]?.message?.content as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function callLovableAi(toolName: string, prompt: string): Promise<string | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a senior automotive technician at Manoj Wheels. Explain calculator results in clear, friendly English under 120 words and end with a recommendation. Never invent measurements.",
          },
          { role: "user", content: `Tool: ${toolName}\n\n${prompt}` },
        ],
      }),
    });
    if (!resp.ok) return null;
    const j = await resp.json();
    return (j?.choices?.[0]?.message?.content as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export const explainResult = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Schema.parse(d))
  .handler(async ({ data }): Promise<AiExplanation> => {
    const or = await callOpenRouter(data.toolName, data.prompt);
    if (or) return { text: or.trim(), confidence: 82, source: "openrouter" };
    const lov = await callLovableAi(data.toolName, data.prompt);
    if (lov) return { text: lov.trim(), confidence: 78, source: "lovable" };
    return {
      text:
        "AI explanation is temporarily unavailable. The calculated values above are still accurate — please use them as guidance and consult our workshop for a physical inspection.",
      confidence: 0,
      source: "fallback",
    };
  });
