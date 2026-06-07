import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Ruler } from "lucide-react";
import { Field, Grid2, Headline, Stat, ToolPage } from "@/components/site/ToolLayout";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/size")({
  head: () => ({
    meta: [
      { title: "Tyre Size Calculator & Comparison | Manoj Wheels" },
      {
        name: "description",
        content:
          "Compare two tyre sizes (e.g. 195/65 R15 vs 205/55 R16). Get sidewall height, overall diameter, rolling circumference and speedometer error.",
      },
    ],
  }),
  component: SizeTool,
});

interface Spec {
  width: number; // mm
  ratio: number; // %
  rim: number;   // inches
}

/**
 * Tyre size math (ISO 4000-1 / metric tyre marking):
 *   sidewall_mm        = width_mm × (ratio / 100)
 *   overall_diameter_m = (rim_in × 25.4 + 2 × sidewall_mm) / 1000
 *   rolling_circ_m     = π × overall_diameter_m
 *   revs_per_km        = 1000 / rolling_circ_m
 */
function calc(s: Spec) {
  const sidewall = s.width * (s.ratio / 100); // mm
  const diameter = (s.rim * 25.4 + 2 * sidewall) / 1000; // m
  const circumference = Math.PI * diameter; // m
  const revsPerKm = 1000 / circumference;
  return { sidewall, diameter, circumference, revsPerKm };
}

function SizeTool() {
  const [a, setA] = useState<Spec>({ width: 195, ratio: 65, rim: 15 });
  const [b, setB] = useState<Spec>({ width: 205, ratio: 55, rim: 16 });

  const result = useMemo(() => {
    const A = calc(a);
    const B = calc(b);
    const diameterDiffPct = ((B.diameter - A.diameter) / A.diameter) * 100;
    // Speedo reads the original (A) size. If actual size is B, the speedo error is:
    //   actual_speed = indicated_speed × (B.diameter / A.diameter)
    // expressed as the % difference from indicated.
    const speedoErrorPct = diameterDiffPct;
    const verdict =
      Math.abs(diameterDiffPct) <= 3
        ? "Safe substitution — within ±3% tolerance"
        : Math.abs(diameterDiffPct) <= 5
        ? "Acceptable but check clearance and speedo"
        : "Not recommended — outside ±3% safe range";
    return { A, B, diameterDiffPct, speedoErrorPct, verdict };
  }, [a, b]);

  const build = (): SaveToolPayload => ({
    reportType: "tyre-size",
    title: "Tyre Size Comparison",
    summary: `${fmt(a)} → ${fmt(b)} · diameter ${result.diameterDiffPct >= 0 ? "+" : ""}${result.diameterDiffPct.toFixed(2)}%`,
    score: Math.max(0, 100 - Math.round(Math.abs(result.diameterDiffPct) * 10)),
    recommendation: result.verdict,
    payload: { a, b, ...result },
    pdf: {
      toolName: "Tyre Size Calculator",
      summary: `Comparison between ${fmt(a)} (original) and ${fmt(b)} (new).`,
      headline: `${result.diameterDiffPct >= 0 ? "+" : ""}${result.diameterDiffPct.toFixed(2)}%`,
      headlineLabel: "Overall diameter difference",
      recommendation: result.verdict,
      inputs: [
        { label: "Original size", value: fmt(a) },
        { label: "New size", value: fmt(b) },
      ],
      results: [
        { label: "Original sidewall", value: `${result.A.sidewall.toFixed(1)} mm` },
        { label: "New sidewall", value: `${result.B.sidewall.toFixed(1)} mm` },
        { label: "Original diameter", value: `${(result.A.diameter * 1000).toFixed(1)} mm` },
        { label: "New diameter", value: `${(result.B.diameter * 1000).toFixed(1)} mm` },
        { label: "Rolling circumference change", value: `${((result.B.circumference - result.A.circumference) * 1000).toFixed(1)} mm` },
        { label: "Speedo reads slower/faster by", value: `${result.speedoErrorPct >= 0 ? "+" : ""}${result.speedoErrorPct.toFixed(2)}%` },
        { label: "Revolutions per km (new)", value: result.B.revsPerKm.toFixed(0) },
      ],
      notes: [
        "Industry safe range is within ±3% of original overall diameter.",
        "Larger diameter makes the speedometer under-read actual speed.",
        "Verify clearance against suspension, wheel arches and ABS calibration before switching.",
      ],
      fileSlug: "tyre-size",
    },
  });

  return (
    <ToolPage
      title="Tyre Size Calculator"
      subtitle="Compare two tyre sizes and check fitment safety."
      icon={<Ruler className="w-5 h-5" />}
      form={
        <>
          <SpecEditor label="Original tyre size" value={a} onChange={setA} />
          <SpecEditor label="New tyre size" value={b} onChange={setB} />
        </>
      }
      result={
        <>
          <Headline
            value={`${result.diameterDiffPct >= 0 ? "+" : ""}${result.diameterDiffPct.toFixed(2)}%`}
            label="Overall diameter change"
            verdict={result.verdict}
          />
          <Grid2>
            <Stat label="Original diameter" value={`${(result.A.diameter * 1000).toFixed(0)} mm`} />
            <Stat label="New diameter" value={`${(result.B.diameter * 1000).toFixed(0)} mm`} />
            <Stat label="Original sidewall" value={`${result.A.sidewall.toFixed(0)} mm`} />
            <Stat label="New sidewall" value={`${result.B.sidewall.toFixed(0)} mm`} />
            <Stat label="Speedo error" value={`${result.speedoErrorPct >= 0 ? "+" : ""}${result.speedoErrorPct.toFixed(2)}%`} />
            <Stat label="Revs / km (new)" value={result.B.revsPerKm.toFixed(0)} />
          </Grid2>
        </>
      }
      buildPayload={build}
    />
  );
}

function SpecEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Spec;
  onChange: (s: Spec) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold mb-2">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Width (mm)">
          <Input
            type="number" min={125} max={355} step={5}
            value={value.width}
            onChange={(e) => onChange({ ...value, width: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Aspect %">
          <Input
            type="number" min={25} max={85} step={5}
            value={value.ratio}
            onChange={(e) => onChange({ ...value, ratio: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Rim (in)">
          <Input
            type="number" min={10} max={22} step={1}
            value={value.rim}
            onChange={(e) => onChange({ ...value, rim: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5">e.g. {fmt(value)}</p>
    </div>
  );
}

function fmt(s: Spec) {
  return `${s.width}/${s.ratio} R${s.rim}`;
}
