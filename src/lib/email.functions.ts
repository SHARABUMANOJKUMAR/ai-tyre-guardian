import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SenderName = "Manoj Wheels";
const SenderEmail = "manojwheels.official@gmail.com";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

const inputSchema = z.object({
  to: z.string().trim().email().max(160),
  toName: z.string().trim().max(120).optional().default(""),
  subject: z.string().trim().min(1).max(200),
  html: z.string().min(1).max(50_000),
  pdfBase64: z.string().min(20).max(8_000_000),
  pdfFilename: z.string().trim().min(1).max(120),
});

export const sendTyreReportEmail = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY is not configured");

    const body = {
      sender: { name: SenderName, email: SenderEmail },
      to: [{ email: data.to, name: data.toName || data.to }],
      replyTo: { email: SenderEmail, name: SenderName },
      subject: data.subject,
      htmlContent: data.html,
      attachment: [{ name: data.pdfFilename, content: data.pdfBase64 }],
    };

    const res = await fetch(`${GATEWAY_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": BREVO_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* keep raw text */ }

    if (!res.ok) {
      const msg =
        (parsed && typeof parsed === "object" && "message" in parsed && typeof (parsed as { message: unknown }).message === "string")
          ? (parsed as { message: string }).message
          : text || `Brevo error ${res.status}`;
      throw new Error(msg);
    }

    const messageId =
      parsed && typeof parsed === "object" && "messageId" in parsed
        ? String((parsed as { messageId: unknown }).messageId)
        : undefined;
    return { ok: true as const, messageId };
  });
