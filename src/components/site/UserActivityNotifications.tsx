import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bell, MessageSquare, UserPlus, Wrench } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUserActivityCounts, type ActivityCounts } from "@/lib/admin-data.functions";

const LOGO_URL =
  "https://res.cloudinary.com/dwv8kc9vb/image/upload/v1780845528/Finally_Logo_oxkjjv.png";
const COUNT_KEY_PREFIX = "mw_user_activity_counts_";
const PROMPT_KEY_PREFIX = "mw_user_notification_prompted_";

type ActivityKey = "users" | "contacts" | "services";

const ACTIVITY_META: Record<
  ActivityKey,
  { title: string; noun: string; Icon: typeof UserPlus; tone: string }
> = {
  users: {
    title: "New user signup",
    noun: "new signup",
    Icon: UserPlus,
    tone: "border-primary/40 bg-primary/10",
  },
  contacts: {
    title: "New contact request",
    noun: "new contact request",
    Icon: MessageSquare,
    tone: "border-gold/40 bg-gold/10",
  },
  services: {
    title: "New service booking",
    noun: "new service booking",
    Icon: Wrench,
    tone: "border-success/40 bg-success/10",
  },
};

function isAdminPage() {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
}

function showNativeNotification(type: ActivityKey, count: number) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const meta = ACTIVITY_META[type];
  const plural = count > 1 ? "s" : "";
  try {
    const notification = new Notification(`Manoj Wheels • ${meta.title}`, {
      body: `${count} ${meta.noun}${plural} received just now. Open the app to view updates.`,
      icon: LOGO_URL,
      badge: LOGO_URL,
      tag: `manoj-wheels-${type}`,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Some mobile browsers expose Notification but still block constructor use.
  }
}

function showBrandedToast(type: ActivityKey, count: number) {
  const meta = ACTIVITY_META[type];
  const plural = count > 1 ? "s" : "";
  toast.custom(
    () => (
      <div className={`w-[min(92vw,380px)] rounded-lg border ${meta.tone} p-3 shadow-elegant backdrop-blur-md`}>
        <div className="flex items-start gap-3">
          <img src={LOGO_URL} alt="Manoj Wheels" className="h-10 w-10 shrink-0 object-contain" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <meta.Icon className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">{meta.title}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {count} {meta.noun}{plural} received on Manoj Wheels.
            </p>
          </div>
        </div>
      </div>
    ),
    { duration: 7000 },
  );
}

function maybeVibrate() {
  if (typeof navigator === "undefined") return;
  const n = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
  n.vibrate?.([80, 40, 80]);
}

export function UserActivityNotifications() {
  const { user, loading } = useAuth();
  const getCounts = useServerFn(getUserActivityCounts);
  const enabled = Boolean(user && !loading && !isAdminPage());

  const { data } = useQuery<ActivityCounts>({
    queryKey: ["user-activity-counts", user?.id],
    queryFn: () => getCounts(),
    enabled,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (!enabled || !user || typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    const promptKey = `${PROMPT_KEY_PREFIX}${user.id}`;
    if (localStorage.getItem(promptKey)) return;
    localStorage.setItem(promptKey, "1");
    toast.custom(
      (toastId) => (
        <div className="w-[min(92vw,390px)] rounded-lg border border-primary/30 bg-card p-3 shadow-elegant">
          <div className="flex items-start gap-3">
            <img src={LOGO_URL} alt="Manoj Wheels" className="h-10 w-10 shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Enable Manoj Wheels alerts</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Get mobile-friendly alerts when new activity is recorded.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded-md bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  onClick={async () => {
                    const permission = await Notification.requestPermission();
                    toast.dismiss(toastId);
                    if (permission === "granted") toast.success("Notifications enabled");
                  }}
                >
                  Enable
                </button>
                <button
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground"
                  onClick={() => toast.dismiss(toastId)}
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: 10000 },
    );
  }, [enabled, user]);

  useEffect(() => {
    if (!data || !enabled || !user || typeof window === "undefined") return;
    const key = `${COUNT_KEY_PREFIX}${user.id}`;
    const current = { users: data.users, contacts: data.contacts, services: data.services };
    const previous = localStorage.getItem(key);
    if (!previous) {
      localStorage.setItem(key, JSON.stringify(current));
      return;
    }

    const parsed = JSON.parse(previous) as Partial<Record<ActivityKey, number>>;
    (Object.keys(current) as ActivityKey[]).forEach((activityKey) => {
      const oldCount = parsed[activityKey] ?? current[activityKey];
      const diff = current[activityKey] - oldCount;
      if (diff > 0) {
        showBrandedToast(activityKey, diff);
        showNativeNotification(activityKey, diff);
        maybeVibrate();
      }
    });
    localStorage.setItem(key, JSON.stringify(current));
  }, [data, enabled, user]);

  return null;
}