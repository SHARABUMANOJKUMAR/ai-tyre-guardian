import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  FileText,
  Star,
  Download,
  Printer,
  Mail,
  MessageCircle,
  Loader2,
  Receipt,
  IndianRupee,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";
import { sendInvoiceEmail } from "@/lib/invoice-email.functions";

const LOGO_URL =
  "https://res.cloudinary.com/dwv8kc9vb/image/upload/v1780845528/Finally_Logo_oxkjjv.png";
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzfalbVv-D4G33l9KA_mUPe7s8uQsWlDeSMaAEtV_cjN77iFlwj5pmrnw-gMa3lFIEW/exec";
const INVOICES_CSV =
  "https://docs.google.com/spreadsheets/d/1ozWAb4-IyaSkaWq-mIMrSq4DFNBW-IDDS4C7MQYgpGc/export?format=csv";
const STORAGE_KEY = "mw_invoices_local_v1";
const COLORS = ["#dc2626", "#1d4ed8", "#000000", "#f59e0b", "#10b981", "#a855f7", "#ec4899"];

const VEHICLE_TYPES = [
  "Car",
  "SUV",
  "Bike",
  "Tractor",
  "Truck",
  "Bus",
  "Van",
  "Earthmover",
] as const;
const SERVICES = [
  "Wheel Alignment",
  "Wheel Balancing",
  "Puncture Repair",
  "Nitrogen Air Filling",
  "Tyre Rotation",
  "Tyre Health Check",
  "Car Care Services",
  "Other Service",
] as const;
const STATUSES = ["Pending", "In Progress", "Completed", "Delivered"] as const;
const PAYMENT_MODES = [
  "Cash",
  "UPI",
  "PhonePe",
  "Google Pay",
  "Paytm",
  "Card",
  "Bank Transfer",
] as const;

type InvoiceRecord = {
  invoiceNumber: string;
  date: string;
  fullName: string;
  mobile: string;
  email: string;
  vehicleNumber: string;
  vehicleType: string;
  service: string;
  otherService: string;
  problem: string;
  cost: number;
  gst: number;
  discount: number;
  total: number;
  paymentMode: string;
  status: string;
  rating: number;
  createdAt: number;
  whatsappMessage?: string;
  invoiceUrl?: string;
};

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim().length > 0));
  if (!nonEmpty.length) return [];
  const headers = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (r[i] ?? "").trim();
    });
    return obj;
  });
}

function rowValue(row: Record<string, string>, keys: string[]): string {
  const normalized: Record<string, string> = {};
  for (const key of Object.keys(row)) {
    normalized[key.toLowerCase().replace(/[\s_-]/g, "")] = row[key];
  }
  for (const key of keys) {
    const value = normalized[key.toLowerCase().replace(/[\s_-]/g, "")];
    if (value) return value;
  }
  return "";
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

function extractInvoiceId(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const obj = value as Record<string, unknown>;
  const directKeys = [
    "invoiceId",
    "invoice_id",
    "Invoice_ID",
    "Invoice Id",
    "invoiceNumber",
    "Invoice_Number",
    "invoiceNo",
    "id",
  ];
  for (const key of directKeys) {
    const found = obj[key];
    if (typeof found === "string" && /^MW-/i.test(found.trim())) return found.trim();
  }
  for (const nestedKey of ["invoice", "data", "result", "record"]) {
    const nested = extractInvoiceId(obj[nestedKey]);
    if (nested) return nested;
  }
  return "";
}

async function findLatestSheetInvoiceId(payload: Record<string, string>): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 900));
    const res = await fetch(`${INVOICES_CSV}&cb=${Date.now()}`, {
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) continue;
    const rows = parseCSV(await res.text()).reverse();
    const match = rows.find((row) => {
      const id = rowValue(row, ["invoiceId", "invoiceNumber", "invoiceNo", "invoice", "id"]);
      if (!/^MW-/i.test(id)) return false;
      return (
        rowValue(row, ["fullName", "customer", "name", "customerName"]).trim().toLowerCase() ===
          payload.fullName.trim().toLowerCase() &&
        normalizePhone(rowValue(row, ["mobile", "phone", "phoneNumber", "contact"])) ===
          normalizePhone(payload.mobile) &&
        rowValue(row, ["vehicleNumber", "vehicleNo", "vehicle"]).trim().toUpperCase() ===
          payload.vehicleNumber.trim().toUpperCase() &&
        rowValue(row, ["service", "serviceType", "serviceNeeded"]).trim() === payload.service.trim() &&
        rowValue(row, ["total", "grandTotal", "finalAmount"]).trim() === payload.total.trim()
      );
    });
    const id = match
      ? rowValue(match, ["invoiceId", "invoiceNumber", "invoiceNo", "invoice", "id"]).trim()
      : "";
    if (/^MW-/i.test(id)) return id;
  }
  return "";
}

export type AppsScriptInvoiceResponse = {
  invoiceId: string;
  invoiceUrl?: string;
  whatsappMessage?: string;
};

// Submit invoice to Apps Script and return the authoritative invoiceId.
// Throws if Apps Script is unreachable or does not return a valid invoiceId.
// Never generate IDs on the client — the sheet is the single source of truth.
async function submitToAppsScript(
  payload: Record<string, string>,
): Promise<AppsScriptInvoiceResponse> {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "create_invoice", ...payload }),
  });
  if (!res.ok) throw new Error(`Apps Script HTTP ${res.status}`);
  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Apps Script returned a non-JSON response");
  }
  if (json.success === false) {
    throw new Error(String(json.message || "Apps Script rejected the invoice"));
  }
  const invoiceUrl = typeof json.invoiceUrl === "string" ? json.invoiceUrl : undefined;
  const whatsappMessage =
    typeof json.whatsappMessage === "string" ? json.whatsappMessage : undefined;

  const returned = extractInvoiceId(json);
  if (returned) return { invoiceId: returned, invoiceUrl, whatsappMessage };

  const recovered = await findLatestSheetInvoiceId(payload);
  if (!recovered) {
    throw new Error(
      "Invoice was saved, but no invoiceId was returned. Please try Generate again in a few seconds.",
    );
  }
  console.warn("Apps Script response omitted invoiceId; recovered from sheet:", recovered);
  return { invoiceId: recovered, invoiceUrl, whatsappMessage };
}

function loadInvoices(): InvoiceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? (JSON.parse(r) as InvoiceRecord[]) : [];
  } catch {
    return [];
  }
}

function saveInvoices(list: InvoiceRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 500)));
}

async function buildPDF(inv: InvoiceRecord): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;

  // Header band - black gradient feel
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, W, 32, "F");
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 32, W, 4, "F");

  // Logo
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
  doc.text("South India's Trusted Wheel & Car Care Hub", 36, 22);
  doc.text("Pulivendula, YSR Kadapa District, AP", 36, 27);

  // Invoice info top-right
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE / JOB CARD", W - 10, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Invoice No: ${inv.invoiceNumber}`, W - 10, 20, { align: "right" });
  doc.text(`Date: ${inv.date}`, W - 10, 25, { align: "right" });

  // QR Code → public verification URL (scan opens branded verification page)
  try {
    const verifyUrl = `https://manojwheels.online/invoice/${inv.invoiceNumber}`;
    const qrData = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 1 });
    doc.addImage(qrData, "PNG", W - 32, 40, 22, 22);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Scan to verify", W - 21, 65, { align: "center" });
  } catch { /* ignore */ }

  // Customer info
  let y = 46;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setFillColor(29, 78, 216);
  doc.setTextColor(255, 255, 255);
  doc.rect(10, y - 5, 100, 7, "F");
  doc.text("CUSTOMER INFORMATION", 12, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  y += 7;
  const cust: Array<[string, string]> = [
    ["Name", inv.fullName],
    ["Mobile", inv.mobile],
    ["Email", inv.email || "—"],
    ["Vehicle No.", inv.vehicleNumber],
    ["Vehicle Type", inv.vehicleType],
  ];
  cust.forEach(([k, v]) => {
    doc.setTextColor(110, 110, 110);
    doc.text(`${k}:`, 12, y);
    doc.setTextColor(20, 20, 20);
    doc.text(String(v).slice(0, 60), 42, y);
    y += 5.5;
  });

  // Service info
  y += 4;
  doc.setFillColor(29, 78, 216);
  doc.setTextColor(255, 255, 255);
  doc.rect(10, y - 5, W - 20, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.text("SERVICE INFORMATION", 12, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  y += 7;
  doc.setTextColor(110, 110, 110);
  doc.text("Service:", 12, y);
  doc.setTextColor(20, 20, 20);
  const svc = inv.service === "Other Service" && inv.otherService ? inv.otherService : inv.service;
  doc.text(svc, 42, y);
  y += 5.5;
  doc.setTextColor(110, 110, 110);
  doc.text("Problem:", 12, y);
  doc.setTextColor(20, 20, 20);
  const probLines = doc.splitTextToSize(inv.problem || "—", W - 60);
  doc.text(probLines, 42, y);
  y += probLines.length * 5 + 2;

  // Cost
  y += 4;
  doc.setFillColor(0, 0, 0);
  doc.setTextColor(255, 255, 255);
  doc.rect(10, y - 5, W - 20, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.text("COST DETAILS", 12, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  y += 8;

  const costRows: Array<[string, string]> = [
    ["Service Cost", `Rs. ${inv.cost.toFixed(2)}`],
    ["GST", `+ Rs. ${inv.gst.toFixed(2)}`],
    ["Discount", `- Rs. ${inv.discount.toFixed(2)}`],
  ];
  costRows.forEach(([k, v]) => {
    doc.setTextColor(80, 80, 80);
    doc.text(k, 14, y);
    doc.text(v, W - 14, y, { align: "right" });
    y += 5.5;
  });
  doc.setDrawColor(220);
  doc.line(10, y, W - 10, y);
  y += 6;
  doc.setFillColor(220, 38, 38);
  doc.rect(10, y - 5, W - 20, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL", 14, y);
  doc.text(`Rs. ${inv.total.toFixed(2)}`, W - 14, y, { align: "right" });
  y += 10;

  // Payment / Status / Rating
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Payment Mode: ${inv.paymentMode}   •   Status: ${inv.status}`, 14, y);
  if (inv.rating) {
    doc.text(`Rating: ${"*".repeat(inv.rating)} (${inv.rating}/5)`, 14, y + 5);
    y += 5;
  }

  // Signature
  y = 250;
  doc.setDrawColor(180);
  doc.line(14, y, 70, y);
  doc.setTextColor(29, 78, 216);
  doc.setFont("times", "italic");
  doc.setFontSize(16);
  doc.text("Manoj Wheels", 16, y - 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Authorized Signature", 14, y + 5);

  // Circular stamp bottom-right
  const cx = W - 35;
  const cy = 252;
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, 16);
  doc.circle(cx, cy, 13);
  doc.setTextColor(29, 78, 216);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("MANOJ WHEELS", cx, cy - 4, { align: "center" });
  doc.setFontSize(5.5);
  doc.text("AUTHORIZED SERVICE", cx, cy + 1, { align: "center" });
  doc.text("CENTER", cx, cy + 4, { align: "center" });
  doc.setFontSize(6);
  doc.text("PULIVENDULA", cx, cy + 9, { align: "center" });
  doc.setLineWidth(0.2);

  // Footer
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 278, W, 19, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Thank you for choosing Manoj Wheels.", W / 2, 285, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Drive Safe • Drive Confident", W / 2, 290, { align: "center" });
  doc.setTextColor(220, 38, 38);
  doc.text("www.manojwheels.online", W / 2, 294, { align: "center" });

  return doc;
}

function pdfToBase64(doc: jsPDF): string {
  const out = doc.output("datauristring");
  return out.split(",")[1] ?? "";
}

export function InvoiceManager({ token }: { token: string }) {
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [lastSavedRec, setLastSavedRec] = useState<InvoiceRecord | null>(null);
  const [date] = useState(todayStr());
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<string>("Car");
  const [service, setService] = useState<string>("Wheel Alignment");
  const [otherService, setOtherService] = useState("");
  const [problem, setProblem] = useState("");
  const [cost, setCost] = useState<string>("");
  const [gst, setGst] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [status, setStatus] = useState<string>("Pending");
  const [rating, setRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [savedList, setSavedList] = useState<InvoiceRecord[]>(() => loadInvoices());
  const [qrPreview, setQrPreview] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  const totals = useMemo(() => {
    const c = parseFloat(cost) || 0;
    const g = parseFloat(gst) || 0;
    const d = parseFloat(discount) || 0;
    return { c, g, d, total: Math.max(0, c + g - d) };
  }, [cost, gst, discount]);

  useEffect(() => {
    if (!invoiceNumber) { setQrPreview(""); return; }
    const verifyUrl = `https://manojwheels.online/invoice/${invoiceNumber}`;
    QRCode.toDataURL(verifyUrl, { width: 220, margin: 1 }).then(setQrPreview).catch(() => setQrPreview(""));
  }, [invoiceNumber]);

  const showRating = status === "Completed" || status === "Delivered";

  function buildRecord(): InvoiceRecord {
    return {
      invoiceNumber,
      date,
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleType,
      service,
      otherService: service === "Other Service" ? otherService.trim() : "",
      problem: problem.trim(),
      cost: totals.c,
      gst: totals.g,
      discount: totals.d,
      total: totals.total,
      paymentMode,
      status,
      rating,
      createdAt: Date.now(),
    };
  }

  function validate(): string | null {
    if (!fullName.trim()) return "Customer name is required";
    if (!/^\d{10}$/.test(mobile.trim())) return "Mobile must be 10 digits";
    if (!vehicleNumber.trim()) return "Vehicle number is required";
    if (!service) return "Service is required";
    if (service === "Other Service" && !otherService.trim()) return "Specify the other service";
    if (totals.c <= 0) return "Service cost must be greater than 0";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return "Invalid email format";
    return null;
  }

  function resetForm() {
    setInvoiceNumber("");
    setFullName("");
    setMobile("");
    setEmail("");
    setVehicleNumber("");
    setVehicleType("Car");
    setService("Wheel Alignment");
    setOtherService("");
    setProblem("");
    setCost("");
    setGst("");
    setDiscount("");
    setPaymentMode("Cash");
    setStatus("Pending");
    setRating(0);
  }

  async function handleGenerate() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    const baseRec = buildRecord();
    try {
      // 1. Submit to Apps Script FIRST and wait for the authoritative invoiceId.
      //    Never use a client-generated ID — the sheet is the single source of truth.
      const response = await submitToAppsScript({
        fullName: baseRec.fullName,
        mobile: baseRec.mobile,
        email: baseRec.email,
        vehicleNumber: baseRec.vehicleNumber,
        vehicleType: baseRec.vehicleType,
        service: baseRec.service,
        otherService: baseRec.otherService,
        problem: baseRec.problem,
        cost: String(baseRec.cost),
        gst: String(baseRec.gst),
        discount: String(baseRec.discount),
        total: String(baseRec.total),
        paymentMode: baseRec.paymentMode,
        status: baseRec.status,
        rating: String(baseRec.rating),
        date: baseRec.date,
      });
      const returnedId = response.invoiceId;
      if (!returnedId) throw new Error("Missing invoiceId from Apps Script");

      // 2. Use ONLY the returned invoiceId in record, QR, PDF, email, WhatsApp.
      const rec: InvoiceRecord = {
        ...baseRec,
        invoiceNumber: returnedId,
        whatsappMessage: response.whatsappMessage,
        invoiceUrl: response.invoiceUrl,
      };

      // 3. Log all IDs to confirm they match.
      console.log("Generated Invoice ID from Apps Script:", returnedId);
      console.log("QR Invoice ID:", rec.invoiceNumber);
      console.log("Saved Invoice ID:", rec.invoiceNumber);

      // Save locally for dashboard analytics
      const list = [rec, ...loadInvoices()];
      saveInvoices(list);
      setSavedList(list);
      setLastSavedRec(rec);
      setInvoiceNumber(returnedId);

      // Build + download PDF (uses sheet's authoritative invoiceId)
      const doc = await buildPDF(rec);
      doc.save(`${rec.invoiceNumber}.pdf`);

      toast.success(`✅ Invoice ${returnedId} generated`);
    } catch (e) {
      console.error("Invoice generation failed", e);
      toast.error(e instanceof Error ? e.message : "Failed to generate invoice");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePrintPreview() {
    if (!lastSavedRec) {
      toast.error("Please generate the invoice first to get an authoritative ID");
      return;
    }
    const doc = await buildPDF(lastSavedRec);
    window.open(doc.output("bloburl"), "_blank");
  }

  const sendEmailFn = useServerFn(sendInvoiceEmail);
  async function handleEmail() {
    if (!lastSavedRec) {
      toast.error("Please generate the invoice first to get an authoritative ID");
      return;
    }
    if (!lastSavedRec.email) { toast.error("Customer email required to send"); return; }
    setEmailing(true);
    try {
      const rec = lastSavedRec;
      const doc = await buildPDF(rec);
      const base64 = pdfToBase64(doc);
      console.log("Email Invoice ID:", rec.invoiceNumber);
      await sendEmailFn({
        data: {
          token,
          toEmail: rec.email,
          invoiceNumber: rec.invoiceNumber,
          customerName: rec.fullName,
          vehicleNumber: rec.vehicleNumber,
          service: rec.service === "Other Service" ? rec.otherService : rec.service,
          total: rec.total.toFixed(2),
          pdfBase64: base64,
        },
      });
      toast.success("Invoice emailed successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Email failed");
    } finally {
      setEmailing(false);
    }
  }

  function handleWhatsApp() {
    if (!lastSavedRec) {
      toast.error("Please generate the invoice first to get an authoritative ID");
      return;
    }
    const rec = lastSavedRec;
    const svc = rec.service === "Other Service" ? rec.otherService : rec.service;
    console.log("WhatsApp Invoice ID:", rec.invoiceNumber);
    const text = encodeURIComponent(
      `*Manoj Wheels — Service Invoice*\n\n` +
      `Invoice: ${rec.invoiceNumber}\n` +
      `Verify: https://manojwheels.online/invoice/${rec.invoiceNumber}\n` +
      `Date: ${rec.date}\n` +
      `Customer: ${rec.fullName}\n` +
      `Vehicle: ${rec.vehicleNumber} (${rec.vehicleType})\n` +
      `Service: ${svc}\n` +
      `Total: ₹${rec.total.toFixed(2)}\n` +
      `Payment: ${rec.paymentMode} • Status: ${rec.status}\n\n` +
      `Thank you for choosing Manoj Wheels.\nwww.manojwheels.online`,
    );
    const phone = rec.mobile.replace(/\D/g, "");
    const url = phone
      ? `https://wa.me/91${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  // Analytics
  const analytics = useMemo(() => {
    const today = todayStr();
    const monthKey = today.slice(3); // mm-yyyy
    const totalRev = savedList.reduce((s, i) => s + i.total, 0);
    const todayRev = savedList.filter((i) => i.date === today).reduce((s, i) => s + i.total, 0);
    const monthRev = savedList.filter((i) => i.date.slice(3) === monthKey).reduce((s, i) => s + i.total, 0);
    const completed = savedList.filter((i) => i.status === "Completed" || i.status === "Delivered").length;
    const pending = savedList.filter((i) => i.status === "Pending" || i.status === "In Progress").length;

    const last7 = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const k = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
      return {
        day: k.slice(0, 5),
        revenue: savedList.filter((i) => i.date === k).reduce((s, i) => s + i.total, 0),
      };
    });
    const byService = Object.entries(
      savedList.reduce<Record<string, number>>((acc, i) => {
        const k = i.service === "Other Service" ? (i.otherService || "Other") : i.service;
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));
    const byVehicle = Object.entries(
      savedList.reduce<Record<string, number>>((acc, i) => {
        acc[i.vehicleType] = (acc[i.vehicleType] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));
    const byPayment = Object.entries(
      savedList.reduce<Record<string, number>>((acc, i) => {
        acc[i.paymentMode] = (acc[i.paymentMode] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value }));

    return { totalRev, todayRev, monthRev, completed, pending, last7, byService, byVehicle, byPayment };
  }, [savedList]);

  return (
    <div className="space-y-6">
      {/* Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatTile icon={Receipt} label="Total Invoices" value={savedList.length} accent="from-red-600 to-black" />
        <StatTile icon={IndianRupee} label="Today's Revenue" value={`₹${analytics.todayRev.toFixed(0)}`} accent="from-blue-600 to-black" />
        <StatTile icon={IndianRupee} label="Monthly Revenue" value={`₹${analytics.monthRev.toFixed(0)}`} accent="from-red-600 to-blue-700" />
        <StatTile icon={CheckCircle2} label="Completed" value={analytics.completed} accent="from-emerald-600 to-blue-700" />
        <StatTile icon={Clock} label="Pending" value={analytics.pending} accent="from-amber-500 to-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card/70 backdrop-blur-md border-primary/20">
          <CardHeader><CardTitle className="text-sm">Revenue (Last 7 Days)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={analytics.last7}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-card/70 backdrop-blur-md border-primary/20">
          <CardHeader><CardTitle className="text-sm">Service Distribution</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={analytics.byService} dataKey="value" nameKey="name" outerRadius={80} label>
                  {analytics.byService.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-card/70 backdrop-blur-md border-primary/20">
          <CardHeader><CardTitle className="text-sm">Vehicle Type</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={analytics.byVehicle} dataKey="value" nameKey="name" outerRadius={80} label>
                  {analytics.byVehicle.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-card/70 backdrop-blur-md border-primary/20">
          <CardHeader><CardTitle className="text-sm">Payment Modes</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={analytics.byPayment} dataKey="value" nameKey="name" outerRadius={80} label>
                  {analytics.byPayment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Form */}
        <Card className="xl:col-span-3 bg-card/70 backdrop-blur-md border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Create Invoice
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-mono">{invoiceNumber || "ID assigned after Generate"}</Badge>
              <Badge variant="outline">{date}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Section title="Customer Details" tone="blue">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full Name *"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} /></Field>
                <Field label="Mobile Number *"><Input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10 digits" /></Field>
                <Field label="Email Address"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                <Field label="Vehicle Number *"><Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} placeholder="AP39AB1234" maxLength={20} /></Field>
                <Field label="Vehicle Type">
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Service Details" tone="red">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Service *">
                  <Select value={service} onValueChange={setService}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                {service === "Other Service" && (
                  <Field label="Other Service Name *">
                    <Input value={otherService} onChange={(e) => setOtherService(e.target.value)} maxLength={120} />
                  </Field>
                )}
              </div>
              <Field label="Vehicle Problem">
                <Textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. Steering vibration at high speed • Vehicle pulling left side • Tyre wear uneven • Air leakage in rear tyre"
                />
              </Field>
            </Section>

            <Section title="Cost Details" tone="black">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Service Cost *"><Input type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
                <Field label="GST"><Input type="number" min={0} value={gst} onChange={(e) => setGst(e.target.value)} /></Field>
                <Field label="Discount"><Input type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-black via-red-600 to-blue-700 text-white p-4 font-mono text-sm">
                <div className="flex justify-between"><span>Cost</span><span>₹{totals.c.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>+ GST</span><span>+ ₹{totals.g.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>- Discount</span><span>- ₹{totals.d.toFixed(2)}</span></div>
                <div className="border-t border-white/30 my-2"></div>
                <div className="flex justify-between text-lg font-bold"><span>TOTAL</span><span>₹{totals.total.toFixed(2)}</span></div>
              </div>
            </Section>

            <Section title="Status & Payment" tone="blue">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Service Status">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Payment Mode">
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_MODES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {showRating && (
                <Field label="Customer Rating">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n === rating ? 0 : n)}
                        aria-label={`${n} star`}
                      >
                        <Star
                          className={`w-7 h-7 transition ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                        />
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </Section>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleGenerate} disabled={submitting} className="bg-gradient-to-r from-red-600 to-black hover:from-red-700 hover:to-black">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Generate Invoice
              </Button>
              <Button variant="outline" onClick={handlePrintPreview}><Printer className="w-4 h-4 mr-2" /> Print Preview</Button>
              <Button variant="outline" onClick={handleEmail} disabled={emailing}>
                {emailing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Email Invoice
              </Button>
              <Button variant="outline" onClick={handleWhatsApp} className="text-green-600 border-green-600/40">
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card className="xl:col-span-2 bg-white text-black border-border/60 sticky top-4 self-start">
          <CardHeader className="bg-gradient-to-r from-black via-red-600 to-blue-700 text-white">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <img src={LOGO_URL} alt="Manoj Wheels" className="h-9 w-9 object-contain bg-white/10 rounded p-1" />
                <div>
                  <CardTitle className="text-sm">MANOJ WHEELS</CardTitle>
                  <p className="text-[10px] opacity-90">South India's Trusted Wheel & Car Care Hub</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] opacity-80">INVOICE</p>
                <p className="text-xs font-mono">{invoiceNumber || "—"}</p>
                <p className="text-[10px]">{date}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent ref={printRef} className="p-4 space-y-3 text-xs">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <p className="font-bold text-[11px] text-blue-700">CUSTOMER</p>
                <p className="font-semibold">{fullName || "Customer Name"}</p>
                <p className="text-muted-foreground">{mobile || "Mobile"}</p>
                <p className="text-muted-foreground">{email || "—"}</p>
                <p className="font-mono">{vehicleNumber || "Vehicle No"} ({vehicleType})</p>
              </div>
              {qrPreview && <img src={qrPreview} alt="QR" className="w-20 h-20" />}
            </div>

            <div>
              <p className="font-bold text-[11px] text-blue-700">SERVICE</p>
              <p>{service === "Other Service" ? (otherService || "—") : service}</p>
              {problem && <p className="text-muted-foreground mt-1">{problem}</p>}
            </div>

            <div className="space-y-1 border-t pt-2">
              <div className="flex justify-between"><span>Service Cost</span><span>₹{totals.c.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>+ GST</span><span>₹{totals.g.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>- Discount</span><span>₹{totals.d.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base bg-red-600 text-white px-2 py-1 rounded mt-1">
                <span>TOTAL</span><span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-[10px] text-muted-foreground border-t pt-2">
              <span>{paymentMode} • {status}</span>
              {rating > 0 && <span>{"⭐".repeat(rating)}</span>}
            </div>

            <div className="relative pt-6">
              <div>
                <p className="font-serif italic text-blue-700 text-lg leading-none">Manoj Wheels</p>
                <p className="text-[9px] border-t border-gray-400 pt-0.5 inline-block">Authorized Signature</p>
              </div>
              <div className="absolute right-2 bottom-0 opacity-60">
                <div className="rounded-full border-2 border-blue-700 w-20 h-20 flex items-center justify-center text-blue-700 text-center rotate-[-8deg]">
                  <div className="text-[7px] font-bold leading-tight">
                    MANOJ WHEELS<br/>
                    <span className="text-[6px]">AUTHORIZED<br/>SERVICE CENTER</span><br/>
                    <span className="text-[7px]">PULIVENDULA</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-muted-foreground border-t pt-2">
              Thank you for choosing Manoj Wheels • Drive Safe • Drive Confident<br/>
              <a className="text-red-600">www.manojwheels.online</a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saved invoices */}
      {savedList.length > 0 && (
        <Card className="bg-card/70 backdrop-blur-md border-border/60">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" /> Recent Invoices ({savedList.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground border-b">
                <tr>
                  <th className="p-2">Invoice</th><th className="p-2">Date</th><th className="p-2">Customer</th>
                  <th className="p-2">Vehicle</th><th className="p-2">Service</th><th className="p-2">Total</th>
                  <th className="p-2">Status</th><th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {savedList.slice(0, 25).map((i) => (
                  <tr key={i.invoiceNumber} className="border-b hover:bg-accent/30">
                    <td className="p-2 font-mono">{i.invoiceNumber}</td>
                    <td className="p-2">{i.date}</td>
                    <td className="p-2">{i.fullName}</td>
                    <td className="p-2 font-mono">{i.vehicleNumber}</td>
                    <td className="p-2">{i.service === "Other Service" ? i.otherService : i.service}</td>
                    <td className="p-2 font-semibold">₹{i.total.toFixed(0)}</td>
                    <td className="p-2"><Badge variant={i.status === "Delivered" || i.status === "Completed" ? "default" : "secondary"}>{i.status}</Badge></td>
                    <td className="p-2">
                      <Button size="sm" variant="ghost" onClick={async () => {
                        const doc = await buildPDF(i);
                        doc.save(`${i.invoiceNumber}.pdf`);
                      }}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatTile({
  icon: Icon, label, value, accent,
}: { icon: typeof Receipt; label: string; value: string | number; accent: string }) {
  return (
    <Card className={`bg-gradient-to-br ${accent} text-white border-0 shadow-lg`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
          </div>
          <Icon className="w-7 h-7 opacity-70" />
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, tone, children }: { title: string; tone: "red" | "blue" | "black"; children: React.ReactNode }) {
  const bar = tone === "red" ? "bg-red-600" : tone === "blue" ? "bg-blue-600" : "bg-black";
  return (
    <div className="space-y-3">
      <div className={`${bar} text-white text-xs font-semibold tracking-wide px-3 py-1.5 rounded-md inline-block`}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
