import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wrench } from "lucide-react";
import { Field, Grid2, Headline, Stat, ToolPage } from "@/components/site/ToolLayout";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/service-cost")({
  head: () => ({
    meta: [
      { title: "Tyre Service Cost Estimator (India) | Manoj Wheels" },
      {
        name: "description",
        content:
          "Estimate cost of wheel alignment, balancing, puncture repair, rotation and nitrogen at Manoj Wheels. Per-vehicle pricing.",
      },
    ],
  }),
  component: ServiceTool,
});

type VehicleClass = "hatchback" | "sedan" | "suv" | "muv" | "bike";

// Per-wheel base prices in ₹. (Indicative Manoj Wheels rates.)
const SERVICES: Record<
  string,
  { label: string; perWheel: number; perJob?: number; bikeMultiplier?: number }
> = {
  alignment:  { label: "Wheel alignment (4-wheel)", perWheel: 0, perJob: 700 },
  balancing:  { label: "Wheel balancing", perWheel: 100 },
  puncture:   { label: "Puncture repair", perWheel: 0, perJob: 120 },
  rotation:   { label: "Tyre rotation", perWheel: 0, perJob: 200 },
  nitrogen:   { label: "Nitrogen fill", perWheel: 50 },
  valveStem:  { label: "Valve stem replacement", perWheel: 60 },
};

// Vehicle multipliers vs hatchback baseline (labour & rim size).
const VEHICLE_MULT: Record<VehicleClass, { mult: number; wheels: number; label: string }> = {
  hatchback: { mult: 1.0, wheels: 4, label: "Hatchback" },
  sedan:     { mult: 1.1, wheels: 4, label: "Sedan" },
  suv:       { mult: 1.3, wheels: 4, label: "SUV / Crossover" },
  muv:       { mult: 1.4, wheels: 4, label: "MUV / 7-seater" },
  bike:      { mult: 0.5, wheels: 2, label: "Motorcycle" },
};

function ServiceTool() {
  const [vehicle, setVehicle] = useState<VehicleClass>("sedan");
  const [selected, setSelected] = useState<Record<string, boolean>>({
    alignment: true,
    balancing: true,
    puncture: false,
    rotation: true,
    nitrogen: false,
    valveStem: false,
  });
  const [distanceKm, setDistanceKm] = useState(0); // for pickup/drop

  const result = useMemo(() => {
    const v = VEHICLE_MULT[vehicle];
    const lines: Array<{ label: string; amount: number }> = [];
    let subtotal = 0;
    for (const [key, on] of Object.entries(selected)) {
      if (!on) continue;
      const s = SERVICES[key];
      const base = (s.perJob ?? 0) + s.perWheel * v.wheels;
      const amount = Math.round(base * v.mult);
      lines.push({ label: s.label, amount });
      subtotal += amount;
    }
    // Pickup & drop: ₹15/km after first 5 km free, capped at ₹500.
    const pickupKm = Math.max(0, distanceKm - 5);
    const pickup = Math.min(500, pickupKm * 15);
    if (pickup > 0) lines.push({ label: `Pickup & drop (${distanceKm} km)`, amount: pickup });
    const gst = Math.round((subtotal + pickup) * 0.18);
    const total = subtotal + pickup + gst;
    return { lines, subtotal, gst, pickup, total };
  }, [vehicle, selected, distanceKm]);

  const fmtINR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  const build = (): SaveToolPayload => ({
    reportType: "service-cost",
    title: "Service Cost Estimate",
    summary: `${VEHICLE_MULT[vehicle].label} · Total ${fmtINR(result.total)}`,
    score: 100,
    recommendation: result.total > 0 ? "Estimate generated" : "Select at least one service",
    payload: { vehicle, selected, distanceKm, ...result },
    pdf: {
      toolName: "Service Cost Estimator",
      summary: `Indicative pricing for ${VEHICLE_MULT[vehicle].label.toLowerCase()} at Manoj Wheels.`,
      headline: fmtINR(result.total),
      headlineLabel: "Estimated total (incl. 18% GST)",
      recommendation: result.total > 0 ? "Quoted at counter — bookings confirmed by WhatsApp." : "Select at least one service.",
      inputs: [
        { label: "Vehicle", value: VEHICLE_MULT[vehicle].label },
        { label: "Pickup distance", value: `${distanceKm} km` },
      ],
      results: [
        ...result.lines.map((l) => ({ label: l.label, value: fmtINR(l.amount) })),
        { label: "Subtotal", value: fmtINR(result.subtotal) },
        { label: "GST (18%)", value: fmtINR(result.gst) },
        { label: "Total payable", value: fmtINR(result.total) },
      ],
      notes: [
        "Final pricing may vary based on tyre size, rim type and parts required.",
        "First 5 km of pickup & drop is complimentary; beyond that ₹15/km (max ₹500).",
        "Show this estimate at the counter for the listed prices.",
      ],
      fileSlug: "service-cost",
    },
  });

  return (
    <ToolPage
      title="Service Cost Estimator"
      subtitle="Build a tyre-service estimate in seconds."
      icon={<Wrench className="w-5 h-5" />}
      form={
        <>
          <Field label="Vehicle type">
            <Select value={vehicle} onValueChange={(v) => setVehicle(v as VehicleClass)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(VEHICLE_MULT).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="space-y-2">
            <Label className="text-sm">Services needed</Label>
            <div className="rounded-xl border border-border bg-background/40 p-3 space-y-2">
              {Object.entries(SERVICES).map(([k, s]) => (
                <label key={k} className="flex items-center gap-3 text-sm cursor-pointer">
                  <Checkbox
                    checked={!!selected[k]}
                    onCheckedChange={(c) => setSelected({ ...selected, [k]: !!c })}
                  />
                  <span className="flex-1">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
          <Field label="Pickup & drop distance (km)" hint="Set 0 for self-drop. First 5 km free.">
            <Input
              type="number" min={0} max={50} value={distanceKm}
              onChange={(e) => setDistanceKm(Math.max(0, Number(e.target.value) || 0))}
            />
          </Field>
        </>
      }
      result={
        <>
          <Headline
            value={fmtINR(result.total)}
            label="Estimated total (incl. 18% GST)"
            verdict={result.lines.length > 0 ? `${result.lines.length} item${result.lines.length === 1 ? "" : "s"}` : "No services selected"}
          />
          <div className="rounded-xl border border-border bg-background/40 p-3 space-y-1.5">
            {result.lines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">Select services to see estimate.</p>
            ) : (
              result.lines.map((l, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{l.label}</span>
                  <span className="font-semibold">{fmtINR(l.amount)}</span>
                </div>
              ))
            )}
          </div>
          <Grid2>
            <Stat label="Subtotal" value={fmtINR(result.subtotal)} />
            <Stat label="GST 18%" value={fmtINR(result.gst)} />
          </Grid2>
        </>
      }
      buildPayload={build}
      resultDisabled={result.total === 0}
    />
  );
}
