import { supabase as sb } from "@/integrations/supabase/client";
import type { TyreAnalysis } from "./tyre-analyze.functions";

// Types may not be regenerated yet; cast to loosen the table union.
const supabase = sb as unknown as {
  auth: typeof sb.auth;
  storage: typeof sb.storage;
  from: (table: string) => any;
};

export type StoredReport = {
  id: string;
  created_at: string;
  score: number;
  recommendation: string;
  tread: number | null;
  cracks: string | null;
  remaining_km: number | null;
  result: TyreAnalysis;
  image_url: string | null;
};

export async function saveTyreReport(
  result: TyreAnalysis,
  imageDataUrl: string | null,
): Promise<StoredReport | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  let imageUrl: string | null = null;
  if (imageDataUrl?.startsWith("data:")) {
    try {
      const [meta, b64] = imageDataUrl.split(",");
      const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? "image/jpeg";
      const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("tyre-images")
        .upload(path, bytes, { contentType: mime, upsert: false });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("tyre-images").getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }
    } catch {
      /* non-fatal */
    }
  }

  const { data, error } = await supabase
    .from("tyre_reports")
    .insert({
      user_id: user.id,
      score: result.score,
      recommendation: result.recommendation,
      tread: result.tread,
      cracks: result.cracks,
      remaining_km: result.remainingKm,
      result: result as unknown as Record<string, unknown>,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as unknown as StoredReport;
}

export async function fetchMyReports(): Promise<StoredReport[]> {
  const { data, error } = await supabase
    .from("tyre_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as StoredReport[];
}

export async function deleteReport(id: string) {
  await supabase.from("tyre_reports").delete().eq("id", id);
}

export async function fetchMyBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function saveBooking(payload: {
  fullName: string;
  email: string;
  phoneNumber: string;
  vehicleType: string;
  serviceNeeded: string;
  preferredDate: string;
  preferredTime: string;
  additionalNotes: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const { data, error } = await supabase.from("bookings").insert({
    user_id: user.id,
    full_name: payload.fullName,
    email: payload.email,
    phone: payload.phoneNumber,
    vehicle_type: payload.vehicleType,
    service_needed: payload.serviceNeeded,
    preferred_date: payload.preferredDate || null,
    preferred_time: payload.preferredTime || null,
    notes: payload.additionalNotes,
  }).select().single();
  if (error) return null;
  return data;
}

export async function fetchMyProfile() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle();
  return data;
}

export async function updateMyProfile(patch: { full_name?: string; phone?: string }) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userData.user.id)
    .select()
    .single();
  if (error) return null;
  return data;
}
