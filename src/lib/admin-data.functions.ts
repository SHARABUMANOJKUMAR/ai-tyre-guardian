import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CSV_URLS = {
  users:
    "https://docs.google.com/spreadsheets/d/129ZihMQcX-XamkYUsAFpeR783FzUxSXFk6JfOIJW1qo/export?format=csv",
  services:
    "https://docs.google.com/spreadsheets/d/1jgtYnUDr2TDQOnM0BlKgVNQCjmSI8p97jCSzq4u8kgQ/export?format=csv",
  contacts:
    "https://docs.google.com/spreadsheets/d/1xjl9puDs7wR7TTFwT7QOibbMNW0Y_8DiectTrn5JHFE/export?format=csv",
} as const;

type SourceKey = keyof typeof CSV_URLS;

export type AdminDataset = {
  fetchedAt: string;
  users: Record<string, string>[];
  services: Record<string, string>[];
  contacts: Record<string, string>[];
};

// Minimal CSV parser handling quoted fields and embedded commas / newlines.
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim().length > 0));
  if (nonEmpty.length === 0) return [];
  const headers = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
    return obj;
  });
}

// Simple 5-minute in-memory cache (per worker instance).
const CACHE_MS = 5 * 60 * 1000;
const cache: Partial<Record<SourceKey, { ts: number; data: Record<string, string>[] }>> = {};

async function loadSource(key: SourceKey): Promise<Record<string, string>[]> {
  const cached = cache[key];
  if (cached && Date.now() - cached.ts < CACHE_MS) return cached.data;
  const r = await fetch(CSV_URLS[key], { redirect: "follow" });
  if (!r.ok) throw new Error(`Failed to fetch ${key}: ${r.status}`);
  const text = await r.text();
  const data = parseCSV(text);
  cache[key] = { ts: Date.now(), data };
  return data;
}

function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? "";
  const list = raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export const getAdminDataset = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDataset> => {
    const email = (context.claims?.email as string | undefined) ?? "";
    if (!isAdmin(email)) {
      throw new Error("Forbidden: admin access required");
    }
    const [users, services, contacts] = await Promise.all([
      loadSource("users").catch(() => []),
      loadSource("services").catch(() => []),
      loadSource("contacts").catch(() => []),
    ]);
    return { fetchedAt: new Date().toISOString(), users, services, contacts };
  });

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims?.email as string | undefined) ?? "";
    return { isAdmin: isAdmin(email), email };
  });
