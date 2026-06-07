import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitCompareArrows, CheckCircle2, XCircle } from "lucide-react";
import { Field, Grid2, Headline, ToolPage } from "@/components/site/ToolLayout";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";
import { AiExplainBlock } from "@/components/site/AiExplainBlock";
import { TYRE_BRANDS, type TyreBrand } from "@/lib/tyre-brands";

export const Route = createFileRoute("/tools/ai-tyre-comparison")({
  head: () => ({
    meta: [
      { title: "AI Tyre Comparison Tool — Side-by-Side | Manoj Wheels" },
      { name: "description", content: "Compare two tyre brands side-by-side — price, durability, comfort, grip, expected life. MRF vs Apollo, Michelin vs Bridgestone and more." },
      { property: "og:title", content: "AI Tyre Comparison Tool | Manoj Wheels" },
      { property: "og:description", content: "Side-by-side comparison of two tyre brands with score, pros, cons and best use." },
      { property: "og:url", content: "https://ai-tyre-vision.lovable.app/tools/ai-tyre-comparison" },
    ],
    links: [{ rel: "canonical", href: "https://ai-tyre-vision.lovable.app/tools/ai-tyre-comparison" }],
  }),
  component: ComparisonTool,
});

function score(b: TyreBrand) {
  // Weighted: durability 30, life mid 25, comfort 15, grip 15, mileage 15
  const lifeMid = (b.lifeMinKm + b.lifeMaxKm) / 2;
  const lifeNorm = Math.min(1, lifeMid / 80000);
  return Math.round(
    b.durability * 6 +
    lifeNorm * 25 +
    b.comfort * 3 +
    b.grip * 3 +
    b.mileage * 3,
  );
}

function prosOf(a: TyreBrand, b: TyreBrand): string[] {
  const out: string[] = [];
  if (a.durability > b.durability) out.push("Stronger sidewall / durability");
  if (a.comfort > b.comfort) out.push("More comfortable, quieter ride");
  if (a.mileage > b.mileage) out.push("Better fuel efficiency");
  if (a.grip > b.grip) out.push("Better wet & dry grip");
  if ((a.lifeMinKm + a.lifeMaxKm) > (b.lifeMinKm + b.lifeMaxKm)) out.push("Longer expected tread life");
  if (a.priceMinINR < b.priceMinINR) out.push("Lower entry price");
  return out;
}

function ComparisonTool() {
  const [aId, setAId] = useState("mrf");
  const [bId, setBId] = useState("michelin");
  const a = TYRE_BRANDS.find((t) => t.id === aId)!;
  const b = TYRE_BRANDS.find((t) => t.id === bId)!;

  const r = useMemo(() => {
    const aScore = score(a);
    const bScore = score(b);
    const winner = aScore === bScore ? null : aScore > bScore ? a : b;
    const aPros = prosOf(a, b);
    const bPros = prosOf(b, a);
    const bestUseA = a.strongFor.join(", ");
    const bestUseB = b.strongFor.join(", ");
    return { aScore, bScore, winner, aPros, bPros, bestUseA, bestUseB };
  }, [a, b]);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const build = (): SaveToolPayload => ({
    reportType: "tyre-comparison",
    title: `${a.name} vs ${b.name}`,
    summary: `${a.name} ${r.aScore} vs ${b.name} ${r.bScore}`,
    score: Math.max(r.aScore, r.bScore),
    recommendation: r.winner ? `${r.winner.name} scores higher overall` : "Tie — both score equally",
    payload: { aId, bId, aScore: r.aScore, bScore: r.bScore },
    pdf: {
      toolName: "AI Tyre Comparison",
      summary: "Side-by-side comparison using brand-line ranges from public manufacturer pages.",
      headline: r.winner ? r.winner.name : "Tie",
      headlineLabel: "Comparison Score",
      recommendation: r.winner ? `Overall winner: ${r.winner.name}` : "Both options score equally — choose by use case.",
      inputs: [
        { label: "Tyre A", value: `${a.name} (${a.bestModelExample})` },
        { label: "Tyre B", value: `${b.name} (${b.bestModelExample})` },
      ],
      results: [
        { label: "Score", value: `${a.name} ${r.aScore}  ·  ${b.name} ${r.bScore}` },
        { label: `${a.name} price`, value: `${fmt(a.priceMinINR)}–${fmt(a.priceMaxINR)}` },
        { label: `${b.name} price`, value: `${fmt(b.priceMinINR)}–${fmt(b.priceMaxINR)}` },
        { label: `${a.name} life`, value: `${a.lifeMinKm.toLocaleString()}–${a.lifeMaxKm.toLocaleString()} km` },
        { label: `${b.name} life`, value: `${b.lifeMinKm.toLocaleString()}–${b.lifeMaxKm.toLocaleString()} km` },
        { label: `${a.name} best for`, value: r.bestUseA },
        { label: `${b.name} best for`, value: r.bestUseB },
      ],
      notes: [
        `${a.name} advantages: ${r.aPros.join("; ") || "none vs " + b.name}`,
        `${b.name} advantages: ${r.bPros.join("; ") || "none vs " + a.name}`,
        "Specs are brand-line ranges from public model pages — not specific SKUs.",
      ],
      fileSlug: `compare-${a.id}-vs-${b.id}`,
    },
  });

  return (
    <ToolPage
      title="AI Tyre Comparison"
      subtitle="Compare two tyre brands side-by-side."
      icon={<GitCompareArrows className="w-5 h-5" />}
      buildPayload={build}
      form={
        <>
          <Grid2>
            <Field label="Tyre A">
              <Select value={aId} onValueChange={setAId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYRE_BRANDS.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tyre B">
              <Select value={bId} onValueChange={setBId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYRE_BRANDS.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </Grid2>
          <p className="text-[11px] text-muted-foreground">
            Specifications are brand-line ranges from each manufacturer's public model pages.
            Pick two different brands for a meaningful comparison.
          </p>
        </>
      }
      result={
        <>
          <Headline
            value={r.winner ? r.winner.name : "Tie"}
            label="Higher overall score"
            verdict={r.winner ? `${r.winner.name} ${Math.max(r.aScore, r.bScore)} vs ${Math.min(r.aScore, r.bScore)}` : `Both ${r.aScore}`}
          />
          <div className="grid grid-cols-2 gap-3">
            {[{ x: a, s: r.aScore, pros: r.aPros, vs: b, best: r.bestUseA }, { x: b, s: r.bScore, pros: r.bPros, vs: a, best: r.bestUseB }].map(({ x, s, pros, vs, best }) => (
              <div key={x.id} className={`rounded-xl border p-4 ${r.winner?.id === x.id ? "border-primary/40 bg-primary/5" : "border-border bg-card/60"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold">{x.name}</span>
                  <span className="text-lg font-extrabold text-gradient-primary">{s}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{x.bestModelExample}</p>
                <ul className="mt-2 space-y-1 text-[11px]">
                  <li>Price: {fmt(x.priceMinINR)}–{fmt(x.priceMaxINR)}</li>
                  <li>Life: {x.lifeMinKm/1000}k–{x.lifeMaxKm/1000}k km</li>
                  <li>Comfort: {x.comfort}/5 · Grip: {x.grip}/5</li>
                  <li>Durability: {x.durability}/5 · Mileage: {x.mileage}/5</li>
                </ul>
                {pros.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Advantages vs {vs.name}</p>
                    <ul className="mt-1 space-y-1">
                      {pros.map((p) => (
                        <li key={p} className="text-[11px] flex gap-1.5 items-start">
                          <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {pros.length === 0 && (
                  <div className="mt-3 flex gap-1.5 items-start text-[11px] text-muted-foreground">
                    <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    No clear advantage vs {vs.name}
                  </div>
                )}
                <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">Best for</p>
                <p className="text-[11px]">{best}</p>
              </div>
            ))}
          </div>
          <AiExplainBlock
            toolName="AI Tyre Comparison"
            prompt={`Compare ${a.name} (score ${r.aScore}, best for ${r.bestUseA}) vs ${b.name} (score ${r.bScore}, best for ${r.bestUseB}) for a driver in Pulivendula, AP. In <120 words, recommend which to buy and the one scenario the other wins. Do not invent numeric specifications.`}
          />
        </>
      }
    />
  );
}
