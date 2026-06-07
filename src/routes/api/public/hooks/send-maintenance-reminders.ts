import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron endpoint — sends maintenance reminder emails for items due within 7 days
 * or already overdue. Throttles per-reminder to one email per 24 hours.
 * Called by pg_cron daily. No body required.
 */
export const Route = createFileRoute("/api/public/hooks/send-maintenance-reminders")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const now = new Date();
        const horizon = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

        const { data: rows, error } = await supabaseAdmin
          .from("maintenance_reminders")
          .select("id, user_id, title, service_type, due_date, due_odometer_km, notes, last_notified_at, vehicles(nickname, make, model, registration)")
          .eq("status", "pending")
          .not("due_date", "is", null)
          .lte("due_date", horizon);

        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const due = (rows ?? []).filter(r => {
          if (!r.last_notified_at) return true;
          return (now.getTime() - new Date(r.last_notified_at).getTime()) > 23 * 3600 * 1000;
        });

        if (due.length === 0) return Response.json({ ok: true, sent: 0 });

        // Group by user → one email per user with all due items
        const userIds = Array.from(new Set(due.map(r => r.user_id)));
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);
        const emailById = new Map((profiles ?? []).map(p => [p.id, { email: p.email, name: p.full_name }]));

        const brevoKey = process.env.BREVO_API_KEY;
        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!brevoKey) {
          return Response.json({ ok: false, error: "Email service not configured" }, { status: 500 });
        }
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

        const senderEmail = "manojwheels.official@gmail.com";
        let sent = 0;
        let failed = 0;

        for (const uid of userIds) {
          const prof = emailById.get(uid);
          if (!prof?.email) continue;
          const userRows = due.filter(r => r.user_id === uid);
          if (userRows.length === 0) continue;

          const items = userRows.map(r => {
            const veh = Array.isArray(r.vehicles) ? r.vehicles[0] : r.vehicles;
            const vname = veh ? (veh.nickname || `${veh.make} ${veh.model}`) : "Your vehicle";
            const overdue = r.due_date && new Date(r.due_date) < now;
            const dueStr = r.due_date ? new Date(r.due_date).toLocaleDateString("en-IN") : "—";
            return `<tr>
              <td style="padding:10px;border-bottom:1px solid #eee">
                <strong>${escapeHtml(r.title)}</strong><br/>
                <span style="color:#666;font-size:13px">${escapeHtml(vname)}${veh?.registration ? ` · ${escapeHtml(veh.registration)}` : ""}</span>
              </td>
              <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;color:${overdue ? "#dc2626" : "#111"};font-weight:${overdue ? "700" : "400"}">
                ${overdue ? "OVERDUE" : "Due"} ${escapeHtml(dueStr)}
              </td>
            </tr>`;
          }).join("");

          const html = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
              <h2 style="color:#dc2626;margin:0 0 8px">Manoj Wheels — Maintenance Reminders</h2>
              <p style="color:#555;margin:0 0 16px">Hi ${escapeHtml(prof.name || "there")}, you have ${userRows.length} maintenance item${userRows.length > 1 ? "s" : ""} due soon.</p>
              <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:10px;overflow:hidden">${items}</table>
              <p style="margin-top:18px"><a href="https://ai-tyre-vision.lovable.app/garage" style="background:#dc2626;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">Open My Garage</a></p>
              <p style="font-size:12px;color:#888;margin-top:24px">Book service: Manoj Wheels, Pulivendula, YSR Kadapa District.</p>
            </div>`;

          try {
            const resp = await fetch(url, {
              method: "POST", headers,
              body: JSON.stringify({
                sender: { email: senderEmail, name: "Manoj Wheels" },
                to: [{ email: prof.email, name: prof.name ?? undefined }],
                subject: `🔧 ${userRows.length} maintenance reminder${userRows.length > 1 ? "s" : ""} for your vehicle`,
                htmlContent: html,
              }),
            });
            if (!resp.ok) {
              failed++;
              continue;
            }
            sent++;
            await supabaseAdmin
              .from("maintenance_reminders")
              .update({ last_notified_at: now.toISOString() })
              .in("id", userRows.map(r => r.id));
            await supabaseAdmin.from("email_sends").insert({
              user_id: uid, report_id: null, recipient: prof.email,
              status: "sent", error: `reminders:${userRows.length}`,
            });
          } catch (e) {
            failed++;
            console.error("[reminders] send failed", e);
          }
        }

        return Response.json({ ok: true, sent, failed, considered: due.length });
      },
    },
  },
});

function escapeHtml(s: string) {
  return s.replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c] ?? c));
}
