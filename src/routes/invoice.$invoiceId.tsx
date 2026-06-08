import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicInvoice, type PublicInvoice } from "@/lib/public-invoice.functions";
import { CheckCircle2, ShieldCheck, XCircle, Loader2, Phone, Mail, Car, Wrench, IndianRupee, Calendar, User, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    staleTime: 30_000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground">Verifying invoice…</p>
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6 text-center">
        <p className="text-sm text-red-600">{(error as Error).message}</p>
      </div>
    );
  }
  if (!data) return <NotFound />;

  return <InvoiceView inv={data} />;
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

          {/* Footer */}
          <div className="bg-muted/40 px-5 sm:px-7 py-4 border-t border-border/60 text-center">
            <p className="text-[11px] text-muted-foreground">
              This is an officially verified service record from <strong>Manoj Wheels</strong>.
              For queries call <a href="tel:+918897230858" className="text-blue-600 font-semibold">+91 88972 30858</a>.
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">www.manojwheels.online</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap justify-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1.5" /> Print
          </Button>
          <Link to="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent px-3 h-9 text-sm">
            ← Manoj Wheels Home
          </Link>
        </div>
      </div>
    </div>
  );
}
