import { createServerFn } from "@tanstack/react-start";
import { verifyAdminToken } from "./admin-auth.functions";

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

const CACHE_MS = 60 * 1000; // 1 min cache so notifications stay fresh
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

export const getAdminDataset = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: String(d?.token ?? "") }))
  .handler(async ({ data }): Promise<AdminDataset> => {
    if (!verifyAdminToken(data.token)) {
      throw new Error("Unauthorized: invalid or expired admin session");
    }
    const [users, services, contacts] = await Promise.all([
      loadSource("users").catch(() => []),
      loadSource("services").catch(() => []),
      loadSource("contacts").catch(() => []),
    ]);
    return { fetchedAt: new Date().toISOString(), users, services, contacts };
  });
