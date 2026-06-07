import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Download, RefreshCw } from "lucide-react";
import {
  generateToolReportPDF,
  type ToolReportInput,
} from "@/lib/tool-report-pdf";

export const Route = createFileRoute("/pdf-preview")({
  head: () => ({
    meta: [
      { title: "Live PDF Preview — Manoj Wheels" },
      {
        name: "description",
        content:
          "Live preview the Manoj Wheels tool PDF report layout. Edit any field and see the rendered PDF, including ₹ rupee formatting and multi-page alignment, before downloading.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PdfPreviewPage,
});

const sample: ToolReportInput = {
  toolName: "Vehicle Running Cost Calculator",
  summary: "Complete running cost — fuel + tyres + insurance + maintenance.",
  headline: "₹1,05,080",
  headlineLabel: "Average running cost for India",
  recommendation: "Within typical range for daily commuter sedans in India.",
  inputs: [
    { label: "Daily distance", value: "40 km" },
    { label: "Mileage", value: "16 km/l" },
    { label: "Fuel price", value: "₹102 / litre" },
    { label: "Tyre set cost", value: "₹20,000 / 40,000 km" },
    { label: "Insurance (yearly)", value: "₹12,000" },
    { label: "Maintenance (yearly)", value: "₹15,000" },
  ],
  results: [
    { label: "Fuel — monthly", value: "₹7,650" },
    { label: "Tyre wear — monthly", value: "₹600" },
    { label: "Insurance — monthly", value: "₹1,000" },
    { label: "Maintenance — monthly", value: "₹1,250" },
    { label: "Total monthly", value: "₹10,500" },
    { label: "Total yearly", value: "₹1,26,000" },
    { label: "Cost per km", value: "₹8.75" },
  ],
  notes: [
    "Tyre wear is calculated as (set price ÷ expected life km) × distance driven.",
    "Proper tyre pressure can improve mileage by 3–5%.",
    "Wheel alignment & balancing every 10,000 km extends tyre life.",
    "Fuel-saving tip: avoid prolonged idling — 10 minutes of idling burns the same fuel as driving 1 km.",
    "Insurance premiums depend heavily on no-claim bonus — keep your record clean to save up to 50%.",
  ],
  fileSlug: "preview",
};

function PdfPreviewPage() {
  const [toolName, setToolName] = useState(sample.toolName);
  const [summary, setSummary] = useState(sample.summary ?? "");
  const [headline, setHeadline] = useState(sample.headline ?? "");
  const [headlineLabel, setHeadlineLabel] = useState(sample.headlineLabel ?? "");
  const [recommendation, setRecommendation] = useState(sample.recommendation ?? "");
  const [inputsText, setInputsText] = useState(
    (sample.inputs ?? []).map((r) => `${r.label} | ${r.value}`).join("\n"),
  );
  const [resultsText, setResultsText] = useState(
    (sample.results ?? []).map((r) => `${r.label} | ${r.value}`).join("\n"),
  );
  const [notesText, setNotesText] = useState((sample.notes ?? []).join("\n"));
  const [bump, setBump] = useState(0);

  const parseRows = (txt: string) =>
    txt
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, ...rest] = line.split("|");
        return { label: (label ?? "").trim(), value: rest.join("|").trim() };
      });

  const pdf = useMemo(() => {
    try {
      return generateToolReportPDF(
        {
          toolName,
          summary,
          headline,
          headlineLabel,
          recommendation,
          inputs: parseRows(inputsText),
          results: parseRows(resultsText),
          notes: notesText
            .split("\n")
            .map((n) => n.trim())
            .filter(Boolean),
          fileSlug: "preview",
        },
        { save: false },
      );
    } catch (e) {
      console.error("PDF preview failed", e);
      return null;
    }
    // bump triggers re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    toolName,
    summary,
    headline,
    headlineLabel,
    recommendation,
    inputsText,
    resultsText,
    notesText,
    bump,
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold">Live PDF Preview</h1>
          <p className="text-sm text-muted-foreground">
            Edit any field and the embedded PDF updates instantly. Used to verify ₹
            rendering, multi-page page breaks, and alignment before downloading.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBump((b) => b + 1)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Re-render
          </Button>
          <Button
            onClick={() => {
              if (pdf) {
                const a = document.createElement("a");
                a.href = pdf.dataUrl;
                a.download = pdf.filename;
                a.click();
              }
            }}
            disabled={!pdf}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4 bg-card/60 max-h-[80vh] overflow-y-auto">
          <Field label="Tool name">
            <Input value={toolName} onChange={(e) => setToolName(e.target.value)} />
          </Field>
          <Field label="Summary">
            <Textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Headline">
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
            </Field>
            <Field label="Headline label">
              <Input
                value={headlineLabel}
                onChange={(e) => setHeadlineLabel(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Recommendation">
            <Textarea
              rows={2}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
            />
          </Field>
          <Field label="Inputs (one per line, `label | value`)">
            <Textarea
              rows={6}
              value={inputsText}
              onChange={(e) => setInputsText(e.target.value)}
            />
          </Field>
          <Field label="Results (one per line, `label | value`)">
            <Textarea
              rows={7}
              value={resultsText}
              onChange={(e) => setResultsText(e.target.value)}
            />
          </Field>
          <Field label="Notes (one per line)">
            <Textarea
              rows={5}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
            />
          </Field>
        </Card>

        <Card className="p-3 bg-card/60 h-[80vh] overflow-hidden">
          {pdf ? (
            <iframe
              key={pdf.filename + bump}
              title="PDF preview"
              src={pdf.dataUrl}
              className="w-full h-full rounded-md border border-border bg-white"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Could not render PDF.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
