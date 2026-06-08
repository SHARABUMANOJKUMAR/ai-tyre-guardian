import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicInvoice, type PublicInvoice } from "@/lib/public-invoice.functions";
import { CheckCircle2, ShieldCheck, XCircle, Loader2, Phone, Mail, Car, Wrench, IndianRupee, Calendar, User, Printer, Download, RefreshCw, AlertTriangle, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";

const LOGO_URL = "https://res.cloudinary.com/dwv8kc9vb/image/upload/v1780845528/Finally_Logo_oxkjjv.png";
const VERIFY_BASE = "https://manojwheels.online/invoice/";

// Deterministic FNV-1a hash over canonical invoice fields. Used as a
// lightweight integrity signature — if the sheet data changes, the hash changes.
function invoiceHash(inv: PublicInvoice): string {
  const canonical = [
    inv.invoiceNumber, inv.date, inv.fullName, inv.mobile, inv.email,
    inv.vehicleNumber, inv.vehicleType, inv.service, inv.problem,
    inv.cost, inv.gst, inv.discount, inv.total, inv.paymentMode, inv.status,
  ].map((v) => String(v ?? "").trim()).join("|");
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return ("0000000" + h.toString(16).toUpperCase()).slice(-8);
}

function invoiceSignature(inv: PublicInvoice): string {
  const dt = (inv.date || "").replace(/\D/g, "").slice(0, 8) || "MW";
  return `${inv.invoiceNumber}-${dt}-${invoiceHash(inv)}`;
}


async function buildInvoicePDF(inv: PublicInvoice): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, W, 32, "F");
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 32, W, 4, "F");
  try {
    const img = await fetch(LOGO_URL).then((r) => r.blob()).then(
      (b) => new Promise<string>((res) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result as string);
        r.readAsDataURL(b);
      }),
    );
    doc.addImage(img, "PNG", 10, 6, 22, 22);
  } catch { /* ignore */ }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("MANOJ WHEELS", 36, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Premium Tyre & Wheel Care Center", 36, 22);
  doc.text("Pulivendula, AP  •  +91 88972 30858", 36, 27);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("VERIFIED INVOICE", W - 10, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Invoice: ${inv.invoiceNumber}`, W - 10, 20, { align: "right" });
  doc.text(`Date: ${inv.date || "—"}`, W - 10, 25, { align: "right" });
  try {
    const qr = await QRCode.toDataURL(`https://manojwheels.online/invoice/${inv.invoiceNumber}`, { width: 220, margin: 1 });
    doc.addImage(qr, "PNG", W - 32, 40, 22, 22);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("Scan to verify", W - 21, 65, { align: "center" });
  } catch { /* ignore */ }

  let y = 46;
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(29, 78, 216);
  doc.setTextColor(255, 255, 255);
  doc.rect(10, y - 5, 100, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("CUSTOMER", 12, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  y += 7;
  const cust: Array<[string, string]> = [
    ["Name", inv.fullName],
    ["Mobile", inv.mobile],
    ["Email", inv.email || "—"],
    ["Vehicle", `${inv.vehicleNumber} (${inv.vehicleType})`],
  ];
  cust.forEach(([k, v]) => {
    doc.setTextColor(110, 110, 110); doc.text(`${k}:`, 12, y);
    doc.setTextColor(20, 20, 20); doc.text(String(v).slice(0, 60), 42, y);
    y += 5.5;
  });

  y += 4;
  doc.setFillColor(29, 78, 216); doc.setTextColor(255, 255, 255);
  doc.rect(10, y - 5, W - 20, 7, "F");
  doc.setFont("helvetica", "bold"); doc.text("SERVICE", 12, y);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  y += 7;
  doc.setTextColor(110, 110, 110); doc.text("Service:", 12, y);
  doc.setTextColor(20, 20, 20); doc.text(inv.service || "—", 42, y);
  y += 5.5;
  doc.setTextColor(110, 110, 110); doc.text("Status:", 12, y);
  doc.setTextColor(20, 20, 20); doc.text(inv.status || "Pending", 42, y);
  y += 5.5;
  if (inv.problem) {
    doc.setTextColor(110, 110, 110); doc.text("Notes:", 12, y);
    const lines = doc.splitTextToSize(inv.problem, W - 60);
    doc.setTextColor(20, 20, 20); doc.text(lines, 42, y);
    y += lines.length * 5 + 2;
  }

  y += 4;
  doc.setFillColor(0, 0, 0); doc.setTextColor(255, 255, 255);
  doc.rect(10, y - 5, W - 20, 7, "F");
  doc.setFont("helvetica", "bold"); doc.text("COST DETAILS", 12, y);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  y += 8;
  const num = (v: string) => Number(v || 0).toFixed(2);
  const rows: Array<[string, string]> = [
    ["Service Cost", `Rs. ${num(inv.cost)}`],
    ["GST", `+ Rs. ${num(inv.gst)}`],
    ["Discount", `- Rs. ${num(inv.discount)}`],
  ];
  rows.forEach(([k, v]) => {
    doc.setTextColor(80, 80, 80); doc.text(k, 14, y);
    doc.text(v, W - 14, y, { align: "right" });
    y += 5.5;
  });
  doc.setDrawColor(220); doc.line(10, y, W - 10, y); y += 6;
  doc.setFillColor(220, 38, 38); doc.rect(10, y - 5, W - 20, 9, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("TOTAL", 14, y);
  doc.text(`Rs. ${num(inv.total)}`, W - 14, y, { align: "right" });
  y += 10;
  doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text(`Payment: ${inv.paymentMode || "—"}`, 14, y);

  // Digital signature + stamped verification block
  y += 14;
  doc.setDrawColor(180); doc.setLineDashPattern([1, 1], 0);
  doc.line(10, y - 6, W - 10, y - 6);
  doc.setLineDashPattern([], 0);

  const sig = invoiceSignature(inv);
  const hash = invoiceHash(inv);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(20, 20, 20);
  doc.text("DIGITALLY SIGNED", 14, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(90, 90, 90);
  doc.text("Verified by Manoj Wheels Service Center", 14, y + 5);
  doc.setFont("courier", "normal"); doc.setFontSize(7.5);
  doc.text(`SIG : ${sig}`, 14, y + 10);
  doc.text(`HASH: ${hash}`, 14, y + 14);

  doc.setFont("helvetica", "italic"); doc.setFontSize(18); doc.setTextColor(29, 78, 216);
  doc.text("Manoj Wheels", W - 14, y + 4, { align: "right" });
  doc.setDrawColor(40); doc.line(W - 70, y + 6, W - 14, y + 6);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(110, 110, 110);
  doc.text("Authorized Signatory", W - 14, y + 11, { align: "right" });

  try {
    const verifyUrl = `${VERIFY_BASE}${inv.invoiceNumber}`;
    const qr2 = await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1 });
    doc.addImage(qr2, "PNG", 14, y + 18, 22, 22);
    doc.setFontSize(7); doc.setTextColor(120, 120, 120);
    doc.text("Scan to re-verify this invoice", 38, y + 24);
    doc.setFontSize(6.5);
    doc.text(verifyUrl, 38, y + 29);
  } catch { /* ignore */ }

  doc.setDrawColor(29, 78, 216); doc.setLineWidth(0.8);
  doc.roundedRect(W - 60, y + 18, 46, 22, 2, 2, "S");
  doc.setTextColor(29, 78, 216); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
  doc.text("AUTHORIZED", W - 37, y + 24, { align: "center" });
  doc.setFontSize(9); doc.text("MANOJ WHEELS", W - 37, y + 30, { align: "center" });
  doc.setFontSize(7); doc.text("SERVICE CENTER", W - 37, y + 35, { align: "center" });
  doc.setLineWidth(0.2);

  doc.setFillColor(0, 0, 0); doc.rect(0, 278, W, 19, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("Thank you for choosing Manoj Wheels.", W / 2, 285, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.text("Drive Safe • Drive Confident", W / 2, 290, { align: "center" });
  doc.setTextColor(220, 38, 38);
  doc.text("www.manojwheels.online", W / 2, 294, { align: "center" });
  return doc;
}


export const Route = createFileRoute("/invoice/$invoiceId")({
  head: ({ params }) => ({
    meta: [
      { title: `Invoice ${params.invoiceId} — Manoj Wheels Verified Service` },
      { name: "description", content: `Verify Manoj Wheels service invoice ${params.invoiceId}.` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PublicInvoicePage,
  errorComponent: ({ error }) => (
    <div className="min-h-[60vh] grid place-items-center p-6 text-center">
      <div>
        <h1 className="text-xl font-bold">Could not load invoice</h1>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => <NotFound />,
});

const TIMELINE = ["Pending", "In Progress", "Completed", "Delivered"] as const;

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || "";
  const color =
    s.includes("deliver") ? "bg-green-600" :
    s.includes("complete") ? "bg-blue-600" :
    s.includes("progress") ? "bg-amber-500" :
    s.includes("cancel") ? "bg-red-600" : "bg-slate-500";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-semibold ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      {status || "Pending"}
    </span>
  );
}

function Timeline({ status }: { status: string }) {
  const s = status?.toLowerCase() || "";
  const idx =
    s.includes("deliver") ? 3 :
    s.includes("complete") ? 2 :
    s.includes("progress") ? 1 : 0;
  return (
    <div className="grid grid-cols-4 gap-2">
      {TIMELINE.map((step, i) => {
        const done = i <= idx;
        return (
          <div key={step} className="flex flex-col items-center text-center">
            <div className={`w-9 h-9 rounded-full grid place-items-center text-xs font-bold transition ${
              done ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30" : "bg-muted text-muted-foreground"
            }`}>
              {done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
            </div>
            <p className={`text-[10px] sm:text-xs mt-1.5 font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>{step}</p>
          </div>
        );
      })}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <Icon className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function NotFound() {
  const { invoiceId } = Route.useParams();
  return (
    <div className="min-h-[80vh] grid place-items-center p-4 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
      <div className="max-w-md w-full bg-card border-2 border-red-500/30 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 grid place-items-center">
          <XCircle className="w-9 h-9 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mt-4 text-red-700 dark:text-red-400">Invalid Invoice</h1>
        <p className="text-sm text-muted-foreground mt-1">Record Not Found</p>
        <p className="text-xs font-mono mt-3 bg-muted rounded px-2 py-1 inline-block">{invoiceId}</p>
        <p className="text-xs text-muted-foreground mt-4">
          This invoice ID is not registered in the Manoj Wheels system.
          If you believe this is an error, please contact us.
        </p>
        <Link to="/" className="inline-block mt-6 text-sm font-medium text-blue-600 hover:underline">← Back to Manoj Wheels</Link>
      </div>
    </div>
  );
}

function PublicInvoicePage() {
  const { invoiceId } = Route.useParams();
  const fetcher = useServerFn(getPublicInvoice);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public-invoice", invoiceId],
    queryFn: () => fetcher({ data: { id: invoiceId } }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    retry: 1,
  });

  if (isLoading) return <InvoiceSkeleton />;
  if (isError) {
    return (
      <div className="min-h-[70vh] grid place-items-center p-4">
        <div className="max-w-md w-full bg-card border-2 border-amber-500/40 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 grid place-items-center">
            <AlertTriangle className="w-9 h-9 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold mt-4 text-amber-700 dark:text-amber-400">Verification Service Unavailable</h1>
          <p className="text-sm text-muted-foreground mt-2">
            We couldn't reach the invoice verification service right now.
          </p>
          <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted rounded px-2 py-1 inline-block">
            {(error as Error)?.message || "Network error"}
          </p>
          <div className="mt-5 flex gap-2 justify-center">
            <Button size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> Try Again
            </Button>
            <Link to="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent px-3 h-9 text-sm">Home</Link>
          </div>
        </div>
      </div>
    );
  }
  if (!data) return <NotFound />;

  return <InvoiceView inv={data} />;
}

function InvoiceSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white dark:from-slate-950 dark:via-blue-950/10 dark:to-background py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-9 w-72 mx-auto rounded-full bg-muted mb-4" />
        <div className="bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-slate-800 to-blue-900" />
          <div className="p-6 space-y-3">
            <div className="h-3 w-32 bg-muted rounded" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 rounded-full bg-muted" />
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
          <div className="px-6 pb-6">
            <div className="h-20 rounded-xl bg-muted" />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          Verifying invoice with Manoj Wheels…
        </div>
      </div>
    </div>
  );
}

function InvoiceView({ inv }: { inv: PublicInvoice }) {
  const serviceFee = Number(inv.total) || 0;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white dark:from-slate-950 dark:via-blue-950/10 dark:to-background py-6 sm:py-10 px-3 sm:px-6 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto">
        {/* Verified banner */}
        <div className="mb-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg shadow-green-600/30">
            <ShieldCheck className="w-4 h-4" />
            VERIFIED MANOJ WHEELS SERVICE RECORD
          </div>
        </div>

        {/* Card */}
        <div className="relative bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden">
          {/* Authorized stamp watermark */}
          <div className="pointer-events-none absolute top-32 right-6 sm:right-10 rotate-[-18deg] opacity-15 print:opacity-25">
            <div className="border-4 border-blue-700 rounded-lg px-4 py-2 text-center">
              <p className="text-blue-700 text-[10px] font-black tracking-widest leading-tight">AUTHORIZED</p>
              <p className="text-blue-700 text-base font-black tracking-wider leading-tight">MANOJ WHEELS</p>
              <p className="text-blue-700 text-[10px] font-black tracking-widest leading-tight">SERVICE CENTER</p>
            </div>
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-black via-slate-900 to-blue-900 text-white p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="https://res.cloudinary.com/dwv8kc9vb/image/upload/v1780845528/Finally_Logo_oxkjjv.png"
                  alt="Manoj Wheels"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-white p-1 object-contain"
                />
                <div>
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight">MANOJ WHEELS</h1>
                  <p className="text-[10px] sm:text-xs text-blue-200">Premium Tyre & Wheel Care Center</p>
                  <p className="text-[10px] sm:text-xs text-blue-300 mt-0.5">Pulivendula, AP • +91 88972 30858</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-blue-200 uppercase tracking-wide">Invoice</p>
                <p className="font-mono text-sm sm:text-base font-bold">{inv.invoiceNumber}</p>
                <div className="mt-2"><StatusBadge status={inv.status} /></div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-5 sm:p-7 border-b border-border/60 bg-muted/30">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-3 font-semibold">Service Status Timeline</p>
            <Timeline status={inv.status} />
          </div>

          {/* Body */}
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-1 p-5 sm:p-7">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Customer</p>
              <Row icon={User} label="Name" value={inv.fullName} />
              <Row icon={Phone} label="Mobile" value={inv.mobile} />
              <Row icon={Mail} label="Email" value={inv.email} />
              <Row icon={Calendar} label="Invoice Date" value={inv.date} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Vehicle & Service</p>
              <Row icon={Car} label="Vehicle Number" value={inv.vehicleNumber} />
              <Row icon={Car} label="Vehicle Type" value={inv.vehicleType} />
              <Row icon={Wrench} label="Service" value={inv.service} />
              <Row icon={Wrench} label="Problem / Notes" value={inv.problem} />
            </div>
          </div>

          {/* Amount */}
          <div className="px-5 sm:px-7 pb-6">
            <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-5 flex items-center justify-between shadow-lg shadow-blue-600/20">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-blue-200">Total Amount</p>
                <p className="text-2xl sm:text-3xl font-black flex items-center gap-1">
                  <IndianRupee className="w-6 h-6" />
                  {serviceFee.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-blue-200">Payment Mode</p>
                <p className="font-bold">{inv.paymentMode || "—"}</p>
              </div>
            </div>
          </div>

          {/* Digital signature */}
          <div className="px-5 sm:px-7 pb-5">
            <div className="flex items-end justify-between gap-4 border-t border-dashed border-border/60 pt-4">
              <div className="text-[10px] text-muted-foreground">
                <p className="uppercase tracking-wide font-semibold mb-1">Digitally Signed</p>
                <p>Verified by Manoj Wheels Service Center</p>
                <p className="font-mono mt-0.5">SIG: {inv.invoiceNumber}-{(inv.date || "").replace(/\D/g, "").slice(0, 8) || "MW"}</p>
              </div>
              <div className="text-right">
                <p className="font-['Brush_Script_MT','Segoe_Script',cursive] text-2xl sm:text-3xl text-blue-700 leading-none">Manoj Wheels</p>
                <div className="border-t border-foreground/70 w-44 ml-auto mt-1" />
                <p className="text-[10px] text-muted-foreground mt-1">Authorized Signatory</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted/40 px-5 sm:px-7 py-4 border-t border-border/60 text-center">
            <p className="text-[11px] text-muted-foreground">
              This is an officially verified service record from <strong>Manoj Wheels</strong>.
              For queries call <a href="tel:+918897230858" className="text-blue-600 font-semibold">+91 88972 30858</a>.
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">www.manojwheels.online</p>
          </div>
        </div>

        <ActionsBar inv={inv} />
      </div>
    </div>
  );
}


function ActionsBar({ inv }: { inv: PublicInvoice }) {
  const fetcherRefetch = useServerFn(getPublicInvoice);
  const { refetch, isFetching } = useQuery({
    queryKey: ["public-invoice", inv.invoiceNumber],
    queryFn: () => fetcherRefetch({ data: { id: inv.invoiceNumber } }),
    enabled: false,
  });
  const [downloading, setDownloading] = useState(false);
  async function handleDownload() {
    setDownloading(true);
    try {
      const doc = await buildInvoicePDF(inv);
      doc.save(`${inv.invoiceNumber}.pdf`);
      toast.success("Invoice PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  }
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2 print:hidden">
      <Button size="sm" onClick={handleDownload} disabled={downloading} className="bg-blue-600 hover:bg-blue-700">
        {downloading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
        Download PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="w-4 h-4 mr-1.5" /> Print
      </Button>
      <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
        <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
      </Button>
      <Link to="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent px-3 h-9 text-sm">
        ← Manoj Wheels Home
      </Link>
    </div>
  );
}
