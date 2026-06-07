import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ToolReportSchema = z.object({
  reportType: z.enum([
    "tyre-mileage",
    "tyre-size",
    "tyre-pressure",
    "fuel-savings",
    "wheel-alignment",
    "tyre-life",
    "seasonal-tyre",
    "road-trip",
    "ai-advisor",
  ]),
  title: z.string().min(1).max(120),
  summary: z.string().max(500).default(""),
  score: z.number().int().min(0).max(100).default(0),
  recommendation: z.string().max(200).default(""),
  payload: z.record(z.any()),
});

/**
 * Save a non-tyre calculator result into the shared reports table.
 * Returns { id, created_at } the client uses to attach a PDF later.
 */
export const saveToolReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ToolReportSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const { data: row, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        email: claims.email ?? "",
        report_type: data.reportType,
        title: data.title,
        summary: data.summary,
        score: data.score,
        recommendation: data.recommendation,
        payload: data.payload,
        is_tyre: false,
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
