import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";
import { Field, Grid2, Headline, Stat, ToolPage } from "@/components/site/ToolLayout";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";
import { AiExplainBlock } from "@/components/site/AiExplainBlock";

export const Route = createFileRoute("/tools/vehicle-running-cost-calculator")({
  head: () => ({
    meta: [
      { title: "Vehicle Running Cost Calculator (Monthly & Yearly) | Manoj Wheels" },
      { name: "description", content: "Calculate total monthly & yearly vehicle running cost — fuel, tyres, insurance and maintenance. Free, India-rupee, instant PDF. Pulivendula." },
      { property: "og:title", content: "Vehicle Running Cost Calculator | Manoj Wheels" },
      { property: "og:description", content: "Monthly & yearly running cost — fuel + tyres + insurance + maintenance." },
      { property: "og:url", content: "https://ai-tyre-vision.lovable.app/tools/vehicle-running-cost-calculator" },
    ],
    links: [{ rel: "canonical", href: "https://ai-tyre-vision.lovable.app/tools/vehicle-running-cost-calculator" }],
  }),
  component: RunningCostTool,
});

function RunningCostTool() {
  const [dailyKm, setDailyKm] = useState(40);
  const [fuelPrice, setFuelPrice] = useState(102);
  const [mileage, setMileage] = useState(16);
  const [insuranceYr, setInsuranceYr] = useState(12000);
  const [maintenanceYr, setMaintenanceYr] = useState(15000);
  const [tyreSetCost, setTyreSetCost] = useState(20000);
  const [tyreLifeKm, setTyreLifeKm] = useState(40000);

  const r = useMemo(() => {
    const monthlyKm = dailyKm * 30;
    const yearlyKm = dailyKm * 365;
    const fuelMonthly = mileage > 0 ? (monthlyKm / mileage) * fuelPrice : 0;
    const fuelYearly = fuelMonthly * 12;
    const tyreCostPerKm = tyreLifeKm > 0 ? tyreSetCost / tyreLifeKm : 0;
    const tyreMonthly = tyreCostPerKm * monthlyKm;
    const tyreYearly = tyreCostPerKm * yearlyKm;
    const insMonthly = insuranceYr / 12;
    const maintMonthly = maintenanceYr / 12;
    const monthly = fuelMonthly + tyreMonthly + insMonthly + maintMonthly;
    const yearly = fuelYearly + tyreYearly + insuranceYr + maintenanceYr;
    const perKm = monthlyKm > 0 ? monthly / monthlyKm : 0;
    return { monthlyKm, yearlyKm, fuelMonthly, fuelYearly, tyreMonthly, tyreYearly, insMonthly, maintMonthly, monthly, yearly, perKm };
  }, [dailyKm, fuelPrice, mileage, insuranceYr, maintenanceYr, tyreSetCost, tyreLifeKm]);

  const fmt = (n: number) => `₹${Math.max(0, Math.round(n)).toLocaleString("en-IN")}`;
  const verdict =
    r.perKm > 12 ? "High cost-per-km — review mileage & tyre choice"
    : r.perKm > 7 ? "Average running cost for India"
    : "Efficient running cost";

  const build = (): SaveToolPayload => ({
    reportType: "running-cost",
    title: "Vehicle Running Cost",
    summary: `${fmt(r.monthly)} / month · ${fmt(r.yearly)} / year`,
    score: 0,
    recommendation: verdict,
    payload: { dailyKm, fuelPrice, mileage, insuranceYr, maintenanceYr, tyreSetCost, tyreLifeKm, ...r },
    pdf: {
      toolName: "Vehicle Running Cost Calculator",
      summary: "Complete running cost — fuel + tyres + insurance + maintenance.",
      headline: fmt(r.monthly),
      headlineLabel: "Monthly running cost",
      recommendation: verdict,
      inputs: [
        { label: "Daily distance", value: `${dailyKm} km` },
        { label: "Mileage", value: `${mileage} km/l` },
        { label: "Fuel price", value: `${fmt(fuelPrice)} / litre` },
        { label: "Tyre set cost", value: `${fmt(tyreSetCost)} / ${tyreLifeKm.toLocaleString()} km` },
        { label: "Insurance (yearly)", value: fmt(insuranceYr) },
        { label: "Maintenance (yearly)", value: fmt(maintenanceYr) },
      ],
      results: [
        { label: "Fuel — monthly", value: fmt(r.fuelMonthly) },
        { label: "Tyre wear — monthly", value: fmt(r.tyreMonthly) },
        { label: "Insurance — monthly", value: fmt(r.insMonthly) },
        { label: "Maintenance — monthly", value: fmt(r.maintMonthly) },
        { label: "Total monthly", value: fmt(r.monthly) },
        { label: "Total yearly", value: fmt(r.yearly) },
        { label: "Cost per km", value: `₹${r.perKm.toFixed(2)}` },
      ],
      notes: [
        "Tyre wear is calculated as (set price ÷ expected life km) × distance driven.",
        "Proper tyre pressure can improve mileage by 3–5%.",
        "Wheel alignment & balancing every 10,000 km extends tyre life.",
      ],
      fileSlug: "running-cost",
    },
  });

  return (
    <ToolPage
      title="Vehicle Running Cost Calculator"
      subtitle="Total monthly & yearly cost — fuel, tyres, insurance, maintenance."
      icon={<Wallet className="w-5 h-5" />}
      buildPayload={build}
      form={
        <>
          <Field label="Daily distance (km)">
            <Input type="number" min={1} max={1000} value={dailyKm}
              onChange={(e) => setDailyKm(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field label="Mileage (km / litre)">
            <Input type="number" min={1} max={60} step={0.5} value={mileage}
              onChange={(e) => setMileage(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field label="Fuel price (₹ / litre)">
            <Input type="number" min={1} max={500} step={0.5} value={fuelPrice}
              onChange={(e) => setFuelPrice(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Grid2>
            <Field label="Tyre set cost (₹)">
              <Input type="number" min={1000} max={500000} value={tyreSetCost}
                onChange={(e) => setTyreSetCost(Math.max(0, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Tyre life (km)">
              <Input type="number" min={5000} max={150000} value={tyreLifeKm}
                onChange={(e) => setTyreLifeKm(Math.max(0, Number(e.target.value) || 0))} />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="Insurance / year (₹)">
              <Input type="number" min={0} max={500000} value={insuranceYr}
                onChange={(e) => setInsuranceYr(Math.max(0, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Maintenance / year (₹)">
              <Input type="number" min={0} max={500000} value={maintenanceYr}
                onChange={(e) => setMaintenanceYr(Math.max(0, Number(e.target.value) || 0))} />
            </Field>
          </Grid2>
        </>
      }
      result={
        <>
          <Headline value={fmt(r.monthly)} label="Total monthly cost" verdict={verdict} />
          <Grid2>
            <Stat label="Yearly total" value={fmt(r.yearly)} />
            <Stat label="Cost per km" value={`₹${r.perKm.toFixed(2)}`} />
            <Stat label="Fuel / month" value={fmt(r.fuelMonthly)} />
            <Stat label="Tyre wear / month" value={fmt(r.tyreMonthly)} />
            <Stat label="Insurance / month" value={fmt(r.insMonthly)} />
            <Stat label="Maintenance / month" value={fmt(r.maintMonthly)} />
          </Grid2>
          <AiExplainBlock
            toolName="Vehicle Running Cost"
            prompt={`Daily ${dailyKm} km, mileage ${mileage} kmpl, fuel ₹${fuelPrice}. Monthly ${fmt(r.monthly)}, yearly ${fmt(r.yearly)}, ₹${r.perKm.toFixed(2)}/km. Suggest 2-3 ways to lower running cost.`}
          />
        </>
      }
    />
  );
}
