import { createServerFn } from "@tanstack/react-start";
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

export const getWeather = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Schema.parse(d))
  .handler(async ({ data }): Promise<WeatherSnapshot> => {
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
