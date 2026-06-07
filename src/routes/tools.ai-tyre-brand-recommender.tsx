import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Star, CheckCircle2 } from "lucide-react";
import { Field, Grid2, Headline, ToolPage } from "@/components/site/ToolLayout";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";
import { AiExplainBlock } from "@/components/site/AiExplainBlock";
import { recommendBrands, type RoadType, type UsageType, type VehicleType } from "@/lib/tyre-brands";

export const Route = createFileRoute("/tools/ai-tyre-brand-recommender")({
  head: () => ({
    meta: [
      { title: "AI Tyre Brand Recommender — MRF, Apollo, CEAT, Michelin & more | Manoj Wheels" },
      { name: "description", content: "Get the best tyre brand for your car, budget and road type — MRF, Apollo, CEAT, Michelin, Bridgestone, JK Tyre, Goodyear. Free in Pulivendula." },
      { property: "og:title", content: "AI Tyre Brand Recommender | Manoj Wheels" },
      { property: "og:description", content: "Compare 7 top tyre brands for your vehicle, budget and road type." },
      { property: "og:url", content: "https://ai-tyre-vision.lovable.app/tools/ai-tyre-brand-recommender" },
    ],
    links: [{ rel: "canonical", href: "https://ai-tyre-vision.lovable.app/tools/ai-tyre-brand-recommender" }],
  }),
  component: BrandTool,
});

const RATING = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

function BrandTool() {
  const [vehicleType, setVehicleType] = useState<VehicleType>("sedan");
  const [budget, setBudget] = useState(8000);
  const [roadType, setRoadType] = useState<RoadType>("mixed");
  const [usage, setUsage] = useState<UsageType>("daily");

  const results = useMemo(
    () => recommendBrands({ vehicleType, budget, roadType, usage }),
    [vehicleType, budget, roadType, usage],
  );
  const top = results[0];
  const top3 = results.slice(0, 3);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const build = (): SaveToolPayload => ({
    reportType: "brand-recommender",
    title: "Tyre Brand Recommendation",
    summary: `Top pick: ${top.brand.name} (${top.score}% match)`,
    score: top.score,
    recommendation: `${top.brand.name} — ${top.brand.bestModelExample}`,
    payload: { vehicleType, budget, roadType, usage, top3: top3.map((t) => ({ id: t.brand.id, score: t.score })) },
    pdf: {
      toolName: "AI Tyre Brand Recommender",
      summary: "Specs shown are typical brand-line RANGES from public model pages — not single-model specs.",
      headline: `${top.brand.name}`,
      headlineLabel: `${top.score}% match for your inputs`,
      recommendation: `Suggested model line: ${top.brand.bestModelExample}`,
      inputs: [
        { label: "Vehicle type", value: vehicleType },
        { label: "Budget per tyre", value: fmt(budget) },
        { label: "Road type", value: roadType },
        { label: "Usage", value: usage },
      ],
      results: top3.flatMap((t, i) => [
        { label: `#${i + 1} brand`, value: `${t.brand.name} — ${t.score}%` },
        { label: `  Price band`, value: `${fmt(t.brand.priceMinINR)} – ${fmt(t.brand.priceMaxINR)}` },
        { label: `  Expected life`, value: `${t.brand.lifeMinKm.toLocaleString()} – ${t.brand.lifeMaxKm.toLocaleString()} km` },
        { label: `  Suggested line`, value: t.brand.bestModelExample },
      ]),
      notes: [
        "Brand specs are line-wide ranges from each manufacturer's public model pages and dealer literature — not specific SKU guarantees.",
        "Actual mileage depends on driving style, alignment, balancing and inflation.",
        "Visit Manoj Wheels to confirm exact fitment for your vehicle.",
      ],
      fileSlug: "brand-recommendation",
    },
  });

  return (
    <ToolPage
      title="AI Tyre Brand Recommender"
      subtitle="Best tyre brand for your vehicle, budget and road type."
      icon={<Trophy className="w-5 h-5" />}
      buildPayload={build}
      form={
        <>
          <Grid2>
            <Field label="Vehicle type">
              <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hatchback">Hatchback</SelectItem>
                  <SelectItem value="sedan">Sedan</SelectItem>
                  <SelectItem value="suv">SUV / MUV</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="commercial">Commercial / Taxi</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Budget per tyre (₹)">
              <Input type="number" min={1500} max={50000} step={500} value={budget}
                onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))} />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="Road type">
              <Select value={roadType} onValueChange={(v) => setRoadType(v as RoadType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="highway">Highway</SelectItem>
                  <SelectItem value="village">Village roads</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Usage">
              <Select value={usage} onValueChange={(v) => setUsage(v as UsageType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily commute</SelectItem>
                  <SelectItem value="commercial">Commercial / Taxi</SelectItem>
                  <SelectItem value="long-distance">Long distance</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </Grid2>
          <p className="text-[11px] text-muted-foreground">
            Specs shown are brand-line ranges from each manufacturer's public model pages — not single-model guarantees.
          </p>
        </>
      }
      result={
        <>
          <Headline value={top.brand.name} label={`${top.score}% match`} verdict={top.brand.bestModelExample} />
          <div className="space-y-3">
            {top3.map((t, i) => (
              <div key={t.brand.id} className="rounded-xl border border-border bg-card/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">#{i + 1}</span>
                    <span className="font-bold">{t.brand.name}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{t.brand.origin}</span>
                  </div>
                  <span className="text-sm font-bold text-gradient-primary">{t.score}%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.brand.notes}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <Stat label="Price band" value={`${fmt(t.brand.priceMinINR)}–${fmt(t.brand.priceMaxINR)}`} />
                  <Stat label="Expected life" value={`${t.brand.lifeMinKm/1000}–${t.brand.lifeMaxKm/1000}k km`} />
                  <Stat label="Comfort" value={RATING(t.brand.comfort)} />
                  <Stat label="Durability" value={RATING(t.brand.durability)} />
                  <Stat label="Mileage" value={RATING(t.brand.mileage)} />
                  <Stat label="Grip" value={RATING(t.brand.grip)} />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                  {t.inVehicle && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary"><CheckCircle2 className="w-3 h-3" /> Fits {vehicleType}</span>}
                  {t.inBudget && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 text-gold"><Star className="w-3 h-3" /> In budget</span>}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Suggested model line: <span className="font-semibold text-foreground">{t.brand.bestModelExample}</span>
                </p>
              </div>
            ))}
          </div>
          <AiExplainBlock
            toolName="AI Tyre Brand Recommender"
            prompt={`Driver in Pulivendula, AP. Vehicle: ${vehicleType}, budget ₹${budget}/tyre, road: ${roadType}, usage: ${usage}. Top match: ${top.brand.name} (${top.brand.bestModelExample}). In <100 words explain WHY this brand suits these inputs, and one trade-off to consider. Do not invent numeric specifications.`}
          />
        </>
      }
    />
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/40 border border-border px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-bold">{value}</p>
    </div>
  );
}
