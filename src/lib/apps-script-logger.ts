// Logs signup/login events to a Google Apps Script web app.
// Apps Script is a side-channel for profile logging, login logs, and emails.
// Supabase remains the source of truth for authentication.

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzn76eyVW-Z5ShvmIGhn9mKeJo2aIj8o8stsEiKgBYdhDsstAQ0P_9wN5bohqCcHGAPfw/exec";

// Deterministic per-Supabase-user ID so signup and login share the same value.
export function deriveUserId(supabaseUserId: string) {
  return `MWUSR${supabaseUserId.replace(/-/g, "").slice(0, 16).toUpperCase()}`;
}

function getDeviceInfo() {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  const platform = (navigator as Navigator & { platform?: string }).platform ?? "";
  return `${ua} | ${platform}`.slice(0, 400);
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

async function postToAppsScript(payload: Record<string, unknown>) {
  try {
    // Apps Script web apps reject CORS preflights; use text/plain to avoid them.
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
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

export async function logSignup(p: SignupPayload) {
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

export async function logLogin(p: { userId: string; email: string }) {
  const ipAddress = await getIpAddress();
  return postToAppsScript({
    action: "login",
    userId: p.userId,
    email: p.email,
    ipAddress,
    deviceInfo: getDeviceInfo(),
  });
}
