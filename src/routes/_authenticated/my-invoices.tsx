import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getInvoicesForUser, type InvoiceStatusRow } from "@/lib/public-invoice.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Printer, ExternalLink, Loader2, Receipt, IndianRupee, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-invoices")({
  head: () => ({ meta: [{ title: "My Invoices · Manoj Wheels" }, { name: "robots", content: "noindex" }] }),
  component: MyInvoicesPage,
});

function statusColor(s: string) {
  const k = s.toLowerCase();
  if (k.includes("deliver")) return "bg-green-600";
  if (k.includes("complete")) return "bg-blue-600";
  if (k.includes("progress")) return "bg-amber-500";
  if (k.includes("cancel")) return "bg-red-600";
  return "bg-slate-500";
}

function MyInvoicesPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const fetcher = useServerFn(getInvoicesForUser);

  const email = user?.email ?? "";
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const mobile = String(meta.phone_number ?? meta.phone ?? "");

  const { data = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["my-invoices", email, mobile],
    queryFn: () => fetcher({ data: { email, mobile } }),
    enabled: !!(email || mobile),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((r) =>
      [r.invoiceNumber, r.service, r.status, r.vehicleNumber, r.paymentMode, r.date]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [data, q]);

  const totalSpent = useMemo(
    () => data.reduce((sum, r) => sum + (Number(r.total) || 0), 0),
    [data],
  );

  return (
    <div className="container max-w-5xl px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-blue-600" /> My Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live history from Manoj Wheels — synced with your service records.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-black">{data.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Spent</p>
          <p className="text-2xl font-black flex items-center"><IndianRupee className="w-5 h-5" />{totalSpent.toLocaleString("en-IN")}</p>
        </Card>
        <Card className="p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-2xl font-black text-green-600">
            {data.filter((r) => /complete|deliver/i.test(r.status)).length}
          </p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by invoice ID, service, vehicle, status…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : !data.length ? (
        <Card className="p-10 text-center">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="mt-3 font-semibold">No invoices yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Invoices created for {email || mobile || "your account"} will appear here automatically.
          </p>
        </Card>
      ) : !filtered.length ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No invoices match "{q}"</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => <InvoiceRow key={r.invoiceNumber} r={r} />)}
        </div>
      )}
    </div>
  );
}

function InvoiceRow({ r }: { r: InvoiceStatusRow }) {
  return (
    <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs sm:text-sm font-bold">{r.invoiceNumber}</span>
            <Badge className={`${statusColor(r.status)} text-white border-0`}>{r.status}</Badge>
          </div>
          <p className="text-sm font-semibold mt-1 truncate">{r.service || "Service"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {r.vehicleNumber || "—"} • {r.date || ""} {r.paymentMode ? `• ${r.paymentMode}` : ""}
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
          <p className="text-lg font-black flex items-center">
            <IndianRupee className="w-4 h-4" />{Number(r.total || 0).toLocaleString("en-IN")}
          </p>
          <div className="flex gap-1.5">
            <Button asChild size="sm" variant="outline">
              <Link to="/invoice/$invoiceId" params={{ invoiceId: r.invoiceNumber }}>
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const url = `/invoice/${encodeURIComponent(r.invoiceNumber)}`;
                const w = window.open(url, "_blank");
                if (w) {
                  // Trigger print once the verification page loads
                  setTimeout(() => { try { w.focus(); w.print(); } catch { /* ignore */ } }, 1500);
                }
              }}
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
