import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Wrench } from "lucide-react";
import { Field, Grid2, Headline, Stat, ToolPage } from "@/components/site/ToolLayout";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/service-cost-estimator")({
  head: () => ({
    meta: [
      { title: "Service Cost Estimator (₹) | Manoj Wheels" },
      {
        name: "description",
        content:
          "Estimate the cost of tyre, alignment, balancing & nitrogen services at Manoj Wheels with an itemised, transparent breakdown.",
      },
    ],
  }),
  component: ServiceCostTool,
});

interface ServiceItem {
  id: string;
  label: string;
  /** Per-unit / per-job rate in ₹ (workshop list price). */
  price: number;
  /** True for items priced per wheel (×4 by default for cars). */
  perWheel?: boolean;
}

const SERVICES: ServiceItem[] = [
  { id: "alignment", label: "3D Wheel Alignment", price: 600 },
  { id: "balancing", label: "Wheel Balancing", price: 200, perWheel: true },
  { id: "nitrogen", label: "Nitrogen Refill", price: 50, perWheel: true },
  { id: "rotation", label: "Tyre Rotation", price: 250 },
  { id: "puncture", label: "Puncture Repair", price: 150 },
  { id: "tube_change", label: "Tubeless Valve Replacement", price: 80, perWheel: true },
  { id: "wash", label: "Underbody Wash & Inspection", price: 350 },
];

function ServiceCostTool() {
  const [wheels, setWheels] = useState(4);
  const [selected, setSelected] = useState<Record<string, boolean>>({
    alignment: true,
    balancing: true,
    nitrogen: true,
  });

  const result = useMemo(() => {
    const items = SERVICES.filter((s) => selected[s.id]).map((s) => {
      const qty = s.perWheel ? wheels : 1;
      const subtotal = s.price * qty;
      return { ...s, qty, subtotal };
    });
    const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
    // GST 18% on labour + parts (typical workshop billing in India)
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;

    // Recommended package logic (transparent, rule-based)
    const hasAlign = !!selected.alignment;
    const hasBalance = !!selected.balancing;
    const hasNitro = !!selected.nitrogen;
    const recommended =
      hasAlign && hasBalance && hasNitro
        ? "Full Wheel Care Package — best value"
        : hasAlign && hasBalance
        ? "Add Nitrogen Refill for ~5% better mileage"
        : hasAlign
        ? "Add Balancing to remove vibrations"
        : "Start with Alignment + Balancing — most-needed service";

    return { items, subtotal, gst, total, recommended };
  }, [selected, wheels]);

  const fmt = (n: number) => `₹${Math.max(0, Math.round(n)).toLocaleString("en-IN")}`;

  const build = (): SaveToolPayload => ({
    reportType: "service-cost",
    title: "Service Cost Estimate",
    summary: `${result.items.length} services · ${fmt(result.total)}`,
    score: Math.min(100, Math.round((result.items.length / SERVICES.length) * 100)),
    recommendation: result.recommended,
    payload: {
      wheels,
      selected,
      items: result.items,
      subtotal: result.subtotal,
      gst: result.gst,
      total: result.total,
    },
    pdf: {
      toolName: "Service Cost Estimator",
      summary:
        "Itemised workshop estimate based on Manoj Wheels published rates. Final invoice may vary with actual vehicle.",
      headline: fmt(result.total),
      headlineLabel: "Estimated total (incl. GST)",
      recommendation: result.recommended,
      inputs: [
        { label: "Wheels", value: String(wheels) },
        {
          label: "Services selected",
          value: result.items.map((i) => i.label).join(", ") || "None",
        },
      ],
      results: [
        ...result.items.map((i) => ({
          label: `${i.label}${i.perWheel ? ` × ${i.qty}` : ""}`,
          value: fmt(i.subtotal),
        })),
        { label: "Subtotal", value: fmt(result.subtotal) },
        { label: "GST (18%)", value: fmt(result.gst) },
        { label: "Total", value: fmt(result.total) },
      ],
      notes: [
        "Rates are workshop list prices and may vary with vehicle model & tyre size.",
        "GST is calculated at 18% on labour + consumables as per current Indian rules.",
        "Book online to lock in today's price.",
      ],
      fileSlug: "service-cost",
    },
  });

  const toggle = (id: string) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  return (
    <ToolPage
      title="Service Cost Estimator"
      subtitle="Transparent, itemised workshop pricing."
      icon={<Wrench className="w-5 h-5" />}
      form={
        <>
          <Field label="Number of wheels">
            <div className="flex gap-2">
              {[2, 4, 6].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setWheels(n)}
                  className={`px-3 py-1.5 rounded-md border text-sm ${
                    wheels === n
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-background/40"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Select services">
            <div className="space-y-2">
              {SERVICES.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2 cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <Checkbox
                      checked={!!selected[s.id]}
                      onCheckedChange={() => toggle(s.id)}
                    />
                    <span className="text-sm">{s.label}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {fmt(s.price)}
                    {s.perWheel ? " / wheel" : ""}
                  </span>
                </label>
              ))}
            </div>
          </Field>
        </>
      }
      result={
        <>
          <Headline
            value={fmt(result.total)}
            label="Estimated total (incl. GST)"
            verdict={result.recommended}
          />
          <Grid2>
            <Stat label="Subtotal" value={fmt(result.subtotal)} />
            <Stat label="GST (18%)" value={fmt(result.gst)} />
            <Stat label="Items" value={String(result.items.length)} />
            <Stat label="Wheels" value={String(wheels)} />
          </Grid2>
          {result.items.length > 0 && (
            <div className="mt-4 rounded-xl border border-border divide-y divide-border bg-background/40 text-sm">
              {result.items.map((i) => (
                <div key={i.id} className="flex justify-between px-3 py-2">
                  <span>
                    {i.label}
                    {i.perWheel ? ` × ${i.qty}` : ""}
                  </span>
                  <span className="font-medium">{fmt(i.subtotal)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      }
      buildPayload={build}
    />
  );
}
