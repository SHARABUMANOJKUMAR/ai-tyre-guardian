import { createServerFn } from "@tanstack/react-start";

const INVOICES_CSV =
  "https://docs.google.com/spreadsheets/d/1ozWAb4-IyaSkaWq-mIMrSq4DFNBW-IDDS4C7MQYgpGc/export?format=csv";

export type PublicInvoice = {
  invoiceNumber: string;
  date: string;
  fullName: string;
  mobile: string;
  email: string;
  vehicleNumber: string;
  vehicleType: string;
  service: string;
  problem: string;
  cost: string;
  gst: string;
  discount: string;
  total: string;
  paymentMode: string;
  status: string;
  rating: string;
};

function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "", row: string[] = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const non = rows.filter((r) => r.some((c) => c.trim().length > 0));
  if (!non.length) return [];
  const headers = non[0].map((h) => h.trim());
  return non.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
    return obj;
  });
}

function pick(row: Record<string, string>, keys: string[]): string {
  const lower: Record<string, string> = {};
  for (const k of Object.keys(row)) lower[k.toLowerCase().replace(/[\s_-]/g, "")] = row[k];
  for (const k of keys) {
    const v = lower[k.toLowerCase().replace(/[\s_-]/g, "")];
    if (v) return v;
  }
  return "";
}

let cache: { ts: number; rows: Record<string, string>[] } | null = null;
const CACHE_MS = 15_000;

async function loadInvoices(): Promise<Record<string, string>[]> {
  if (cache && Date.now() - cache.ts < CACHE_MS) return cache.rows;
  const url = `${INVOICES_CSV}&cb=${Date.now()}`;
  const r = await fetch(url, { redirect: "follow", cache: "no-store" });
  if (!r.ok) throw new Error(`Sheet fetch failed: ${r.status}`);
  const rows = parseCSV(await r.text());
  cache = { ts: Date.now(), rows };
  return rows;
}

export const getPublicInvoice = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => ({ id: String(d?.id ?? "").trim().toUpperCase() }))
  .handler(async ({ data }): Promise<PublicInvoice | null> => {
    if (!data.id || !/^MW-\d{4}-\d{3,7}$/i.test(data.id)) return null;
    const rows = await loadInvoices().catch(() => [] as Record<string, string>[]);
    const match = rows.find((r) => {
      const inv = pick(r, ["invoiceNumber", "invoiceNo", "invoice", "invoiceId"]);
      return inv.trim().toUpperCase() === data.id;
    });
    if (!match) return null;
    return {
      invoiceNumber: pick(match, ["invoiceNumber", "invoiceNo", "invoice"]),
      date: pick(match, ["date", "createdAt", "timestamp"]),
      fullName: pick(match, ["fullName", "customer", "name", "customerName"]),
      mobile: pick(match, ["mobile", "phone", "phoneNumber", "contact"]),
      email: pick(match, ["email", "emailAddress"]),
      vehicleNumber: pick(match, ["vehicleNumber", "vehicleNo", "vehicle"]),
      vehicleType: pick(match, ["vehicleType", "type"]),
      service: pick(match, ["service", "serviceType", "serviceNeeded"]),
      problem: pick(match, ["problem", "issue", "description", "notes"]),
      cost: pick(match, ["cost", "amount", "price"]),
      gst: pick(match, ["gst", "tax"]),
      discount: pick(match, ["discount"]),
      total: pick(match, ["total", "grandTotal", "finalAmount"]),
      paymentMode: pick(match, ["paymentMode", "payment", "paymentMethod"]),
      status: pick(match, ["status", "serviceStatus", "currentStatus"]),
      rating: pick(match, ["rating", "stars"]),
    };
  });
