import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/* -------------------- Vehicles -------------------- */

const VehicleInput = z.object({
  nickname: z.string().max(60).optional().nullable(),
  make: z.string().min(1).max(40),
  model: z.string().min(1).max(40),
  year: z.number().int().min(1980).max(2100).optional().nullable(),
  registration: z.string().max(20).optional().nullable(),
  vehicle_type: z.enum(["car", "suv", "bike", "scooter", "commercial"]),
  current_odometer_km: z.number().int().min(0).max(2_000_000).default(0),
  fuel_type: z.string().max(20).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const listVehicles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VehicleInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("vehicles")
      .insert({ ...data, user_id: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: VehicleInput.partial() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("vehicles")
      .update(data.patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("vehicles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------- Reminders -------------------- */

const ReminderInput = z.object({
  vehicle_id: z.string().uuid(),
  service_type: z.enum([
    "tyre_rotation",
    "wheel_alignment",
    "wheel_balancing",
    "tyre_replacement",
    "oil_change",
    "brake_check",
    "battery_check",
    "general_service",
    "insurance_renewal",
    "puc_renewal",
    "other",
  ]),
  title: z.string().min(1).max(120),
  notes: z.string().max(500).optional().nullable(),
  due_date: z.string().optional().nullable(), // ISO date
  due_odometer_km: z.number().int().min(0).max(2_000_000).optional().nullable(),
  interval_km: z.number().int().min(0).max(200_000).optional().nullable(),
  interval_months: z.number().int().min(0).max(120).optional().nullable(),
});

export const listReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("maintenance_reminders")
      .select("*, vehicles(nickname, make, model)")
      .order("due_date", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReminderInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("maintenance_reminders")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("maintenance_reminders")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("maintenance_reminders")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------- Health Logs -------------------- */

const HealthLogInput = z.object({
  vehicle_id: z.string().uuid(),
  entry_type: z.enum([
    "service",
    "repair",
    "inspection",
    "tyre",
    "accident",
    "fuel",
    "other",
  ]),
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  odometer_km: z.number().int().min(0).max(2_000_000).optional().nullable(),
  cost: z.number().min(0).max(10_000_000).optional().nullable(),
  service_date: z.string().optional(),
});

export const listHealthLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ vehicleId: z.string().uuid().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("vehicle_health_logs")
      .select("*, vehicles(nickname, make, model)")
      .order("service_date", { ascending: false });
    if (data.vehicleId) q = q.eq("vehicle_id", data.vehicleId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createHealthLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => HealthLogInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("vehicle_health_logs")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteHealthLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("vehicle_health_logs")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------- Health Score (computed) -------------------- */

export const getVehicleHealthScore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ vehicleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [logsRes, remRes, vRes] = await Promise.all([
      context.supabase.from("vehicle_health_logs").select("entry_type, service_date").eq("vehicle_id", data.vehicleId),
      context.supabase.from("maintenance_reminders").select("status, due_date").eq("vehicle_id", data.vehicleId),
      context.supabase.from("vehicles").select("*").eq("id", data.vehicleId).maybeSingle(),
    ]);
    const logs = logsRes.data ?? [];
    const reminders = remRes.data ?? [];
    const today = new Date();
    const overdue = reminders.filter(
      (r) => r.status === "pending" && r.due_date && new Date(r.due_date) < today,
    ).length;
    const pendingSoon = reminders.filter((r) => {
      if (r.status !== "pending" || !r.due_date) return false;
      const d = new Date(r.due_date);
      const diffDays = (d.getTime() - today.getTime()) / 86_400_000;
      return diffDays >= 0 && diffDays <= 30;
    }).length;
    const recentService = logs.find(
      (l) =>
        (l.entry_type === "service" || l.entry_type === "inspection") &&
        l.service_date &&
        (today.getTime() - new Date(l.service_date).getTime()) / 86_400_000 <= 180,
    );

    // Deterministic score: 100 baseline, penalties for overdue / pending-soon, bonus for recent service
    let score = 100;
    score -= overdue * 15;
    score -= pendingSoon * 5;
    if (!recentService) score -= 10;
    score = Math.max(0, Math.min(100, score));

    const verdict =
      score >= 85 ? "Excellent — keep it up"
      : score >= 65 ? "Good — small actions due"
      : score >= 40 ? "Needs attention soon"
      : "Service required urgently";

    return {
      vehicle: vRes.data,
      score,
      verdict,
      overdueCount: overdue,
      pendingSoonCount: pendingSoon,
      totalLogs: logs.length,
    };
  });
