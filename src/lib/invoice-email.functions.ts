import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyAdminToken } from "@/lib/admin-auth.functions";

const VERIFIED_FROM = "manojwheels.official@gmail.com";
const LOGO = "https://res.cloudinary.com/dwv8kc9vb/image/upload/v1780845528/Finally_Logo_oxkjjv.png";

const schema = z.object({
  token: z.string().min(1),
  toEmail: z.string().trim().toLowerCase().email().max(160),
  invoiceNumber: z.string().min(1).max(40),
  customerName: z.string().min(1).max(120),
  vehicleNumber: z.string().min(1).max(40),
  service: z.string().min(1).max(120),
  total: z.string().min(1).max(20),
  pdfBase64: z.string().min(50).max(8_000_000),
});

function esc(v: string) {
  return v.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

export const sendInvoiceEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    if (!verifyAdminToken(data.token)) throw new Error("Unauthorized");

    const brevoKey = process.env.BREVO_API_KEY;
    if (!brevoKey) throw new Error("Email service not configured");
    const lovableKey = process.env.LOVABLE_API_KEY;
    const useGateway = !!lovableKey;
    const url = useGateway
      ? "https://connector-gateway.lovable.dev/brevo/smtp/email"
      : "https://api.brevo.com/v3/smtp/email";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      accept: "application/json",
    };
    if (useGateway) {
      headers["Authorization"] = `Bearer ${lovableKey}`;
      headers["X-Connection-Api-Key"] = brevoKey;
    } else {
      headers["api-key"] = brevoKey;
    }

    const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;color:#111">
  <div style="background:linear-gradient(135deg,#000 0%,#dc2626 100%);padding:24px;text-align:center;color:#fff">
    <img src="${LOGO}" alt="Manoj Wheels" style="height:60px;margin-bottom:8px"/>
    <h1 style="margin:0;font-size:22px;letter-spacing:1px">MANOJ WHEELS</h1>
    <p style="margin:4px 0 0;font-size:12px;opacity:.9">South India's Trusted Wheel & Car Care Hub</p>
  </div>
  <div style="padding:24px">
    <h2 style="margin:0 0 12px;color:#dc2626">Service Invoice</h2>
    <p style="margin:0 0 16px">Dear <strong>${esc(data.customerName)}</strong>,</p>
    <p style="margin:0 0 16px;color:#444;line-height:1.5">
      Thank you for choosing <strong>Manoj Wheels</strong>. Please find your service invoice attached.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px;overflow:hidden">
      <tr><td style="padding:10px 14px;color:#666;font-size:13px">Invoice No.</td><td style="padding:10px 14px;text-align:right;font-weight:600">${esc(data.invoiceNumber)}</td></tr>
      <tr><td style="padding:10px 14px;color:#666;font-size:13px;border-top:1px solid #eee">Vehicle</td><td style="padding:10px 14px;text-align:right;font-weight:600;border-top:1px solid #eee">${esc(data.vehicleNumber)}</td></tr>
      <tr><td style="padding:10px 14px;color:#666;font-size:13px;border-top:1px solid #eee">Service</td><td style="padding:10px 14px;text-align:right;font-weight:600;border-top:1px solid #eee">${esc(data.service)}</td></tr>
      <tr><td style="padding:14px;color:#fff;background:#dc2626;font-weight:700">TOTAL</td><td style="padding:14px;text-align:right;color:#fff;background:#dc2626;font-weight:700;font-size:18px">₹${esc(data.total)}</td></tr>
    </table>
    <p style="font-size:13px;color:#555;margin:18px 0 6px">Drive Safe • Drive Confident</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
    <p style="font-size:11px;color:#888;margin:0">Manoj Wheels • Pulivendula, YSR Kadapa District, Andhra Pradesh<br/>
      <a href="https://manojwheels.online" style="color:#dc2626;text-decoration:none">www.manojwheels.online</a> • manojwheels.official@gmail.com</p>
  </div>
</div>`;

    const payload = {
      sender: { email: VERIFIED_FROM, name: "Manoj Wheels" },
      to: [{ email: data.toEmail }],
      subject: `Manoj Wheels Service Invoice — ${data.invoiceNumber}`,
      htmlContent: html,
      attachment: [{ name: `${data.invoiceNumber}.pdf`, content: data.pdfBase64 }],
    };

    const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    const text = await resp.text();
    let parsed: { messageId?: string; message?: string } = {};
    try { parsed = JSON.parse(text); } catch { /* */ }
    if (!resp.ok || !parsed.messageId) {
      throw new Error(parsed.message || `Email failed (HTTP ${resp.status})`);
    }
    return { ok: true, messageId: parsed.messageId };
  });
