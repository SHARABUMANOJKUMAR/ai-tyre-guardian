import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const BUCKET = "tyre-reports";

const AnalysisSchema = z.object({
  isTyre: z.boolean(),
  score: z.number(),
  tread: z.number(),
  cracks: z.string(),
  remainingKm: z.number(),
  confidence: z.number(),
  recommendation: z.string(),
  notes: z.string().optional().default(""),
  observations: z.array(z.string()).optional().default([]),
});

export const saveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { analysis: unknown }) => ({
    analysis: AnalysisSchema.parse(d.analysis),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const a = data.analysis;
    const { data: inserted, error } = await supabase.from("reports").insert({
      user_id: userId,
      email: claims.email ?? "",
      report_type: "ai-tyre-check",
      score: a.score,
      recommendation: a.recommendation,
      tread: a.tread,
      cracks: a.cracks,
      remaining_km: a.remainingKm,
      confidence: a.confidence,
      notes: a.notes,
      observations: a.observations,
      is_tyre: a.isTyre,
      analysis: a,
    }).select("id, created_at").single();
    if (error) throw new Error(error.message);
    return inserted;
  });

export const uploadReportPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reportId: string; pdfBase64: string }) => {
    if (!d.reportId) throw new Error("Missing report id");
    if (!d.pdfBase64 || d.pdfBase64.length > 12_000_000) throw new Error("Invalid PDF data");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const path = `${userId}/${data.reportId}.pdf`;
    const bytes = Uint8Array.from(atob(data.pdfBase64), c => c.charCodeAt(0));
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: "application/pdf", upsert: true,
    });
    if (upErr) throw new Error(upErr.message);
    const { error: updErr } = await supabase
      .from("reports").update({ pdf_path: path }).eq("id", data.reportId).eq("user_id", userId);
    if (updErr) throw new Error(updErr.message);
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
    return { path, signedUrl: signed?.signedUrl ?? null };
  });

export const listReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string; from?: string; to?: string } = {}) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("reports").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const filtered = data.search
      ? rows.filter(r =>
          (r.recommendation ?? "").toLowerCase().includes(data.search!.toLowerCase()) ||
          (r.notes ?? "").toLowerCase().includes(data.search!.toLowerCase()) ||
          String(r.score).includes(data.search!)
        )
      : rows;
    return filtered;
  });

export const getReportSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reportId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("reports").select("pdf_path").eq("id", data.reportId).eq("user_id", userId).maybeSingle();
    if (error || !row?.pdf_path) throw new Error("Report PDF not found");
    const { data: signed, error: sErr } = await supabase.storage
      .from(BUCKET).createSignedUrl(row.pdf_path, 60 * 60 * 24 * 7);
    if (sErr || !signed) throw new Error(sErr?.message ?? "Could not sign URL");
    return { signedUrl: signed.signedUrl };
  });

export const deleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reportId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("reports").select("pdf_path").eq("id", data.reportId).eq("user_id", userId).maybeSingle();
    if (row?.pdf_path) {
      await supabase.storage.from(BUCKET).remove([row.pdf_path]);
    }
    const { error } = await supabase.from("reports").delete().eq("id", data.reportId).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
