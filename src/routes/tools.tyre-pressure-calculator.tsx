import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wind } from "lucide-react";
import { Field, Grid2, Headline, Stat, ToolPage } from "@/components/site/ToolLayout";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/tyre-pressure-calculator")({
  head: () => ({
    meta: [
      { title: "Tyre Pressure Calculator (PSI / kPa / Bar) | Manoj Wheels" },
      {
        name: "description",
        content:
          "Get recommended tyre pressure based on your vehicle, load and driving conditions. Converts PSI, kPa and Bar instantly.",
      },
    ],
  }),
  component: PressureTool,
});

type VehicleType = "hatchback" | "sedan" | "suv" | "muv" | "bike";

// Manufacturer baseline pressures (PSI, cold) by vehicle class — front/rear.
const BASE: Record<VehicleType, { front: number; rear: number; label: string }> = {
  hatchback: { front: 30, rear: 30, label: "Hatchback" },
  sedan:     { front: 32, rear: 32, label: "Sedan" },
  suv:       { front: 33, rear: 35, label: "SUV / Crossover" },
  muv:       { front: 35, rear: 38, label: "MUV / 7-seater" },
  bike:      { front: 28, rear: 32, label: "Motorcycle" },
};

function PressureTool() {
  const [vehicle, setVehicle] = useState<VehicleType>("sedan");
  const [load, setLoad] = useState<"light" | "full" | "max">("light");
  const [highway, setHighway] = useState(false);
  const [ambientC, setAmbientC] = useState(30);

  const result = useMemo(() => {
    const base = BASE[vehicle];
    // Load adjustment: +0 for light, +2 PSI for full, +4 PSI for max load (rear gets +1 extra).
    const loadFront = load === "light" ? 0 : load === "full" ? 2 : 4;
    const loadRear = loadFront + (load === "max" ? 1 : 0);
    // Highway sustained-speed adjustment: +3 PSI (per Michelin/Bridgestone guidance).
    const hwy = highway ? 3 : 0;
    // Temperature compensation: tyre pressure changes ~1 PSI per 10°F (≈5.5°C).
    // Manufacturer baseline assumes ~20°C cold; warmer ambient slightly raises cold-set pressure required.
    const tempAdj = (ambientC - 20) / 5.5; // PSI delta vs baseline
    const front = Math.round((base.front + loadFront + hwy + tempAdj) * 10) / 10;
    const rear = Math.round((base.rear + loadRear + hwy + tempAdj) * 10) / 10;

    const verdict =
      load === "max"
        ? "Max-load setting — re-check after trip"
        : highway
        ? "Highway-spec — measure cold before departure"
        : "Daily-use setting — check weekly when cold";

    return { front, rear, verdict };
  }, [vehicle, load, highway, ambientC]);

  const build = (): SaveToolPayload => ({
    reportType: "tyre-pressure",
    title: "Recommended Tyre Pressure",
    summary: `${BASE[vehicle].label} · F ${result.front} PSI / R ${result.rear} PSI`,
    score: 100,
    recommendation: result.verdict,
    payload: { vehicle, load, highway, ambientC, ...result },
    pdf: {
      toolName: "Tyre Pressure Calculator",
      summary: `Cold-set recommendation for ${BASE[vehicle].label.toLowerCase()}.`,
      headline: `${result.front} / ${result.rear} PSI`,
      headlineLabel: "Front / Rear",
      recommendation: result.verdict,
      inputs: [
        { label: "Vehicle", value: BASE[vehicle].label },
        { label: "Load condition", value: load === "light" ? "1–2 occupants" : load === "full" ? "Family + luggage" : "Max load" },
        { label: "Sustained highway use", value: highway ? "Yes" : "No" },
        { label: "Ambient temperature", value: `${ambientC} °C` },
      ],
      results: [
        { label: "Front (PSI)", value: result.front.toFixed(1) },
        { label: "Rear (PSI)", value: result.rear.toFixed(1) },
        { label: "Front (kPa)", value: (result.front * 6.8948).toFixed(0) },
        { label: "Rear (kPa)", value: (result.rear * 6.8948).toFixed(0) },
        { label: "Front (Bar)", value: (result.front * 0.0689).toFixed(2) },
        { label: "Rear (Bar)", value: (result.rear * 0.0689).toFixed(2) },
      ],
      notes: [
        "Always set pressure when tyres are cold (parked >3 hours or driven <2 km).",
        "Check the door-jamb placard for your exact vehicle's recommended PSI.",
        "Under-inflation by 20% reduces tyre life ~25% and increases fuel use ~3%.",
      ],
      fileSlug: "tyre-pressure",
    },
  });

  return (
    <ToolPage
      title="Tyre Pressure Calculator"
      subtitle="Cold-set PSI for your vehicle, load and driving conditions."
      icon={<Wind className="w-5 h-5" />}
      form={
        <>
          <Field label="Vehicle type">
            <Select value={vehicle} onValueChange={(v) => setVehicle(v as VehicleType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BASE).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Load">
            <Select value={load} onValueChange={(v) => setLoad(v as typeof load)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">1–2 occupants (light)</SelectItem>
                <SelectItem value="full">Family + luggage (full)</SelectItem>
                <SelectItem value="max">Max rated load</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Sustained highway use">
            <Select value={highway ? "y" : "n"} onValueChange={(v) => setHighway(v === "y")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="n">Mostly city</SelectItem>
                <SelectItem value="y">Sustained 100+ km/h</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={`Ambient temperature: ${ambientC} °C`} hint="Pressure rises ~1 PSI per 5.5 °C heating.">
            <Input type="range" min={0} max={50} step={1} value={ambientC}
              onChange={(e) => setAmbientC(Number(e.target.value))} />
          </Field>
        </>
      }
      result={
        <>
          <Headline
            value={`${result.front} / ${result.rear} PSI`}
            label="Recommended cold pressure (front / rear)"
            verdict={result.verdict}
          />
          <Grid2>
            <Stat label="Front (kPa)" value={(result.front * 6.8948).toFixed(0)} />
            <Stat label="Rear (kPa)" value={(result.rear * 6.8948).toFixed(0)} />
            <Stat label="Front (Bar)" value={(result.front * 0.0689).toFixed(2)} />
            <Stat label="Rear (Bar)" value={(result.rear * 0.0689).toFixed(2)} />
          </Grid2>
        </>
      }
      buildPayload={build}
    />
  );
}
