import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Compass } from "lucide-react";
import { Field, Headline, Stat, Grid2, ToolPage } from "@/components/site/ToolLayout";
import { AiExplainBlock } from "@/components/site/AiExplainBlock";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/wheel-alignment-checker")({
  head: () => ({
    meta: [
      { title: "Wheel Alignment Checker | Manoj Wheels" },
      {
        name: "description",
        content:
          "Quickly assess wheel alignment risk from common symptoms — pulling, vibration, uneven wear and pothole impact.",
      },
    ],
  }),
  component: WheelAlignmentTool,
});

// Weighted scoring — matches user spec.
const SYMPTOMS: Array<{ id: string; label: string; weight: number }> = [
  { id: "pull-left", label: "Steering pulls to the left", weight: 20 },
  { id: "pull-right", label: "Steering pulls to the right", weight: 20 },
  { id: "vibration", label: "Steering wheel vibration", weight: 25 },
  { id: "uneven-wear", label: "Visible uneven tyre wear", weight: 30 },
  { id: "drift", label: "Vehicle drifts on straight road", weight: 15 },
  { id: "pothole", label: "Recent strong pothole impact", weight: 10 },
];

function WheelAlignmentTool() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const result = useMemo(() => {
    const raw = SYMPTOMS.reduce(
      (s, sym) => s + (checked[sym.id] ? sym.weight : 0),
      0,
    );
    const score = Math.min(100, raw);
    const level: "Low" | "Medium" | "High" =
      score <= 30 ? "Low" : score <= 70 ? "Medium" : "High";
    const verdict =
      level === "Low"
        ? "Alignment looks fine — keep monitoring"
        : level === "Medium"
        ? "Get alignment checked within 1-2 weeks"
        : "Immediate alignment service recommended";
    const causes = [
      checked["pull-left"] || checked["pull-right"] ? "Camber/toe out of spec" : null,
      checked["vibration"] ? "Wheel balance off, possibly bent rim" : null,
      checked["uneven-wear"] ? "Long-standing misalignment" : null,
      checked["pothole"] ? "Possible suspension geometry shift" : null,
      checked["drift"] ? "Caster imbalance" : null,
    ].filter(Boolean) as string[];
    return { score, level, verdict, causes };
  }, [checked]);

  const aiPrompt = `Symptoms reported: ${
    SYMPTOMS.filter((s) => checked[s.id]).map((s) => s.label).join(", ") || "none"
  }. Calculated alignment risk score: ${result.score}/100 (${result.level}). Possible mechanical causes: ${
    result.causes.join("; ") || "none flagged"
  }. Explain what this likely means and recommend service steps.`;

  const build = (): SaveToolPayload => ({
    reportType: "wheel-alignment",
    title: "Wheel Alignment Check",
    summary: `${result.level} risk · ${result.score}/100`,
    score: result.score,
    recommendation: result.verdict,
    payload: { checked, ...result },
    pdf: {
      toolName: "Wheel Alignment Checker",
      summary: "Symptom-based alignment risk assessment.",
      headline: `${result.score}/100`,
      headlineLabel: `${result.level} risk`,
      recommendation: result.verdict,
      inputs: SYMPTOMS.map((s) => ({
        label: s.label,
        value: checked[s.id] ? "Yes" : "No",
      })),
      results: [
        { label: "Risk score", value: `${result.score}/100` },
        { label: "Risk level", value: result.level },
        { label: "Possible causes", value: result.causes.join(", ") || "—" },
      ],
      notes: [
        "Symptom scoring is indicative only — a workshop check is required for confirmation.",
        "Most modern cars need alignment every 10,000 km or after pothole impact.",
      ],
      fileSlug: "wheel-alignment",
    },
  });

  return (
    <ToolPage
      title="Wheel Alignment Checker"
      subtitle="Tick the symptoms you notice — we'll score alignment risk."
      icon={<Compass className="w-5 h-5" />}
      form={
        <div className="space-y-3">
          {SYMPTOMS.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3 cursor-pointer"
            >
              <Checkbox
                checked={!!checked[s.id]}
                onCheckedChange={(v) =>
                  setChecked((prev) => ({ ...prev, [s.id]: !!v }))
                }
              />
              <span className="text-sm flex-1">{s.label}</span>
              <span className="text-[10px] text-muted-foreground">
                +{s.weight}
              </span>
            </label>
          ))}
        </div>
      }
      result={
        <>
          <Headline
            value={`${result.score}/100`}
            label={`${result.level} alignment risk`}
            verdict={result.verdict}
          />
          <Grid2>
            <Stat label="Symptoms flagged" value={String(SYMPTOMS.filter((s) => checked[s.id]).length)} />
            <Stat label="Risk level" value={result.level} />
          </Grid2>
          {result.causes.length > 0 && (
            <div className="rounded-xl border border-border p-3 bg-background/40">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Possible causes
              </p>
              <ul className="mt-1.5 text-sm space-y-1 list-disc pl-5">
                {result.causes.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          )}
          <AiExplainBlock toolName="Wheel Alignment Checker" prompt={aiPrompt} />
        </>
      }
      buildPayload={build}
    />
  );
}
