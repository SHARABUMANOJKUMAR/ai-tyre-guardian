import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map } from "lucide-react";
import { Field, Headline, Stat, Grid2, ToolPage } from "@/components/site/ToolLayout";
import { AiExplainBlock } from "@/components/site/AiExplainBlock";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/road-trip-safety")({
  head: () => ({
    meta: [
      { title: "Road Trip Tyre Safety Checker | Manoj Wheels" },
      {
        name: "description",
        content:
          "Score your tyre readiness for an upcoming road trip — checks age, distance, load and condition.",
      },
    ],
  }),
  component: RoadTripTool,
});

function RoadTripTool() {
  const [destination, setDestination] = useState("Hyderabad");
  const [distance, setDistance] = useState(450);
  const [vehicle, setVehicle] = useState("sedan");
  const [ageMonths, setAgeMonths] = useState(30);
  const [condition, setCondition] = useState("good");
  const [passengers, setPassengers] = useState(4);

  const result = useMemo(() => {
    // Penalty system — higher penalty = worse score.
    let p = 0;
    if (ageMonths >= 72) p += 35;
    else if (ageMonths >= 48) p += 20;
    else if (ageMonths >= 24) p += 8;

    if (distance >= 1000) p += 25;
    else if (distance >= 500) p += 15;
    else if (distance >= 250) p += 7;

    if (condition === "worn") p += 30;
    else if (condition === "fair") p += 12;

    if (passengers >= 6) p += 15;
    else if (passengers >= 4) p += 5;

    if (vehicle === "twowheeler") p += 5;

    const score = Math.max(0, Math.min(100, 100 - p));
    const level: "Excellent" | "Good" | "Caution" | "Unsafe" =
      score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Caution" : "Unsafe";

    const checks: string[] = [];
    if (distance >= 250) checks.push("Cold tyre pressure check (all 4 + spare)");
    if (distance >= 500) checks.push("Wheel alignment + balancing within last 5,000 km");
    if (ageMonths >= 48) checks.push("Sidewall crack inspection (age-related)");
    if (condition !== "good") checks.push("Tread depth measurement at 3 points per tyre");
    if (passengers >= 4) checks.push("Verify load index supports total vehicle weight");
    if (!checks.length) checks.push("Quick visual inspection at the workshop");

    const services: string[] = [];
    if (condition === "worn" || score < 50) services.push("Tyre replacement before trip");
    if (distance >= 500) services.push("Pre-trip wheel alignment");
    services.push("Nitrogen refill for stable pressure");

    const verdict =
      level === "Unsafe" ? "Do not start the trip without workshop service"
      : level === "Caution" ? "Get pre-trip service this week"
      : level === "Good" ? "Trip is feasible — complete the checks below"
      : "Tyres are road-trip ready";

    return { score, level, checks, services, verdict };
  }, [distance, vehicle, ageMonths, condition, passengers]);

  const aiPrompt = `Trip to ${destination}, distance ${distance} km, vehicle ${vehicle}, tyre age ${ageMonths} months, condition ${condition}, passengers ${passengers}. Calculated safety score: ${result.score}/100 (${result.level}). Required checks: ${result.checks.join("; ")}. Recommended services: ${result.services.join("; ")}. Give a short pre-trip recommendation and any extra precautions for long-distance driving in India.`;

  const build = (): SaveToolPayload => ({
    reportType: "road-trip",
    title: `Road Trip — ${destination}`,
    summary: `${distance} km · ${result.level} safety`,
    score: result.score,
    recommendation: result.verdict,
    payload: { destination, distance, vehicle, ageMonths, condition, passengers, ...result },
    pdf: {
      toolName: "Road Trip Tyre Safety Checker",
      summary: `Pre-trip tyre readiness for ${destination} (${distance} km).`,
      headline: `${result.score}/100`,
      headlineLabel: `${result.level} safety`,
      recommendation: result.verdict,
      inputs: [
        { label: "Destination", value: destination },
        { label: "Distance", value: `${distance} km` },
        { label: "Vehicle", value: vehicle },
        { label: "Tyre age", value: `${ageMonths} months` },
        { label: "Current condition", value: condition },
        { label: "Passenger count", value: String(passengers) },
      ],
      results: [
        { label: "Trip safety score", value: `${result.score}/100` },
        { label: "Safety level", value: result.level },
        ...result.checks.map((c, i) => ({ label: `Check ${i + 1}`, value: c })),
        ...result.services.map((s, i) => ({ label: `Service ${i + 1}`, value: s })),
      ],
      notes: [
        "Always carry a serviceable spare tyre and inflator on long trips.",
        "Re-check cold tyre pressure every 4-5 hours of driving.",
        "Indian highway speed limits assume road-worthy tyres — under-inflation increases blowout risk above 100 kph.",
      ],
      fileSlug: "road-trip",
    },
  });

  return (
    <ToolPage
      title="Road Trip Tyre Safety"
      subtitle="Plan your trip with a tyre-safety readiness score."
      icon={<Map className="w-5 h-5" />}
      form={
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Destination">
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
            </Field>
            <Field label="Distance (km)">
              <Input type="number" min={10} max={5000} value={distance} onChange={(e) => setDistance(Math.max(0, Number(e.target.value) || 0))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle">
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
            <Field label="Passengers">
              <Input type="number" min={1} max={8} value={passengers} onChange={(e) => setPassengers(Math.max(1, Number(e.target.value) || 1))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tyre age (months)">
              <Input type="number" min={0} max={120} value={ageMonths} onChange={(e) => setAgeMonths(Math.max(0, Number(e.target.value) || 0))} />
            </Field>
            <Field label="Current condition">
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
        </>
      }
      result={
        <>
          <Headline value={`${result.score}/100`} label={`${result.level} trip safety`} verdict={result.verdict} />
          <Grid2>
            <Stat label="Distance" value={`${distance} km`} />
            <Stat label="Safety level" value={result.level} />
          </Grid2>
          <div className="rounded-xl border border-border p-3 bg-background/40">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Required checks</p>
            <ul className="mt-1.5 text-sm space-y-1 list-disc pl-5">
              {result.checks.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>
          <div className="rounded-xl border border-border p-3 bg-background/40">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Recommended services</p>
            <ul className="mt-1.5 text-sm space-y-1 list-disc pl-5">
              {result.services.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <AiExplainBlock toolName="Road Trip Tyre Safety" prompt={aiPrompt} />
        </>
      }
      buildPayload={build}
    />
  );
}
