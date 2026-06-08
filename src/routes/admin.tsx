import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminDataset, type AdminDataset } from "@/lib/admin-data.functions";
import { adminLogin } from "@/lib/admin-auth.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  LogIn,
  MessageSquare,
  Wrench,
  UserPlus,
  Mail,
  Download,
  RefreshCw,
  LogOut,
  Lock,
  Loader2,
  FileDown,
} from "lucide-react";
import { format, parseISO, subDays, isValid } from "date-fns";
import jsPDF from "jspdf";
import { toast } from "sonner";

const LOGO_URL =
  "https://res.cloudinary.com/dwv8kc9vb/image/upload/v1780845528/Finally_Logo_oxkjjv.png";
const TOKEN_KEY = "mw_admin_token";
const BRAND_COLOR = "#ef4444";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Manoj Wheels" },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const PAGE_SIZE = 10;
const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

/* ============================================================
   HELPERS
============================================================ */
function pick(row: Record<string, string>, keys: string[]): string {
  const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const k of keys) {
    const wanted = norm(k);
    const found = Object.keys(row).find((rk) => norm(rk) === wanted);
    if (found && row[found]) return row[found];
  }
  return "";
}

function tryParseDate(v: string): Date | null {
  if (!v) return null;
  const s = v.trim();
  const iso = parseISO(s);
  if (isValid(iso)) return iso;
  const indian = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (indian) {
    const [, dd, mm, yyyy, hh = "0", min = "0", sec = "0"] = indian;
    const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(sec));
    if (isValid(parsed)) return parsed;
  }
  const d = new Date(s);
  return isValid(d) ? d : null;
}

function toCSV(rows: Record<string, string>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string) => {
    const s = String(v ?? "");
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
}

function downloadFile(content: string | Blob, filename: string, type = "text/csv") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function filterByDateRange(
  rows: Record<string, string>[],
  from: string,
  to: string,
  dateKeys: string[],
): Record<string, string>[] {
  if (!from && !to) return rows;
  const fromD = from ? new Date(from + "T00:00:00") : null;
  const toD = to ? new Date(to + "T23:59:59") : null;
  return rows.filter((r) => {
    const d = tryParseDate(pick(r, dateKeys));
    if (!d) return false;
    if (fromD && d < fromD) return false;
    if (toD && d > toD) return false;
    return true;
  });
}

const USER_DATE_KEYS = ["createdAt", "created_at", "Created At", "Created_Date", "Signup Date", "Date", "Timestamp"];
const LOGIN_DATE_KEYS = ["lastLogin", "Last Login", "Last_Login", "loginAt", "createdAt", "Created At", "Created_Date", "Date", "Timestamp"];
const CONTACT_DATE_KEYS = ["Submitted Date", "Submitted_Date", "createdAt", "Created At", "Date", "Timestamp"];
const SERVICE_DATE_KEYS = ["Booking DateTime", "Booking_DateTime", "createdAt", "Created At", "Date", "Booking Date", "Timestamp"];

/* ============================================================
   PDF EXPORT (branded)
============================================================ */
function exportPDF(
  title: string,
  rows: Record<string, string>[],
  meta?: { from?: string; to?: string },
) {
  const doc = new jsPDF({ orientation: "landscape" });
  // Header band
  doc.setFillColor(239, 68, 68);
  doc.rect(0, 0, 297, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Manoj Wheels", 14, 14);
  doc.setFontSize(11);
  doc.text(title, 297 - 14, 14, { align: "right" });

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  const range =
    meta?.from || meta?.to
      ? `Range: ${meta?.from || "—"} → ${meta?.to || "—"}`
      : "Range: All time";
  doc.text(
    `Generated: ${format(new Date(), "PP p")}  •  ${rows.length} records  •  ${range}`,
    14,
    30,
  );

  if (!rows.length) {
    doc.setTextColor(120, 120, 120);
    doc.text("No data in selected range.", 14, 44);
    doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    return;
  }

  const headers = Object.keys(rows[0]).slice(0, 6);
  const colW = (297 - 28) / headers.length;
  let y = 40;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y - 5, 297 - 28, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  headers.forEach((h, i) => doc.text(String(h).slice(0, 24), 14 + i * colW + 2, y));
  doc.setFont("helvetica", "normal");
  y += 8;

  rows.forEach((r, idx) => {
    if (y > 195) {
      doc.addPage();
      y = 16;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(14, y - 5, 297 - 28, 7, "F");
    }
    headers.forEach((h, i) => {
      const v = String(r[h] ?? "").slice(0, 30);
      doc.text(v, 14 + i * colW + 2, y);
    });
    y += 7;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `manojwheels.online  •  Page ${i} of ${pageCount}`,
      297 / 2,
      205,
      { align: "center" },
    );
  }
  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

/* ============================================================
   ROOT
============================================================ */
function AdminPage() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  });

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    toast.success("Logged out");
  }, []);

  if (!token) {
    return <LoginScreen onSuccess={(t) => setToken(t)} />;
  }
  return <Dashboard token={token} onLogout={handleLogout} />;
}

/* ============================================================
   LOGIN
============================================================ */
function LoginScreen({ onSuccess }: { onSuccess: (token: string) => void }) {
  const loginFn = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await loginFn({ data: { username, password } });
      localStorage.setItem(TOKEN_KEY, r.token);
      toast.success("Welcome, Admin");
      onSuccess(r.token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 px-4">
      <Card className="w-full max-w-sm backdrop-blur-md bg-card/70 border-border/60 shadow-xl">
        <CardHeader className="text-center space-y-3">
          <img src={LOGO_URL} alt="Manoj Wheels" className="h-14 mx-auto" />
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Lock className="w-4 h-4" /> Admin Sign In
          </CardTitle>
          <p className="text-xs text-muted-foreground">Restricted access — Manoj Wheels</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="u">Username</Label>
              <Input
                id="u"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <Label htmlFor="p">Password</Label>
              <Input
                id="p"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
   DASHBOARD
============================================================ */
function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const getDataFn = useServerFn(getAdminDataset);

  const { data, isLoading, isFetching, refetch, error } = useQuery<AdminDataset>({
    queryKey: ["admin-dataset"],
    queryFn: () => getDataFn({ data: { token } }),
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 1,
  });

  // Token expired / invalid → boot to login
  useEffect(() => {
    if (error && /unauthorized/i.test((error as Error).message)) {
      localStorage.removeItem(TOKEN_KEY);
      toast.error("Session expired. Please sign in again.");
      onLogout();
    }
  }, [error, onLogout]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-6 space-y-6">
        <Header
          fetchedAt={data?.fetchedAt}
          isFetching={isFetching}
          onRefresh={() => refetch()}
          onLogout={onLogout}
        />

        {error && !/unauthorized/i.test((error as Error).message) && (
          <Card className="border-destructive/40">
            <CardContent className="p-4 text-sm text-destructive">
              Failed to load admin data. {(error as Error).message}
            </CardContent>
          </Card>
        )}

        {isLoading || !data ? <LoadingSkeleton /> : <DashboardBody data={data} />}
      </div>
    </div>
  );
}

function Header({
  fetchedAt,
  isFetching,
  onRefresh,
  onLogout,
}: {
  fetchedAt?: string;
  isFetching: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        <img src={LOGO_URL} alt="" className="h-10 w-10 object-contain" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Manoj Wheels • Live Google Sheets business intelligence
            {fetchedAt && ` • Updated ${format(new Date(fetchedAt), "p")}`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="destructive" size="sm" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-1" /> Logout
        </Button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-96" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="backdrop-blur-md bg-card/60 border-border/50 shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardBody({ data }: { data: AdminDataset }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const stats = useMemo(() => {
    const newUsersToday = data.users.filter((u) => {
      const d = tryParseDate(pick(u, USER_DATE_KEYS));
      return d && format(d, "yyyy-MM-dd") === todayStr;
    }).length;
    const newContactsToday = data.contacts.filter((c) => {
      const d = tryParseDate(pick(c, CONTACT_DATE_KEYS));
      return d && format(d, "yyyy-MM-dd") === todayStr;
    }).length;
    const totalLogins =
      data.users.reduce((sum, u) => {
        const v = pick(u, ["logins", "Login Count", "loginCount", "Total Logins"]);
        const n = parseInt(v, 10);
        return sum + (isNaN(n) ? 0 : n);
      }, 0) || data.users.length;
    return {
      totalUsers: data.users.length,
      totalLogins,
      totalContacts: data.contacts.length,
      totalServices: data.services.length,
      newUsersToday,
      newContactsToday,
    };
  }, [data, todayStr]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} />
        <StatCard icon={LogIn} label="Total Logins" value={stats.totalLogins} />
        <StatCard icon={MessageSquare} label="Contact Requests" value={stats.totalContacts} />
        <StatCard icon={Wrench} label="Services Booked" value={stats.totalServices} />
        <StatCard icon={UserPlus} label="New Users Today" value={stats.newUsersToday} />
        <StatCard icon={Mail} label="New Contacts Today" value={stats.newContactsToday} />
      </div>

      <DateRangeReports data={data} />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="logins">Logins</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="users"><UsersSection rows={data.users} /></TabsContent>
        <TabsContent value="logins"><LoginsSection rows={data.users} /></TabsContent>
        <TabsContent value="contacts"><ContactsSection rows={data.contacts} /></TabsContent>
        <TabsContent value="services"><ServicesSection rows={data.services} /></TabsContent>
      </Tabs>
    </>
  );
}

/* ============================================================
   DATE-RANGE REPORTS (PDF + CSV)
============================================================ */
function DateRangeReports({ data }: { data: AdminDataset }) {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const reports = useMemo(
    () => [
      { key: "users", label: "Users", icon: Users, rows: filterByDateRange(data.users, from, to, USER_DATE_KEYS) },
      { key: "logins", label: "Logins", icon: LogIn, rows: filterByDateRange(data.users, from, to, LOGIN_DATE_KEYS) },
      { key: "contacts", label: "Contacts", icon: MessageSquare, rows: filterByDateRange(data.contacts, from, to, CONTACT_DATE_KEYS) },
      { key: "services", label: "Services", icon: Wrench, rows: filterByDateRange(data.services, from, to, SERVICE_DATE_KEYS) },
    ],
    [data, from, to],
  );

  return (
    <Card className="backdrop-blur-md bg-card/60 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="w-4 h-4" /> Date-Range Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="sm:col-span-2 lg:col-span-2 flex items-end">
            <p className="text-xs text-muted-foreground">
              Choose a date range, then download PDF or CSV reports for each dataset.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {reports.map((r) => (
            <Card key={r.key} className="bg-background/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <r.icon className="w-4 h-4 text-primary" /> {r.label}
                  </div>
                  <Badge variant="secondary">{r.rows.length}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => exportPDF(`${r.label} Report`, r.rows, { from, to })}
                  >
                    <Download className="w-3 h-3 mr-1" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => downloadFile(toCSV(r.rows), `${r.key}-${from}-to-${to}.csv`)}
                  >
                    <Download className="w-3 h-3 mr-1" /> CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   USERS
============================================================ */
function UsersSection({ rows }: { rows: Record<string, string>[] }) {
  const [q, setQ] = useState("");
  const [authFilter, setAuthFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const authTypes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const t = pick(r, ["authType", "Auth Type", "provider", "Provider"]);
      if (t) set.add(t);
    });
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const name = pick(r, ["fullName", "Full Name", "name", "Name"]);
      const email = pick(r, ["email", "Email"]);
      const phone = pick(r, ["phoneNumber", "Phone Number", "phone"]);
      const auth = pick(r, ["authType", "Auth Type", "provider"]);
      const ds = pick(r, ["createdAt", "Created At", "Signup Date", "Date", "Timestamp"]);
      const d = tryParseDate(ds);
      if (q && ![name, email, phone].some((v) => v.toLowerCase().includes(q.toLowerCase()))) return false;
      if (authFilter !== "all" && auth !== authFilter) return false;
      if (dateFrom && d && d < new Date(dateFrom)) return false;
      if (dateTo && d && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [rows, q, authFilter, dateFrom, dateTo]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="backdrop-blur-md bg-card/60">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Users ({filtered.length})</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadFile(toCSV(filtered), "users.csv")}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportPDF("Users Report", filtered.slice(0, 200), { from: dateFrom, to: dateTo })}>
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input placeholder="Search name / email / phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <Select value={authFilter} onValueChange={(v) => { setAuthFilter(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Auth type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All auth types</SelectItem>
              {authTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead>Signup Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{pick(r, ["fullName", "Full Name", "name"])}</TableCell>
                  <TableCell>{pick(r, ["email", "Email"])}</TableCell>
                  <TableCell>{pick(r, ["phoneNumber", "Phone Number", "phone"])}</TableCell>
                  <TableCell><Badge variant="secondary">{pick(r, ["authType", "Auth Type", "provider"]) || "—"}</Badge></TableCell>
                  <TableCell>{pick(r, ["createdAt", "Created At", "Signup Date", "Date", "Timestamp"])}</TableCell>
                </TableRow>
              ))}
              {!pageRows.length && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No users match</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   LOGINS
============================================================ */
function LoginsSection({ rows }: { rows: Record<string, string>[] }) {
  const daily = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM dd");
      map.set(d, 0);
    }
    rows.forEach((r) => {
      const ds = pick(r, ["lastLogin", "Last Login", "loginAt", "createdAt", "Created At", "Date", "Timestamp"]);
      const d = tryParseDate(ds);
      if (!d) return;
      const k = format(d, "MMM dd");
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map, ([date, count]) => ({ date, count }));
  }, [rows]);

  const deviceData = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const v = pick(r, ["deviceInfo", "Device Info", "device", "Device", "platform"]);
      const key = v ? v.split(" on ").pop() || v : "Unknown";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [rows]);

  const topUsers = useMemo(() => {
    return [...rows]
      .map((r) => ({
        name: pick(r, ["fullName", "Full Name", "name"]) || pick(r, ["email", "Email"]),
        logins: parseInt(pick(r, ["logins", "Login Count", "loginCount"]) || "1", 10) || 1,
      }))
      .sort((a, b) => b.logins - a.logins)
      .slice(0, 8);
  }, [rows]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="backdrop-blur-md bg-card/60 lg:col-span-2">
        <CardHeader><CardTitle>Daily Login Trend (14 days)</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND_COLOR} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={BRAND_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Area type="monotone" dataKey="count" stroke={BRAND_COLOR} fill="url(#lg)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-md bg-card/60">
        <CardHeader><CardTitle>Device Breakdown</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={deviceData} dataKey="value" nameKey="name" outerRadius={80} label>
                {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-md bg-card/60">
        <CardHeader><CardTitle>Most Active Users</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topUsers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" stroke="#888" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#888" fontSize={11} width={120} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Bar dataKey="logins" fill={BRAND_COLOR} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
   CONTACTS
============================================================ */
function ContactsSection({ rows }: { rows: Record<string, string>[] }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const newToday = rows.filter((r) => {
    const d = tryParseDate(pick(r, ["createdAt", "Created At", "Date", "Timestamp"]));
    return d && format(d, "yyyy-MM-dd") === todayStr;
  }).length;

  const subjectData = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const s = pick(r, ["subject", "Subject", "Topic", "Service"]) || "General";
      map.set(s, (map.get(s) ?? 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const recent = [...rows].slice(-8).reverse();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={MessageSquare} label="Total Messages" value={rows.length} />
        <StatCard icon={Mail} label="New Today" value={newToday} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="backdrop-blur-md bg-card/60">
          <CardHeader><CardTitle>Subject Breakdown</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                <Bar dataKey="value" fill={BRAND_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Contacts</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadFile(toCSV(rows), "contacts.csv")}>
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportPDF("Contacts Report", rows.slice(0, 200))}>
                <Download className="w-4 h-4 mr-1" /> PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((r, i) => (
              <div key={i} className="border-b border-border/40 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between text-sm font-medium">
                  <span>{pick(r, ["name", "Name", "Full Name"]) || "Anonymous"}</span>
                  <span className="text-xs text-muted-foreground">{pick(r, ["createdAt", "Date", "Timestamp"])}</span>
                </div>
                <p className="text-xs text-muted-foreground">{pick(r, ["email", "Email"])}{pick(r, ["phone", "Phone"]) ? ` • ${pick(r, ["phone", "Phone"])}` : ""}</p>
                <p className="text-sm mt-1 line-clamp-2">{pick(r, ["message", "Message", "Query"])}</p>
              </div>
            ))}
            {!recent.length && <p className="text-sm text-muted-foreground">No contacts yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   SERVICES
============================================================ */
function ServicesSection({ rows }: { rows: Record<string, string>[] }) {
  const popularity = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const s = pick(r, ["service", "Service", "Service Type", "Type"]) || "Other";
      map.set(s, (map.get(s) ?? 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const trend = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      map.set(format(subDays(new Date(), i), "MMM dd"), 0);
    }
    rows.forEach((r) => {
      const d = tryParseDate(pick(r, ["createdAt", "Created At", "Date", "Booking Date", "Timestamp"]));
      if (!d) return;
      const k = format(d, "MMM dd");
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map, ([date, count]) => ({ date, count }));
  }, [rows]);

  const top = popularity[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Wrench} label="Most Requested" value={top?.name ?? "—"} hint={top ? `${top.value} bookings` : undefined} />
        <StatCard icon={Wrench} label="Total Bookings" value={rows.length} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="backdrop-blur-md bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Service Popularity</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadFile(toCSV(rows), "services.csv")}>
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => exportPDF("Services Report", rows.slice(0, 200))}>
                <Download className="w-4 h-4 mr-1" /> PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={popularity} dataKey="value" nameKey="name" outerRadius={90} label>
                  {popularity.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/60">
          <CardHeader><CardTitle>Booking Trend (14 days)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                <Line type="monotone" dataKey="count" stroke={BRAND_COLOR} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
