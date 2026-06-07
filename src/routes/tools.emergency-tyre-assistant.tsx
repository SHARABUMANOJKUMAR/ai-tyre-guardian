import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Phone, MessageCircle } from "lucide-react";
import { Field, Headline, ToolPage } from "@/components/site/ToolLayout";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";
import { AiExplainBlock } from "@/components/site/AiExplainBlock";
import { openWhatsApp } from "@/lib/whatsapp";

export const Route = createFileRoute("/tools/emergency-tyre-assistant")({
  head: () => ({
    meta: [
      { title: "Emergency Tyre Assistant — Safety Steps in Seconds | Manoj Wheels" },
      { name: "description", content: "Tyre burst, steering vibration, pulling, slow puncture — get immediate safety steps & severity guidance. AI guidance, never a replacement for inspection." },
      { property: "og:title", content: "Emergency Tyre Assistant | Manoj Wheels" },
      { property: "og:description", content: "Free emergency tyre guidance — immediate safety steps, severity level and recommended service." },
      { property: "og:url", content: "https://ai-tyre-vision.lovable.app/tools/emergency-tyre-assistant" },
    ],
    links: [{ rel: "canonical", href: "https://ai-tyre-vision.lovable.app/tools/emergency-tyre-assistant" }],
  }),
  component: EmergencyTool,
});

type Severity = "Critical — Stop Immediately" | "High — Drive to Workshop Slowly" | "Medium — Inspect Today" | "Low — Monitor";

interface Scenario {
  match: RegExp;
  severity: Severity;
  steps: string[];
  service: string;
}

const SCENARIOS: Scenario[] = [
  {
    match: /\b(burst|blow ?out|exploded|blown)\b/i,
    severity: "Critical — Stop Immediately",
    steps: [
      "Grip the steering firmly with both hands — DO NOT brake hard.",
      "Ease off the accelerator, let the car slow naturally.",
      "Signal and pull over to the leftmost safe spot.",
      "Switch on hazard lights, place a reflector 50–100m behind.",
      "Do not drive on a burst tyre — call roadside assistance.",
    ],
    service: "Roadside puncture/replacement — call Manoj Wheels immediately.",
  },
  {
    match: /\bvibrat|shak|steering shake|wobble|trembl/i,
    severity: "High — Drive to Workshop Slowly",
    steps: [
      "Reduce speed below 50 km/h until you reach a workshop.",
      "Vibration above 60 km/h usually means wheel imbalance or bent rim.",
      "Vibration under braking usually means warped brake rotors.",
      "Check tyres for visible bulges, missing weights, or damage.",
      "Book wheel balancing + alignment check.",
    ],
    service: "Wheel Balancing + Alignment Check",
  },
  {
    match: /\b(pull|drift|veer|side)\b/i,
    severity: "High — Drive to Workshop Slowly",
    steps: [
      "Check tyre pressure on all four tyres — uneven pressure is the #1 cause.",
      "If pressure is OK, the wheels are out of alignment.",
      "Look for uneven tread wear on inner/outer tyre edges.",
      "Drive gently to a workshop — alignment must be corrected.",
    ],
    service: "3D Wheel Alignment",
  },
  {
    match: /\b(losing air|slow puncture|deflat|going flat|low pressure)\b/i,
    severity: "Medium — Inspect Today",
    steps: [
      "Inflate to recommended PSI and note the reading.",
      "Recheck after 1 hour and after 6 hours — falling = leak.",
      "Inspect tread for nails, screws, or cuts.",
      "Inspect the valve stem — a hissing sound means valve replacement.",
      "Visit workshop for puncture repair before pressure drops fully.",
    ],
    service: "Puncture Repair / Valve Replacement",
  },
  {
    match: /\b(crack|sidewall|bulge|cut)\b/i,
    severity: "Critical — Stop Immediately",
    steps: [
      "Do not drive on a tyre with sidewall cracks or bulges.",
      "Sidewall damage cannot be repaired — only replaced.",
      "Move to the spare tyre if you can do so safely.",
      "Call workshop for replacement.",
    ],
    service: "Tyre Replacement",
  },
  {
    match: /\b(noise|humming|growl|rumble)\b/i,
    severity: "Medium — Inspect Today",
    steps: [
      "Humming/growling that increases with speed often means cupping / uneven wear.",
      "Check tread surface for scalloping or uneven patches.",
      "Wheel bearing damage produces a similar noise — needs mechanic check.",
      "Book inspection within the next few days.",
    ],
    service: "Tyre Inspection + Wheel Bearing Check",
  },
];

function classify(text: string): { severity: Severity; steps: string[]; service: string; matched: boolean } {
  const t = text.trim();
  if (!t) return { severity: "Low — Monitor", steps: [], service: "", matched: false };
  for (const s of SCENARIOS) {
    if (s.match.test(t)) return { severity: s.severity, steps: s.steps, service: s.service, matched: true };
  }
  return {
    severity: "Low — Monitor",
    steps: [
      "Note when the issue started and what changed (load, road, speed).",
      "Check tyre pressure on all four tyres.",
      "Inspect tread depth and look for visible damage.",
      "Visit Manoj Wheels for a physical inspection.",
    ],
    service: "General Tyre Inspection",
    matched: false,
  };
}

const SEVERITY_COLOR: Record<Severity, string> = {
  "Critical — Stop Immediately": "text-primary",
  "High — Drive to Workshop Slowly": "text-gold",
  "Medium — Inspect Today": "text-gold",
  "Low — Monitor": "text-muted-foreground",
};

const EXAMPLES = [
  "My tyre burst on the highway",
  "Steering is vibrating above 80 km/h",
  "Vehicle is pulling left",
  "Tyre is losing air slowly",
  "I see a crack on the sidewall",
  "Humming sound at high speed",
];

function EmergencyTool() {
  const [text, setText] = useState("");
  const r = useMemo(() => classify(text), [text]);

  const build = (): SaveToolPayload => ({
    reportType: "emergency-assistant",
    title: "Emergency Tyre Guidance",
    summary: text ? `Symptom: ${text.slice(0, 120)}` : "No symptom entered",
    score: 0,
    recommendation: r.severity,
    payload: { text, ...r },
    pdf: {
      toolName: "Emergency Tyre Assistant",
      summary: "AI guidance only — never a replacement for physical inspection.",
      headline: r.severity.split(" — ")[0],
      headlineLabel: "Severity",
      recommendation: r.severity,
      inputs: [{ label: "Symptom described", value: text || "—" }],
      results: r.steps.map((s, i) => ({ label: `Step ${i + 1}`, value: s })),
      notes: [
        `Recommended service: ${r.service}`,
        "IMPORTANT: This is AI guidance and not a replacement for physical inspection.",
        "Call Manoj Wheels for emergencies: +91 8897230858.",
      ],
      fileSlug: "emergency",
    },
  });

  return (
    <ToolPage
      title="Emergency Tyre Assistant"
      subtitle="Describe what's happening — get immediate safety steps."
      icon={<AlertTriangle className="w-5 h-5" />}
      buildPayload={build}
      resultDisabled={!text.trim()}
      form={
        <>
          <Field label="Describe the problem" hint="Example: 'My tyre burst on the highway' or 'Steering is shaking above 80 km/h'.">
            <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value.slice(0, 500))} placeholder="What is happening to your tyre or steering?" />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button"
                onClick={() => setText(ex)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-primary/40 hover:text-primary">
                {ex}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
            <p className="text-sm font-bold text-primary inline-flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Emergency contacts
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="hero">
                <a href="tel:+918897230858"><Phone className="w-4 h-4" /> Call Manoj Wheels</a>
              </Button>
              <Button size="sm" variant="outline" onClick={() => openWhatsApp("918897230858", "Emergency: " + (text || "tyre issue"))}>
                <MessageCircle className="w-4 h-4" /> WhatsApp now
              </Button>
            </div>
          </div>
        </>
      }
      result={
        <>
          <Headline
            value={r.severity.split(" — ")[0]}
            label="Severity"
            verdict={r.severity.split(" — ")[1] ?? ""}
          />
          {text.trim() ? (
            <>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Immediate safety steps</p>
                <ol className={`space-y-2 text-sm list-decimal pl-5 ${SEVERITY_COLOR[r.severity]}`}>
                  {r.steps.map((s, i) => <li key={i} className="text-foreground/90">{s}</li>)}
                </ol>
              </div>
              <div className="rounded-lg border border-border bg-background/40 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Recommended service</p>
                <p className="mt-0.5 text-sm font-semibold">{r.service}</p>
              </div>
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
                <p className="text-[11px] text-gold font-semibold uppercase tracking-wider">Important disclaimer</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This is AI guidance based on common symptoms. It is not a replacement for physical inspection.
                  For any safety-critical issue, stop driving and call Manoj Wheels immediately.
                </p>
              </div>
              <AiExplainBlock
                toolName="Emergency Tyre Assistant"
                prompt={`Driver in Pulivendula, AP describes: "${text}". Severity: ${r.severity}. Give a calm, 80-word safety explanation. End with one clear next action.`}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Describe what's happening to your tyre or steering above to get guidance.</p>
          )}
        </>
      }
    />
  );
}
