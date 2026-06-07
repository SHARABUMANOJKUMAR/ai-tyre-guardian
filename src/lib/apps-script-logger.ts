// Logs signup/login events to a Google Apps Script web app.
// Apps Script is a side-channel for profile logging, login logs, and emails.
// Supabase remains the source of truth for authentication.

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzn76eyVW-Z5ShvmIGhn9mKeJo2aIj8o8stsEiKgBYdhDsstAQ0P_9wN5bohqCcHGAPfw/exec";

// Deterministic per-Supabase-user ID so signup and login share the same value.
export function deriveUserId(supabaseUserId: string) {
  return `MWUSR${supabaseUserId.replace(/-/g, "").slice(0, 16).toUpperCase()}`;
}

function parseDeviceInfo(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua) || /Opera/.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";

  let os = "Unknown OS";
  if (/Windows NT 10/.test(ua)) os = /Windows NT 10\.0; Win64/.test(ua) ? "Windows 10/11" : "Windows 10";
  else if (/Windows NT 11/.test(ua)) os = "Windows 11";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return `${browser} on ${os}`;
}

async function getIpAddress(): Promise<string> {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    if (!r.ok) return "";
    const j = (await r.json()) as { ip?: string };
    return j.ip ?? "";
  } catch {
    return "";
  }
}

// Apps Script's doPost(e) reads form fields via e.parameter.<key>. Sending the
// JSON in a `payload` form field with application/x-www-form-urlencoded works
// reliably without CORS preflight. We use sendBeacon when available so the
// request survives navigations / OAuth redirects.
function postToAppsScript(payload: Record<string, unknown>): boolean {
  try {
    const body = new URLSearchParams({ payload: JSON.stringify(payload) });

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body.toString()], {
        type: "application/x-www-form-urlencoded;charset=UTF-8",
      });
      const ok = navigator.sendBeacon(APPS_SCRIPT_URL, blob);
      if (ok) return true;
    }

    // Fallback: fetch with no-cors. Do NOT use keepalive here because it
    // silently drops requests during certain redirect flows.
    void fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString(),
    }).catch((e) => console.warn("[apps-script] sync failed", e));
    return true;
  } catch (e) {
    console.warn("[apps-script] sync failed", e);
    return false;
  }
}

export type SignupPayload = {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  authType: "Google" | "Email";
  emailVerified: "Yes" | "No";
  profileImage?: string;
};

export function logSignup(p: SignupPayload): boolean {
  return postToAppsScript({
    action: "signup",
    userId: p.userId,
    fullName: p.fullName,
    email: p.email,
    phoneNumber: p.phoneNumber ?? "",
    authType: p.authType,
    emailVerified: p.emailVerified,
    profileImage: p.profileImage ?? "",
    role: "Customer",
  });
}

export async function logLogin(p: { userId: string; email: string }): Promise<boolean> {
  const ipAddress = await getIpAddress();
  return postToAppsScript({
    action: "login",
    userId: p.userId,
    email: p.email,
    ipAddress,
    deviceInfo: parseDeviceInfo(),
  });
}
