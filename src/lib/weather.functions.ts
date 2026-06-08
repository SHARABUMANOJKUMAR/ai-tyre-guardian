import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

const Schema = z.object({
  location: z.string().trim().min(2).max(80),
});

export interface WeatherSnapshot {
  city: string;
  country: string;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  rainMm: number;
  weather: string;
  description: string;
  windKph: number;
}

// Simple in-memory IP rate limiter: 10 requests / minute per IP.
const RL_MAX = 10;
const RL_WINDOW_MS = 60_000;
const rlBuckets = new Map<string, number[]>();
function rateLimit(ip: string) {
  const now = Date.now();
  const arr = (rlBuckets.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  if (arr.length >= RL_MAX) return false;
  arr.push(now);
  rlBuckets.set(ip, arr);
  // Opportunistic cleanup
  if (rlBuckets.size > 500) {
    for (const [k, v] of rlBuckets) {
      if (!v.length || now - v[v.length - 1] > RL_WINDOW_MS) rlBuckets.delete(k);
    }
  }
  return true;
}

export const getWeather = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Schema.parse(d))
  .handler(async ({ data }): Promise<WeatherSnapshot> => {
    const ip =
      (getRequestHeader("cf-connecting-ip") ||
        getRequestHeader("x-forwarded-for")?.split(",")[0].trim() ||
        getRequestHeader("x-real-ip") ||
        "unknown") as string;
    if (!rateLimit(ip)) {
      throw new Error("Too many weather requests. Please wait a minute and try again.");
    }

    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) throw new Error("Weather service not configured");
    const u = new URL("https://api.openweathermap.org/data/2.5/weather");
    u.searchParams.set("q", data.location);
    u.searchParams.set("units", "metric");
    u.searchParams.set("appid", key);
    const resp = await fetch(u);
    if (!resp.ok) {
      if (resp.status === 404) throw new Error("Location not found");
      throw new Error(`Weather lookup failed (${resp.status})`);
    }
    const j = await resp.json();
    return {
      city: j.name ?? data.location,
      country: j.sys?.country ?? "",
      tempC: Math.round(j.main?.temp ?? 0),
      feelsLikeC: Math.round(j.main?.feels_like ?? 0),
      humidity: j.main?.humidity ?? 0,
      rainMm: j.rain?.["1h"] ?? j.rain?.["3h"] ?? 0,
      weather: j.weather?.[0]?.main ?? "Clear",
      description: j.weather?.[0]?.description ?? "",
      windKph: Math.round((j.wind?.speed ?? 0) * 3.6),
    };
  });
