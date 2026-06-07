import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Fuel } from "lucide-react";
import { Field, Grid2, Headline, Stat, ToolPage } from "@/components/site/ToolLayout";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/fuel-savings-calculator")({
  head: () => ({
    meta: [
      { title: "Fuel Savings Calculator (km/l, ₹) | Manoj Wheels" },
      {
        name: "description",
        content:
          "See how much you save monthly and yearly by improving mileage, switching fuel or driving fewer kilometres. Indian rupee + km/l.",
      },
    ],
  }),
  component: FuelTool,
});

function FuelTool() {
  const [monthlyKm, setMonthlyKm] = useState(1500);
  const [currentKmpl, setCurrentKmpl] = useState(14);
  const [newKmpl, setNewKmpl] = useState(18);
  const [fuelPrice, setFuelPrice] = useState(102); // ₹ / litre

  const result = useMemo(() => {
    // Fuel used per month (litres) = distance / efficiency
    const currentLitres = currentKmpl > 0 ? monthlyKm / currentKmpl : 0;
    const newLitres = newKmpl > 0 ? monthlyKm / newKmpl : 0;
    const litresSaved = Math.max(0, currentLitres - newLitres);
    const currentCost = currentLitres * fuelPrice;
    const newCost = newLitres * fuelPrice;
    const monthlySaving = currentCost - newCost;
    const yearlySaving = monthlySaving * 12;
    const pctSaving = currentCost > 0 ? (monthlySaving / currentCost) * 100 : 0;
    const verdict =
      monthlySaving <= 0
        ? "No saving — try a higher mileage figure"
        : monthlySaving > 2500
        ? "Major savings — well worth it"
        : monthlySaving > 800
        ? "Solid monthly saving"
        : "Small but steady saving";
    return {
      currentLitres,
      newLitres,
      litresSaved,
      currentCost,
      newCost,
      monthlySaving,
      yearlySaving,
      pctSaving,
      verdict,
    };
  }, [monthlyKm, currentKmpl, newKmpl, fuelPrice]);

  const fmtINR = (n: number) =>
    `₹${Math.max(0, Math.round(n)).toLocaleString("en-IN")}`;

  const build = (): SaveToolPayload => ({
    reportType: "fuel-savings",
    title: "Fuel Savings Estimate",
    summary: `${fmtINR(result.monthlySaving)} / month · ${fmtINR(result.yearlySaving)} / year`,
    score: Math.min(100, Math.round(result.pctSaving)),
    recommendation: result.verdict,
    payload: { monthlyKm, currentKmpl, newKmpl, fuelPrice, ...result },
    pdf: {
      toolName: "Fuel Savings Calculator",
      summary:
        "Monthly & yearly fuel savings from improving your mileage or driving distance.",
      headline: fmtINR(result.yearlySaving),
      headlineLabel: "Estimated yearly savings",
      recommendation: result.verdict,
      inputs: [
        { label: "Monthly distance", value: `${monthlyKm.toLocaleString()} km` },
        { label: "Current mileage", value: `${currentKmpl} km/l` },
        { label: "New mileage", value: `${newKmpl} km/l` },
        { label: "Fuel price", value: fmtINR(fuelPrice) + " / litre" },
      ],
      results: [
        { label: "Current monthly fuel", value: `${result.currentLitres.toFixed(1)} L · ${fmtINR(result.currentCost)}` },
        { label: "New monthly fuel", value: `${result.newLitres.toFixed(1)} L · ${fmtINR(result.newCost)}` },
        { label: "Litres saved per month", value: `${result.litresSaved.toFixed(1)} L` },
        { label: "Monthly saving", value: fmtINR(result.monthlySaving) },
        { label: "Yearly saving", value: fmtINR(result.yearlySaving) },
        { label: "% saving", value: `${result.pctSaving.toFixed(1)}%` },
      ],
      notes: [
        "Correct tyre pressure alone can improve mileage by 3–5%.",
        "Wheel alignment & balancing every 10,000 km extends tyre life and saves fuel.",
        "Aggressive acceleration can reduce mileage by up to 30% in city traffic.",
      ],
      fileSlug: "fuel-savings",
    },
  });

  return (
    <ToolPage
      title="Fuel Savings Calculator"
      subtitle="See how much you save by improving mileage."
      icon={<Fuel className="w-5 h-5" />}
      form={
        <>
          <Field label="Monthly distance (km)">
            <Input type="number" min={50} max={20000} value={monthlyKm}
              onChange={(e) => setMonthlyKm(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field label="Current mileage (km / litre)">
            <Input type="number" min={1} max={60} step={0.5} value={currentKmpl}
              onChange={(e) => setCurrentKmpl(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field label="New / target mileage (km / litre)">
            <Input type="number" min={1} max={60} step={0.5} value={newKmpl}
              onChange={(e) => setNewKmpl(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field label="Fuel price (₹ / litre)">
            <Input type="number" min={1} max={500} step={0.5} value={fuelPrice}
              onChange={(e) => setFuelPrice(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
        </>
      }
      result={
        <>
          <Headline
            value={fmtINR(result.monthlySaving)}
            label="Monthly savings"
            verdict={result.verdict}
          />
          <Grid2>
            <Stat label="Yearly savings" value={fmtINR(result.yearlySaving)} />
            <Stat label="Litres saved / month" value={result.litresSaved.toFixed(1)} />
            <Stat label="Current monthly cost" value={fmtINR(result.currentCost)} />
            <Stat label="New monthly cost" value={fmtINR(result.newCost)} />
          </Grid2>
        </>
      }
      buildPayload={build}
    />
  );
}
