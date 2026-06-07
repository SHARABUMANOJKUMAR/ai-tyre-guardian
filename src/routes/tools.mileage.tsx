import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Gauge, ArrowLeft } from "lucide-react";
import { ToolShareBar } from "@/components/site/ToolShareBar";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/mileage")({
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

// Legal minimum tread depth is 1.6 mm; new passenger tyres ship at ~8 mm.
const LEGAL_MIN_MM = 1.6;
const NEW_TYRE_MM = 8;

// Average km per 1 mm of tread wear varies by driving style.
// Based on industry averages (Michelin/Bridgestone consumer guidance).
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
    const wearPct = Math.min(100, Math.max(0, ((NEW_TYRE_MM - currentMm) / (NEW_TYRE_MM - LEGAL_MIN_MM)) * 100));
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

  function build(): SaveToolPayload {
    return {
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
    };
  }

  return (
    <ToolPage
      title="Tyre Mileage Calculator"
      subtitle="Predict remaining tyre life from your current tread depth."
      icon={<Gauge className="w-5 h-5" />}
      form={
        <>
          <Field label={`Current tread depth: ${currentMm.toFixed(1)} mm`} hint="New tyres are usually 8 mm; legal minimum is 1.6 mm.">
            <Input
              type="range" min={1.6} max={8} step={0.1}
              value={currentMm}
              onChange={(e) => setCurrentMm(Number(e.target.value))}
            />
          </Field>
          <Field label="Monthly distance (km)">
            <Input type="number" min={50} max={20000} value={monthlyKm}
              onChange={(e) => setMonthlyKm(Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field label="Driving style">
            <Select value={style} onValueChange={(v) => setStyle(v as keyof typeof KM_PER_MM)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Headline value={`${result.remainingKm.toLocaleString()} km`} label="Estimated remaining life" verdict={result.verdict} />
          <div className="mt-5">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Tread wear</span><span>{result.wearPct.toFixed(0)}%</span></div>
            <Progress value={result.wearPct} className="mt-2" />
          </div>
          <Grid2>
            <Stat label="Months until replacement" value={`${result.monthsLeft.toFixed(1)}`} />
            <Stat label="Driving style" value={style.charAt(0).toUpperCase() + style.slice(1)} />
          </Grid2>
        </>
      }
      buildPayload={build}
    />
  );
}

/* ---------- Shared layout primitives (kept local — used only by tool pages) ---------- */
function ToolPage(props: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  form: React.ReactNode;
  result: React.ReactNode;
  buildPayload: () => SaveToolPayload;
}) {
  return (
    <div>
      <section className="border-b border-border bg-gradient-hero/50">
        <div className="container mx-auto px-4 py-10 lg:py-14">
          <Link to="/tools" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> All tools
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary/15 border border-primary/30 inline-flex items-center justify-center text-primary">
              {props.icon}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">{props.title}</h1>
              <p className="text-sm text-muted-foreground">{props.subtitle}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/60 space-y-5">{props.form}</Card>
        <Card className="p-6 bg-card/60 space-y-5">
          {props.result}
          <ToolShareBar build={props.buildPayload} />
        </Card>
      </section>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Headline({ value, label, verdict }: { value: string; label: string; verdict: string }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-4xl font-extrabold text-gradient-primary">{value}</p>
      <p className="mt-2 text-sm font-semibold">{verdict}</p>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-bold">{value}</p>
    </div>
  );
}

// Re-export local primitives so siblings (size, pressure, fuel, service-cost) can import them.
export { ToolPage, Field, Headline, Grid2, Stat };
