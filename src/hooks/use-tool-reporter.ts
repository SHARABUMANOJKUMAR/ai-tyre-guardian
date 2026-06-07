import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { openWhatsApp } from "@/lib/whatsapp";
import { saveToolReport } from "@/lib/tool-reports.functions";
import { uploadReportPdf } from "@/lib/reports.functions";
import { emailReportPdf } from "@/lib/email-pdf.functions";
import { validateEmailAddress, validateWhatsAppNumber } from "@/lib/share-validation";
import {
  generateToolReportPDF,
  type ToolReportInput,
} from "@/lib/tool-report-pdf";

type ToolType =
  | "tyre-mileage"
  | "tyre-size"
  | "tyre-pressure"
  | "fuel-savings"
  | "wheel-alignment"
  | "tyre-life"
  | "seasonal-tyre"
  | "road-trip"
  | "ai-advisor"
  | "service-cost"
  | "running-cost"
  | "emergency-assistant"
  | "brand-recommender"
  | "tyre-comparison";

export interface SaveToolPayload {
  reportType: ToolType;
  /** Stored as `title` in the reports table — shown in dashboard list. */
  title: string;
  /** One-line summary shown in dashboard list & PDF header. */
  summary: string;
  /** 0-100 score (used by dashboard stats); pass 0 if not applicable. */
  score?: number;
  /** Short verdict, e.g. "Within safe range". */
  recommendation?: string;
  /** Anything you want to persist for later re-rendering. */
  payload: Record<string, unknown>;
  /** Used to build the PDF; same data shape works for the calculator UI. */
  pdf: ToolReportInput;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return btoa(bin);
}

/**
 * Shared sharing/persistence helpers for calculator tools.
 *
 * Returns:
 *  - downloadPdf(p): just downloads, never touches network (works signed-out)
 *  - shareToWhatsApp(p): saves+uploads (if signed in) then opens WhatsApp with link
 *  - sendEmail(p, to): saves+uploads then triggers backend email send
 *  - saveToHistory(p): persists without downloading
 */
export function useToolReporter() {
  const { user } = useAuth();
  const save = useServerFn(saveToolReport);
  const upload = useServerFn(uploadReportPdf);
  const email = useServerFn(emailReportPdf);
  const [busy, setBusy] = useState<"save" | "pdf" | "wa" | "email" | null>(null);
  const [whatsAppStatus, setWhatsAppStatus] = useState<string | null>(null);

  async function persistWithPdf(p: SaveToolPayload): Promise<{
    reportId: string | null;
    signedUrl: string | null;
  }> {
    if (!user) return { reportId: null, signedUrl: null };
    const row = await save({
      data: {
        reportType: p.reportType,
        title: p.title,
        summary: p.summary,
        score: p.score ?? 0,
        recommendation: p.recommendation ?? "",
        payload: p.payload,
      },
    });
    const out = generateToolReportPDF(p.pdf, { save: false });
    const base64 = await blobToBase64(out.blob);
    const r = await upload({ data: { reportId: row.id, pdfBase64: base64 } });
    return { reportId: row.id, signedUrl: r.signedUrl };
  }

  function downloadPdf(p: SaveToolPayload) {
    setBusy("pdf");
    try {
      generateToolReportPDF(p.pdf, { save: true });
      toast.success("Report downloaded");
      if (user) {
        // sync to history in background
        persistWithPdf(p).catch((e) => console.error("history sync failed", e));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveToHistory(p: SaveToolPayload) {
    if (!user) {
      toast.error("Sign in to save reports to history");
      return;
    }
    setBusy("save");
    try {
      await persistWithPdf(p);
      toast.success("Saved to your dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function shareToWhatsApp(p: SaveToolPayload, phone?: string) {
    let target = "";
    try {
      target = validateWhatsAppNumber(phone ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enter a valid WhatsApp number");
      return;
    }
    setBusy("wa");
    setWhatsAppStatus("Preparing report link…");
    try {
      let url: string | null = null;
      if (user) {
        const r = await persistWithPdf(p).catch(() => null);
        url = r?.signedUrl ?? null;
      }
      const lines = [
        `🚗 Manoj Wheels AI Tyre Report`,
        "",
        p.pdf.toolName ? `Tool: ${p.pdf.toolName}` : "",
        p.pdf.headline ? `${p.pdf.headlineLabel ?? "Result"}: ${p.pdf.headline}` : "",
        p.recommendation ? `Recommendation: ${p.recommendation}` : "",
        url ? `\nDownload PDF:\n${url}` : "\nSign in to attach a shareable PDF link.",
      ].filter(Boolean);
      setWhatsAppStatus("Opening WhatsApp…");
      openWhatsApp(target, lines.join("\n"));
      setWhatsAppStatus("WhatsApp opened — press Send in WhatsApp to deliver the report.");
      toast.success("WhatsApp opened", {
        description: "Press Send in WhatsApp to complete delivery.",
      });
    } catch (e) {
      setWhatsAppStatus("WhatsApp share failed");
      toast.error(e instanceof Error ? e.message : "WhatsApp share failed");
    } finally {
      setBusy(null);
    }
  }

  async function sendEmail(p: SaveToolPayload, to: string) {
    if (!user) {
      toast.error("Sign in to email reports");
      return;
    }
    let recipient = "";
    try {
      recipient = validateEmailAddress(to);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enter a valid email");
      return;
    }
    setBusy("email");
    try {
      const r = await persistWithPdf(p);
      if (!r.reportId) throw new Error("Could not save report");
      const result = await email({ data: { reportId: r.reportId, toEmail: recipient } });
      toast.success("✓ Email accepted by Brevo", {
        description: result.messageId ? `Message ID: ${result.messageId}` : "Check inbox and spam folder.",
        duration: 6000,
      });
    } catch (e) {
      toast.error(`✗ ${e instanceof Error ? e.message : "Failed to send"}`);
    } finally {
      setBusy(null);
    }
  }

  return { busy, whatsAppStatus, downloadPdf, saveToHistory, shareToWhatsApp, sendEmail, isSignedIn: !!user };
}
