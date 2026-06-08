import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getInvoicesForUser } from "@/lib/public-invoice.functions";
import { addNotification } from "@/lib/notifications-store";

const POLL_MS = 30_000;
const STATE_KEY = (uid: string) => `mw_invoice_status_${uid}`;

type Snapshot = Record<string, string>;

function loadSnapshot(uid: string): Snapshot {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY(uid)) || "{}");
  } catch {
    return {};
  }
}
function saveSnapshot(uid: string, s: Snapshot) {
  try {
    localStorage.setItem(STATE_KEY(uid), JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function statusEmoji(s: string) {
  const k = s.toLowerCase();
  if (k.includes("complete")) return "✅";
  if (k.includes("deliver")) return "🚗";
  if (k.includes("progress")) return "🔧";
  if (k.includes("cancel")) return "❌";
  return "🕒";
}

export function InvoiceStatusWatcher() {
  const { user } = useAuth();
  const fetchFn = useServerFn(getInvoicesForUser);
  const initialized = useRef(false);

  useEffect(() => {
    if (!user) {
      initialized.current = false;
      return;
    }
    const email = user.email ?? "";
    const mobile = String(
      (user.user_metadata as Record<string, unknown> | undefined)?.phone_number ??
        (user.user_metadata as Record<string, unknown> | undefined)?.phone ??
        "",
    );
    if (!email && !mobile) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const rows = await fetchFn({ data: { email, mobile } });
        if (cancelled) return;
        const prev = loadSnapshot(user.id);
        const next: Snapshot = {};
        const isFirstRun = !initialized.current;
        for (const r of rows) {
          next[r.invoiceNumber] = r.status;
          const old = prev[r.invoiceNumber];
          if (!isFirstRun && old && old !== r.status) {
            const emoji = statusEmoji(r.status);
            toast.success(`${emoji} Invoice ${r.invoiceNumber}`, {
              description: `Status updated: ${old} → ${r.status}`,
              duration: 7000,
            });
            addNotification(user.id, {
              type: "service",
              title: `Invoice ${r.invoiceNumber} updated`,
              message: `${r.service || "Service"} • Status: ${r.status}`,
            });
          } else if (!isFirstRun && !old) {
            // New invoice issued for this user
            toast.success(`🧾 New invoice ${r.invoiceNumber}`, {
              description: `${r.service || "Service"} • ${r.status}`,
              duration: 7000,
            });
            addNotification(user.id, {
              type: "service",
              title: `New invoice ${r.invoiceNumber}`,
              message: `${r.service || "Service"} • ${r.status}`,
            });
          }
        }
        saveSnapshot(user.id, next);
        initialized.current = true;
      } catch {
        /* silent — network errors shouldn't spam the user */
      }
    };

    tick();
    const id = window.setInterval(tick, POLL_MS);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, fetchFn]);

  return null;
}
