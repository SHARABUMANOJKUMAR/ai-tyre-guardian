// User-facing notification inbox stored in localStorage and synced across tabs.
export type AppNotification = {
  id: string;
  type: "login" | "system" | "service" | "info";
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
  icon?: string;
};

const KEY_PREFIX = "mw_user_inbox_";
const MAX_ITEMS = 50;
const EVT = "mw-inbox-updated";

function keyFor(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

export function loadInbox(userId: string): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const list = JSON.parse(raw) as AppNotification[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveInbox(userId: string, list: AppNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(keyFor(userId), JSON.stringify(list.slice(0, MAX_ITEMS)));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { userId } }));
}

export function addNotification(
  userId: string,
  n: Omit<AppNotification, "id" | "createdAt" | "read"> & { read?: boolean },
): AppNotification {
  const item: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    read: n.read ?? false,
    ...n,
  };
  const list = [item, ...loadInbox(userId)];
  saveInbox(userId, list);
  return item;
}

export function markAllRead(userId: string) {
  const list = loadInbox(userId).map((n) => ({ ...n, read: true }));
  saveInbox(userId, list);
}

export function markRead(userId: string, id: string) {
  const list = loadInbox(userId).map((n) => (n.id === id ? { ...n, read: true } : n));
  saveInbox(userId, list);
}

export function clearInbox(userId: string) {
  saveInbox(userId, []);
}

export function subscribeInbox(userId: string, cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = (e: Event) => {
    const d = (e as CustomEvent<{ userId: string }>).detail;
    if (!d || d.userId === userId) cb();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === keyFor(userId)) cb();
  };
  window.addEventListener(EVT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
