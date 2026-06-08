import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAllInvoices, type PublicInvoice } from "@/lib/public-invoice.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, FileSpreadsheet, FileText, RefreshCw, Loader2, BarChart3, IndianRupee, Receipt, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { format, parseISO, isValid } from "date-fns";

function parseDate(v: string): Date | null {
  if (!v) return null;
  const s = v.trim();
  const iso = parseISO(s);
  if (isValid(iso)) return iso;
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (isValid(d)) return d;
  }
  const d = new Date(s);
  return isValid(d) ? d : null;
}

function download(content: string | Blob, filename: string, type: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: PublicInvoice[]): string {
  const headers = [
    "Invoice", "Date", "Customer", "Mobile", "Email",
    "Vehicle No", "Vehicle Type", "Service", "Status",
    "Cost", "GST", "Discount", "Total", "Payment Mode",
  ];
  const esc = (v: string) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.invoiceNumber, r.date, r.fullName, r.mobile, r.email,
      r.vehicleNumber, r.vehicleType, r.service, r.status,
      r.cost, r.gst, r.discount, r.total, r.paymentMode,
    ].map((v) => esc(String(v))).join(","));
  }
  return lines.join("\n");
}

// Excel-compatible HTML table (.xls). Opens cleanly in Excel & Google Sheets.
function toExcelHTML(rows: PublicInvoice[]): string {
  const headers = [
    "Invoice", "Date", "Customer", "Mobile", "Email",
    "Vehicle No", "Vehicle Type", "Service", "Status",
    "Cost", "GST", "Discount", "Total", "Payment Mode",
  ];
  const th = headers.map((h) => `<th style="background:#1d4ed8;color:#fff;padding:6px;border:1px solid #999">${h}</th>`).join("");
  const tr = rows.map((r) => `<tr>${[
    r.invoiceNumber, r.date, r.fullName, r.mobile, r.email,
    r.vehicleNumber, r.vehicleType, r.service, r.status,
    r.cost, r.gst, r.discount, r.total, r.paymentMode,
  ].map((v) => `<td style="padding:5px;border:1px solid #ccc">${String(v ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!))}</td>`).join("")}</tr>`).join("");
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Manoj Wheels Invoices</title></head>
<body><table border="1">${`<thead><tr>${th}</tr></thead><tbody>${tr}</tbody>`}</table></body></html>`;
}

function exportPDF(
  rows: PublicInvoice[],
  meta: { from: string; to: string; service: string; status: string; totalRevenue: number },
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  doc.setFillColor(0, 0, 0); doc.rect(0, 0, W, 22, "F");
  doc.setFillColor(220, 38, 38); doc.rect(0, 22, W, 3, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text("MANOJ WHEELS", 12, 13);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text("Invoice Analytics Report", 12, 19);
  doc.setFontSize(9);
  doc.text(`Generated: ${format(new Date(), "PP p")}`, W - 12, 13, { align: "right" });
  doc.text(`Records: ${rows.length}  •  Revenue: Rs. ${meta.totalRevenue.toFixed(2)}`, W - 12, 19, { align: "right" });

  doc.setTextColor(60, 60, 60); doc.setFontSize(8);
  const filt = `Filters → Range: ${meta.from || "All"} → ${meta.to || "All"}  •  Service: ${meta.service}  •  Status: ${meta.status}`;
  doc.text(filt, 12, 31);

  const headers = ["Invoice", "Date", "Customer", "Vehicle", "Service", "Status", "Total"];
  const colW = [55, 25, 45, 35, 50, 30, 30];
  let y = 40;
  doc.setFillColor(29, 78, 216); doc.setTextColor(255, 255, 255);
  doc.rect(10, y - 5, W - 20, 7, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  let x = 12;
  headers.forEach((h, i) => { doc.text(h, x, y); x += colW[i]; });
  doc.setFont("helvetica", "normal"); doc.setTextColor(20, 20, 20); doc.setFontSize(8);
  y += 7;

  if (!rows.length) {
    doc.setTextColor(120, 120, 120); doc.text("No matching invoices.", 12, y + 4);
  }

  rows.forEach((r, idx) => {
    if (y > 190) { doc.addPage(); y = 16; }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252); doc.rect(10, y - 5, W - 20, 6, "F");
    }
    const cells = [
      r.invoiceNumber, r.date, r.fullName,
      `${r.vehicleNumber} ${r.vehicleType ? `(${r.vehicleType})` : ""}`,
      r.service, r.status, `Rs. ${Number(r.total || 0).toFixed(2)}`,
    ];
    let cx = 12;
    cells.forEach((c, i) => {
      doc.text(String(c).slice(0, Math.floor(colW[i] / 2)), cx, y);
      cx += colW[i];
    });
    y += 6;
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(150);
    doc.text(`manojwheels.online  •  Page ${i} of ${pages}`, W / 2, 205, { align: "center" });
  }
  doc.save(`mw-invoice-analytics-${Date.now()}.pdf`);
}

const STATUSES = ["all", "Pending", "In Progress", "Completed", "Delivered", "Cancelled"] as const;

export function InvoiceAnalytics() {
  const fn = useServerFn(getAllInvoices);
  const { data = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["all-invoices"],
    queryFn: () => fn(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [service, setService] = useState("all");
  const [status, setStatus] = useState("all");

  const serviceTypes = useMemo(() => {
    const s = new Set<string>();
    data.forEach((r) => { if (r.service) s.add(r.service); });
    return ["all", ...Array.from(s).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    const fromD = from ? new Date(from + "T00:00:00") : null;
    const toD = to ? new Date(to + "T23:59:59") : null;
    return data.filter((r) => {
      if (service !== "all" && r.service !== service) return false;
      if (status !== "all" && r.status !== status) return false;
      if (fromD || toD) {
        const d = parseDate(r.date);
        if (!d) return false;
        if (fromD && d < fromD) return false;
        if (toD && d > toD) return false;
      }
      return true;
    });
  }, [data, from, to, service, status]);

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, r) => sum + (Number(r.total) || 0), 0),
    [filtered],
  );
  const avgTicket = filtered.length ? totalRevenue / filtered.length : 0;
  const completed = filtered.filter((r) => /complete|deliver/i.test(r.status)).length;

  function handleCSV() {
    if (!filtered.length) { toast.error("No data to export"); return; }
    download(toCSV(filtered), `mw-invoices-${Date.now()}.csv`, "text/csv");
    toast.success(`Exported ${filtered.length} invoices to CSV`);
  }
  function handleExcel() {
    if (!filtered.length) { toast.error("No data to export"); return; }
    download(toExcelHTML(filtered), `mw-invoices-${Date.now()}.xls`, "application/vnd.ms-excel");
    toast.success(`Exported ${filtered.length} invoices to Excel`);
  }
  function handlePDF() {
    exportPDF(filtered, { from, to, service, status, totalRevenue });
    toast.success(`PDF report ready (${filtered.length} invoices)`);
  }

  return (
    <Card className="backdrop-blur-md bg-card/60 border-primary/20">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Invoice Analytics & Exports
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile icon={Receipt} label="Invoices" value={String(filtered.length)} />
          <StatTile icon={IndianRupee} label="Revenue" value={`₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
          <StatTile icon={TrendingUp} label="Avg Ticket" value={`₹${avgTicket.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
          <StatTile icon={BarChart3} label="Completed" value={`${completed}/${filtered.length}`} />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Service Type</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {serviceTypes.map((s) => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All services" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCSV} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <Button onClick={handleExcel} size="sm" variant="outline" className="border-green-600/40 text-green-700 dark:text-green-400">
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Export Excel
          </Button>
          <Button onClick={handlePDF} size="sm" className="bg-red-600 hover:bg-red-700">
            <FileText className="w-4 h-4 mr-1.5" /> Business Report (PDF)
          </Button>
          <Badge variant="secondary" className="ml-auto">
            {filtered.length} of {data.length} invoices
          </Badge>
        </div>

        {/* Preview */}
        <div className="overflow-x-auto rounded-md border max-h-[420px]">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={7} className="text-center py-6"><Loader2 className="w-4 h-4 animate-spin inline" /> Loading…</TableCell></TableRow>
              )}
              {!isLoading && filtered.slice(0, 100).map((r) => (
                <TableRow key={r.invoiceNumber}>
                  <TableCell className="font-mono text-xs">{r.invoiceNumber}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.fullName}</TableCell>
                  <TableCell>{r.vehicleNumber}</TableCell>
                  <TableCell>{r.service}</TableCell>
                  <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">₹{Number(r.total || 0).toLocaleString("en-IN")}</TableCell>
                </TableRow>
              ))}
              {!isLoading && !filtered.length && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No invoices match the current filters</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 100 && (
          <p className="text-xs text-muted-foreground text-center">Showing first 100 — exports include all {filtered.length} records.</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Receipt; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/40 p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary grid place-items-center">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-base font-bold truncate">{value}</p>
      </div>
    </div>
  );
}
