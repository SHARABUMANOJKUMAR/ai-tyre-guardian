import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const BUCKET = "tyre-reports";

export const emailReportPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reportId: string; toEmail: string }) =>
    z.object({
      reportId: z.string().uuid(),
      toEmail: z.string().trim().email().max(160),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    // Fetch report
    const { data: report, error: rErr } = await supabase
      .from("reports")
      .select("id, score, recommendation, pdf_path, created_at, report_type")
      .eq("id", data.reportId).eq("user_id", userId).maybeSingle();
    if (rErr || !report) throw new Error("Report not found");
    if (!report.pdf_path) throw new Error("PDF not generated yet. Download it once first.");

    // Download PDF from storage
    const { data: blob, error: dErr } = await supabase.storage.from(BUCKET).download(report.pdf_path);
    if (dErr || !blob) throw new Error("Could not retrieve PDF");
    const arr = new Uint8Array(await blob.arrayBuffer());
    // Base64 encode
    let bin = "";
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
    const base64 = btoa(bin);

    const brevoKey = process.env.BREVO_API_KEY;
    if (!brevoKey) throw new Error("Email service not configured");

    const lovableKey = process.env.LOVABLE_API_KEY;
    const useGateway = !!lovableKey;
    const url = useGateway
      ? "https://connector-gateway.lovable.dev/brevo/smtp/email"
      : "https://api.brevo.com/v3/smtp/email";

    const headers: Record<string, string> = { "Content-Type": "application/json", accept: "application/json" };
    if (useGateway) {
      headers["Authorization"] = `Bearer ${lovableKey}`;
      headers["X-Connection-Api-Key"] = brevoKey;
    } else {
      headers["api-key"] = brevoKey;
    }

    const filename = `Manoj-Wheels-Tyre-Report-${new Date(report.created_at).getTime()}.pdf`;
    const senderEmail = process.env.EMAIL_FROM || "noreply@manojwheels.com";
    const senderName = "Manoj Wheels";
    const fromName = claims.email ?? "you";

    const payload = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: data.toEmail }],
      replyTo: { email: claims.email ?? senderEmail, name: senderName },
      subject: `Your AI Tyre Health Report — Score ${report.score}/100`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
          <h2 style="color:#dc2626;margin:0 0 8px">Manoj Wheels — Tyre Health Report</h2>
          <p style="color:#555;margin:0 0 16px">AI Diagnostic generated for ${fromName}</p>
          <div style="border:1px solid #eee;border-radius:10px;padding:16px;background:#fafafa">
            <p style="margin:0;font-size:14px;color:#555">Overall Health Score</p>
            <p style="margin:4px 0;font-size:40px;font-weight:800;color:#dc2626">${report.score}<span style="font-size:14px;color:#888;font-weight:400">/100</span></p>
            <p style="margin:8px 0 0;font-size:14px"><strong>Recommendation:</strong> ${report.recommendation ?? "—"}</p>
          </div>
          <p style="margin:18px 0 6px">The full diagnostic report is attached as a PDF.</p>
          <p style="font-size:12px;color:#888;margin-top:24px">For final certification, visit Manoj Wheels workshop. Pulivendula, Andhra Pradesh.</p>
        </div>`,
      attachment: [{ name: filename, content: base64 }],
    };

    const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    const text = await resp.text();

    if (!resp.ok) {
      await supabase.from("email_sends").insert({
        user_id: userId, report_id: report.id, recipient: data.toEmail,
        status: "failed", error: text.slice(0, 500),
      });
      throw new Error(`Email failed (${resp.status}): ${text.slice(0, 200)}`);
    }

    await supabase.from("email_sends").insert({
      user_id: userId, report_id: report.id, recipient: data.toEmail, status: "sent",
    });
    return { ok: true };
  });
