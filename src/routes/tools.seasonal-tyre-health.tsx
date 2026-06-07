import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloudSun, Loader2 } from "lucide-react";
import { Field, Headline, Stat, Grid2, ToolPage } from "@/components/site/ToolLayout";
import { AiExplainBlock } from "@/components/site/AiExplainBlock";
import { getWeather, type WeatherSnapshot } from "@/lib/weather.functions";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/seasonal-tyre-health")({
  head: () => ({
    meta: [
      { title: "Seasonal Tyre Health Checker | Manoj Wheels" },
      {
        name: "description",
        content:
          "Live local weather feeds into a seasonal tyre health risk score — rain, heat and humidity all affect grip and pressure.",
      },
    ],
  }),
  component: SeasonalTool,
});

function SeasonalTool() {
  const [location, setLocation] = useState("Pulivendula");
  const [condition, setCondition] = useState("good");
  const [vehicle, setVehicle] = useState("sedan");
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fetchWx = useServerFn(getWeather);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const w = await fetchWx({ data: { location } });
      setWeather(w);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load weather");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }

  const score = (() => {
    if (!weather) return 0;
    let r = 0;
    if (weather.tempC >= 38) r += 30;
    else if (weather.tempC >= 32) r += 18;
    else if (weather.tempC <= 5) r += 25;
    if (weather.rainMm > 5) r += 25;
    else if (weather.rainMm > 0) r += 12;
    if (weather.humidity >= 80) r += 10;
    if (condition === "worn") r += 25;
    else if (condition === "fair") r += 10;
    if (vehicle === "twowheeler") r += 10;
    return Math.min(100, r);
  })();

  const level: "Low" | "Medium" | "High" =
    score <= 30 ? "Low" : score <= 65 ? "Medium" : "High";

  const recommendations = (() => {
    if (!weather) return [];
    const list: string[] = [];
    if (weather.tempC >= 32) list.push("Switch to nitrogen filling — stays cooler than air");
    if (weather.tempC >= 38) list.push("Drop pressure by 1-2 PSI to allow for heat expansion");
    if (weather.tempC <= 10) list.push("Add 1-2 PSI in winter — cold air contracts");
    if (weather.rainMm > 0) list.push("Verify tread depth ≥ 3 mm for wet grip");
    if (weather.humidity >= 80) list.push("Inspect rims for moisture-induced corrosion");
    if (condition !== "good") list.push("Schedule a workshop inspection within 7 days");
    if (!list.length) list.push("Tyres are in a good seasonal window — routine checks only");
    return list;
  })();

  const verdict =
    level === "Low" ? "Conditions are favourable for current tyres"
    : level === "Medium" ? "Pre-emptive checks recommended"
    : "Active risk — service before long trips";

  const aiPrompt = weather
    ? `Location: ${weather.city}. Temperature: ${weather.tempC}°C, feels like ${weather.feelsLikeC}°C. Weather: ${weather.weather} (${weather.description}). Humidity: ${weather.humidity}%. Rain in last hour: ${weather.rainMm} mm. Vehicle: ${vehicle}. Tyre condition: ${condition}. Calculated seasonal risk score: ${score}/100 (${level}). Explain how today's weather affects tyre safety and recommend 2-3 actions.`
    : "";

  const build = (): SaveToolPayload => ({
    reportType: "seasonal-tyre",
    title: "Seasonal Tyre Health",
    summary: weather ? `${weather.city} · ${weather.tempC}°C · ${level} risk` : "—",
    score,
    recommendation: verdict,
    payload: { location, condition, vehicle, weather, score, level, recommendations },
    pdf: {
      toolName: "Seasonal Tyre Health Checker",
      summary: weather ? `Live weather for ${weather.city} factored into a seasonal risk score.` : "Live weather risk assessment.",
      headline: `${score}/100`,
      headlineLabel: `${level} weather risk`,
      recommendation: verdict,
      inputs: [
        { label: "Location", value: location },
        { label: "Vehicle", value: vehicle },
        { label: "Current tyre condition", value: condition },
        ...(weather
          ? [
              { label: "Weather", value: `${weather.weather} (${weather.description})` },
              { label: "Temperature", value: `${weather.tempC}°C (feels ${weather.feelsLikeC}°C)` },
              { label: "Humidity", value: `${weather.humidity}%` },
              { label: "Rain (last hour)", value: `${weather.rainMm} mm` },
              { label: "Wind", value: `${weather.windKph} kph` },
            ]
          : []),
      ],
      results: [
        { label: "Seasonal risk score", value: `${score}/100` },
        { label: "Risk level", value: level },
        ...recommendations.map((r, i) => ({ label: `Action ${i + 1}`, value: r })),
      ],
      notes: [
        "Weather data is live from OpenWeather and refreshes on each lookup.",
        "Heat raises tyre pressure ~1 PSI per 5°C — re-check on hot days.",
      ],
      fileSlug: "seasonal-tyre",
    },
  });

  return (
    <ToolPage
      title="Seasonal Tyre Health Checker"
      subtitle="Live weather + tyre condition = seasonal risk score."
      icon={<CloudSun className="w-5 h-5" />}
      form={
        <>
          <Field label="Location (city)">
            <div className="flex gap-2">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Pulivendula" />
              <Button onClick={load} variant="hero" disabled={loading || !location.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch weather"}
              </Button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle">
              <Select value={vehicle} onValueChange={setVehicle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hatchback">Hatchback</SelectItem>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="twowheeler">Two-wheeler</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Current tyre condition">
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="worn">Worn</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          {err && <p className="text-sm text-primary">{err}</p>}
          {weather && (
            <div className="rounded-xl border border-border bg-background/40 p-3 text-sm">
              <p className="font-bold">
                {weather.city}{weather.country ? `, ${weather.country}` : ""}
              </p>
              <p className="text-muted-foreground capitalize">{weather.description}</p>
            </div>
          )}
        </>
      }
      result={
        <>
          {!weather ? (
            <div className="rounded-xl border border-border bg-background/40 p-6 text-sm text-muted-foreground">
              Enter a location and click <span className="font-semibold">Fetch weather</span> to start.
            </div>
          ) : (
            <>
              <Headline value={`${score}/100`} label={`${level} weather risk`} verdict={verdict} />
              <Grid2>
                <Stat label="Temperature" value={`${weather.tempC}°C`} />
                <Stat label="Feels like" value={`${weather.feelsLikeC}°C`} />
                <Stat label="Humidity" value={`${weather.humidity}%`} />
                <Stat label="Rain (1h)" value={`${weather.rainMm} mm`} />
              </Grid2>
              <div className="rounded-xl border border-border p-3 bg-background/40">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Recommendations</p>
                <ul className="mt-1.5 text-sm space-y-1 list-disc pl-5">
                  {recommendations.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
              <AiExplainBlock toolName="Seasonal Tyre Health" prompt={aiPrompt} />
            </>
          )}
        </>
      }
      resultDisabled={!weather}
      buildPayload={build}
    />
  );
}
