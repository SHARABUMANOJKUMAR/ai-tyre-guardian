import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timer } from "lucide-react";
import { Field, Headline, Stat, Grid2, ToolPage } from "@/components/site/ToolLayout";
import { AiExplainBlock } from "@/components/site/AiExplainBlock";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/tyre-life-predictor")({
  head: () => ({
    meta: [
      { title: "Tyre Life Predictor (km & months) | Manoj Wheels" },
      {
        name: "description",
        content:
          "Estimate remaining tyre life in km and months from current tread depth, age and driving style.",
      },
    ],
  }),
  component: TyreLifeTool,
});

// Typical new-tyre tread depth ~8mm, legal minimum 1.6mm in India.
const NEW_TREAD = 8;
const LEGAL_MIN = 1.6;

// Base life expectancy (km) by vehicle class.
const BASE_LIFE: Record<string, number> = {
  hatchback: 50000,
  sedan: 55000,
  suv: 60000,
  pickup: 45000,
  twowheeler: 35000,
};

const ROAD_FACTOR: Record<string, number> = {
  city: 0.85,
  highway: 1.1,
  mixed: 1.0,
  rough: 0.7,
};

const STYLE_FACTOR: Record<string, number> = {
  smooth: 1.1,
  normal: 1.0,
  aggressive: 0.75,
};

function TyreLifeTool() {
  const [vehicle, setVehicle] = useState("sedan");
  const [brand, setBrand] = useState("MRF");
  const [kmDriven, setKmDriven] = useState(25000);
  const [road, setRoad] = useState("mixed");
  const [style, setStyle] = useState("normal");
  const [ageMonths, setAgeMonths] = useState(24);
  const [tread, setTread] = useState(5);

  const result = useMemo(() => {
    const base = BASE_LIFE[vehicle] ?? 50000;
    const expected = base * (ROAD_FACTOR[road] ?? 1) * (STYLE_FACTOR[style] ?? 1);
    // Linear tread model — remaining life proportional to remaining usable tread.
    const usable = Math.max(0, tread - LEGAL_MIN);
    const fresh = Math.max(0.1, NEW_TREAD - LEGAL_MIN);
    const treadRatio = Math.min(1, usable / fresh);
    const remainingKmByTread = Math.round(expected * treadRatio);
    // Cap by age — most tyres should be replaced by 6 years (72 months).
    const ageCapMonths = Math.max(0, 72 - ageMonths);
    // Compare with km-based wear: remaining km from km driven
    const remainingByKm = Math.max(0, expected - kmDriven);
    const remainingKm = Math.round(Math.min(remainingKmByTread, remainingByKm));
    // Months remaining: assume 1500 km/month average if we don't know, but we do.
    const monthlyKm = kmDriven > 0 && ageMonths > 0 ? kmDriven / ageMonths : 1200;
    const monthsByKm = monthlyKm > 0 ? Math.floor(remainingKm / monthlyKm) : 0;
    const remainingMonths = Math.min(monthsByKm, ageCapMonths);
    const wearPct = Math.round((1 - treadRatio) * 100);
    let rating: "Excellent" | "Good" | "Fair" | "Replace soon" | "Replace now";
    if (tread < LEGAL_MIN + 0.4 || ageMonths >= 72) rating = "Replace now";
    else if (treadRatio < 0.25) rating = "Replace soon";
    else if (treadRatio < 0.5) rating = "Fair";
    else if (treadRatio < 0.8) rating = "Good";
    else rating = "Excellent";
    const verdict =
      rating === "Replace now"
        ? "Replace immediately — unsafe"
        : rating === "Replace soon"
        ? "Plan replacement in the next 1-2 months"
        : `Continue using — ${remainingKm.toLocaleString()} km of life remaining`;
    return { remainingKm, remainingMonths, wearPct, rating, verdict, expectedLife: Math.round(expected) };
  }, [vehicle, kmDriven, road, style, ageMonths, tread]);

  const aiPrompt = `Vehicle: ${vehicle}, brand: ${brand}, km driven: ${kmDriven}, road: ${road}, style: ${style}, age: ${ageMonths} months, current tread depth: ${tread} mm (new = 8mm, legal min = 1.6mm). Calculated: remaining life ${result.remainingKm} km / ${result.remainingMonths} months, wear ${result.wearPct}%, rating ${result.rating}. Briefly explain why life is reduced and recommend driving/maintenance changes.`;

  const build = (): SaveToolPayload => ({
    reportType: "tyre-life",
    title: "Tyre Life Prediction",
    summary: `${result.remainingKm.toLocaleString()} km remaining · ${result.rating}`,
    score: Math.max(0, 100 - result.wearPct),
    recommendation: result.verdict,
    payload: { vehicle, brand, kmDriven, road, style, ageMonths, tread, ...result },
    pdf: {
      toolName: "Tyre Life Predictor",
      summary: "Estimated remaining tyre life in km and months.",
      headline: `${result.remainingKm.toLocaleString()} km`,
      headlineLabel: "Estimated remaining life",
      recommendation: result.verdict,
      inputs: [
        { label: "Vehicle type", value: vehicle },
        { label: "Tyre brand", value: brand },
        { label: "Km driven on these tyres", value: `${kmDriven.toLocaleString()} km` },
        { label: "Road conditions", value: road },
        { label: "Driving style", value: style },
        { label: "Tyre age", value: `${ageMonths} months` },
        { label: "Current tread depth", value: `${tread} mm` },
      ],
      results: [
        { label: "Remaining life", value: `${result.remainingKm.toLocaleString()} km` },
        { label: "Remaining months", value: `${result.remainingMonths} months` },
        { label: "Wear %", value: `${result.wearPct}%` },
        { label: "Rating", value: result.rating },
        { label: "Expected total life for this setup", value: `${result.expectedLife.toLocaleString()} km` },
      ],
      notes: [
        "Tyres older than 6 years should be replaced regardless of remaining tread.",
        "Rotate tyres every 8,000-10,000 km for even wear.",
        "Maintain correct cold pressure to extend tyre life by up to 20%.",
      ],
      fileSlug: "tyre-life",
    },
  });

  return (
    <ToolPage
      title="Tyre Life Predictor"
      subtitle="Estimate remaining life in km and months."
      icon={<Timer className="w-5 h-5" />}
      form={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle type">
              <Select value={vehicle} onValueChange={setVehicle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hatchback">Hatchback</SelectItem>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="twowheeler">Two-wheeler</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tyre brand">
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
            </Field>
          </div>
          <Field label="Km driven on these tyres">
            <Input type="number" min={0} value={kmDriven} onChange={(e) => setKmDriven(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Road conditions">
              <Select value={road} onValueChange={setRoad}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="city">City (stop-go)</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="highway">Highway</SelectItem>
                  <SelectItem value="rough">Rough / unpaved</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Driving style">
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="smooth">Smooth</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tyre age (months)">
              <Input type="number" min={0} max={120} value={ageMonths} onChange={(e) => setAgeMonths(Math.max(0, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Current tread depth (mm)" hint="Legal min 1.6 mm · New ≈ 8 mm">
              <Input type="number" min={0} max={10} step={0.1} value={tread} onChange={(e) => setTread(Math.max(0, Number(e.target.value) || 0))} />
            </Field>
          </div>
        </>
      }
      result={
        <>
          <Headline
            value={`${result.remainingKm.toLocaleString()} km`}
            label={`Remaining life · ${result.rating}`}
            verdict={result.verdict}
          />
          <Grid2>
            <Stat label="Remaining months" value={`${result.remainingMonths}`} />
            <Stat label="Wear %" value={`${result.wearPct}%`} />
            <Stat label="Expected total life" value={`${result.expectedLife.toLocaleString()} km`} />
            <Stat label="Tread remaining" value={`${tread} mm`} />
          </Grid2>
          <AiExplainBlock toolName="Tyre Life Predictor" prompt={aiPrompt} />
        </>
      }
      buildPayload={build}
    />
  );
}
