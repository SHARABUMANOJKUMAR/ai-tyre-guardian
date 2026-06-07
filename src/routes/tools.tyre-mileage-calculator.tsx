import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gauge } from "lucide-react";
import { Field, Grid2, Headline, Stat, ToolPage } from "@/components/site/ToolLayout";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/tyre-mileage-calculator")({
  head: () => ({
    meta: [
      { title: "Tyre Mileage Calculator | Manoj Wheels" },
      {
        name: "description",
        content:
          "Estimate remaining tyre life in kilometres from current tread depth and driving habits. Free, accurate, with PDF download and history.",
      },
    ],
  }),
  component: MileageTool,
});

const LEGAL_MIN_MM = 1.6;
const NEW_TYRE_MM = 8;

// Average km per 1 mm of tread wear by driving style
// (industry averages — Michelin/Bridgestone consumer guidance).
const KM_PER_MM: Record<string, number> = {
  city: 4500,
  mixed: 6000,
  highway: 8000,
};

function MileageTool() {
  const [currentMm, setCurrentMm] = useState(5);
  const [monthlyKm, setMonthlyKm] = useState(1500);
  const [style, setStyle] = useState<keyof typeof KM_PER_MM>("mixed");

  const result = useMemo(() => {
    const usableMm = Math.max(0, currentMm - LEGAL_MIN_MM);
    const remainingKm = Math.round(usableMm * KM_PER_MM[style]);
    const monthsLeft = monthlyKm > 0 ? remainingKm / monthlyKm : 0;
    const wearPct = Math.min(
      100,
      Math.max(0, ((NEW_TYRE_MM - currentMm) / (NEW_TYRE_MM - LEGAL_MIN_MM)) * 100),
    );
    const verdict =
      currentMm <= LEGAL_MIN_MM
        ? "Replace immediately — below legal limit"
        : currentMm < 3
        ? "Plan replacement soon"
        : currentMm < 5
        ? "Monitor — half life remaining"
        : "Safe to use";
    return { remainingKm, monthsLeft, wearPct, verdict };
  }, [currentMm, monthlyKm, style]);

  const build = (): SaveToolPayload => ({
    reportType: "tyre-mileage",
    title: "Tyre Mileage Estimate",
    summary: `${result.remainingKm.toLocaleString()} km remaining · ${result.verdict}`,
    score: Math.round(100 - result.wearPct),
    recommendation: result.verdict,
    payload: { currentMm, monthlyKm, style, ...result },
    pdf: {
      toolName: "Tyre Mileage Calculator",
      summary:
        "Estimated remaining tyre life based on current tread depth and your driving pattern.",
      headline: `${result.remainingKm.toLocaleString()} km`,
      headlineLabel: "Estimated remaining life",
      recommendation: result.verdict,
      inputs: [
        { label: "Current tread depth", value: `${currentMm.toFixed(1)} mm` },
        { label: "Monthly running", value: `${monthlyKm.toLocaleString()} km` },
        { label: "Driving style", value: style.charAt(0).toUpperCase() + style.slice(1) },
      ],
      results: [
        { label: "Tread wear", value: `${result.wearPct.toFixed(0)}%` },
        { label: "Remaining kilometres", value: `${result.remainingKm.toLocaleString()} km` },
        { label: "Months until replacement", value: `${result.monthsLeft.toFixed(1)} months` },
      ],
      notes: [
        "Legal minimum tread depth in India is 1.6 mm.",
        "Highway driving extends tyre life vs. stop-and-go city traffic.",
        "Rotate tyres every 8–10,000 km and check alignment yearly for even wear.",
      ],
      fileSlug: "tyre-mileage",
    },
  });

  return (
    <ToolPage
      title="Tyre Mileage Calculator"
      subtitle="Predict remaining tyre life from your current tread depth."
      icon={<Gauge className="w-5 h-5" />}
      form={
        <>
          <Field
            label={`Current tread depth: ${currentMm.toFixed(1)} mm`}
            hint="New tyres are usually 8 mm; legal minimum is 1.6 mm."
          >
            <Input
              type="range"
              min={1.6}
              max={8}
              step={0.1}
              value={currentMm}
              onChange={(e) => setCurrentMm(Number(e.target.value))}
            />
          </Field>
          <Field label="Monthly distance (km)">
            <Input
              type="number"
              min={50}
              max={20000}
              value={monthlyKm}
              onChange={(e) => setMonthlyKm(Math.max(0, Number(e.target.value) || 0))}
            />
          </Field>
          <Field label="Driving style">
            <Select value={style} onValueChange={(v) => setStyle(v as keyof typeof KM_PER_MM)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="city">Mostly city</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="highway">Mostly highway</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </>
      }
      result={
        <>
          <Headline
            value={`${result.remainingKm.toLocaleString()} km`}
            label="Estimated remaining life"
            verdict={result.verdict}
          />
          <div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tread wear</span>
              <span>{result.wearPct.toFixed(0)}%</span>
            </div>
            <Progress value={result.wearPct} className="mt-2" />
          </div>
          <Grid2>
            <Stat label="Months until replacement" value={result.monthsLeft.toFixed(1)} />
            <Stat label="Driving style" value={style.charAt(0).toUpperCase() + style.slice(1)} />
          </Grid2>
        </>
      }
      buildPayload={build}
    />
  );
}
