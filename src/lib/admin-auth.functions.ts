import { createServerFn } from "@tanstack/react-start";
import crypto from "crypto";

// Credentials are read from env; no insecure defaults.
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME ?? "").trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? "").trim();
// Signing secret MUST be a dedicated secret — never reuse the publicly-known
// Supabase anon/publishable key (would let any browser forge admin tokens).
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET ?? "";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function sign(payload: string): string {
  return crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
}

function makeToken(): string {
  const exp = Date.now() + TTL_MS;
  const payload = `admin:${exp}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64");
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token || !TOKEN_SECRET) return false;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;
    const [name, expStr, sig] = parts;
    if (name !== "admin") return false;
    const exp = parseInt(expStr, 10);
    if (!exp || Date.now() > exp) return false;
    const expected = sign(`${name}:${expStr}`);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; password: string }) => ({
    username: String(d?.username ?? ""),
    password: String(d?.password ?? ""),
  }))
  .handler(async ({ data }) => {
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !TOKEN_SECRET) {
      throw new Error(
        "Admin auth is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_TOKEN_SECRET secrets.",
      );
    }
    const u = data.username.trim();
    const p = data.password.trim();
    // Case-insensitive username, exact password.
    if (
      u.toLowerCase() !== ADMIN_USERNAME.toLowerCase() ||
      p !== ADMIN_PASSWORD
    ) {
      throw new Error("Invalid username or password");
    }
    return { token: makeToken(), expiresAt: Date.now() + TTL_MS };
  });

export const verifyAdminTokenFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: String(d?.token ?? "") }))
  .handler(async ({ data }) => ({ valid: verifyAdminToken(data.token) }));
