import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminDataset,
  checkAdmin,
  type AdminDataset,
} from "@/lib/admin-data.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ShieldAlert,
} from "lucide-react";
import { format, parseISO, subDays, isValid } from "date-fns";
import jsPDF from "jspdf";
import { signOut } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Manoj Wheels" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: AdminDashboard,
});

const PAGE_SIZE = 10;
const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(row).find((rk) => rk.toLowerCase().trim() === k.toLowerCase());
    if (found && row[found]) return row[found];
  }
  return "";
}

function tryParseDate(v: string): Date | null {
  if (!v) return null;
  const s = v.trim();
  // try ISO
  const iso = parseISO(s);
  if (isValid(iso)) return iso;
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

function AdminDashboard() {
  const navigate = useNavigate();
  const checkAdminFn = useServerFn(checkAdmin);
  const getDataFn = useServerFn(getAdminDataset);

  const { data: adminCheck, isLoading: checking } = useQuery({
    queryKey: ["admin-check"],
    queryFn: () => checkAdminFn(),
    retry: false,
  });

  const isAdmin = adminCheck?.isAdmin === true;

  const {
    data,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery<AdminDataset>({
    queryKey: ["admin-dataset"],
    queryFn: () => getDataFn(),
    enabled: isAdmin,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60_000,
  });

  // Notification: detect new users / contacts since last view
  const [seen, setSeen] = useState<{ users: number; contacts: number; services: number }>({
    users: 0,
    contacts: 0,
    services: 0,
  });
  useEffect(() => {
    if (!data) return;
    if (seen.users && data.users.length > seen.users) {
      toast.success(`${data.users.length - seen.users} new user signup(s)`);
    }
    if (seen.contacts && data.contacts.length > seen.contacts) {
      toast.success(`${data.contacts.length - seen.contacts} new contact request(s)`);
    }
    if (seen.services && data.services.length > seen.services) {
      toast.success(`${data.services.length - seen.services} new service booking(s)`);
    }
    setSeen({
      users: data.users.length,
      contacts: data.contacts.length,
      services: data.services.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.fetchedAt]);

  if (checking) {
    return (
      <div className="container py-10 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-20 max-w-md">
        <Card className="backdrop-blur-md bg-card/60 border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" /> Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account ({adminCheck?.email || "—"}) is not authorized to view the admin
              dashboard.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate({ to: "/" })}>
                Go Home
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/auth" });
                }}
              >
                <LogOut className="w-4 h-4 mr-1" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-6 space-y-6">
        <Header
          fetchedAt={data?.fetchedAt}
          isFetching={isFetching}
          onRefresh={() => refetch()}
        />

        {error && (
          <Card className="border-destructive/40">
            <CardContent className="p-4 text-sm text-destructive">
              Failed to load admin data. {(error as Error).message}
            </CardContent>
          </Card>
        )}

        {isLoading || !data ? (
          <LoadingSkeleton />
        ) : (
          <DashboardBody data={data} />
        )}
      </div>
    </div>
  );
}

function Header({
  fetchedAt,
  isFetching,
  onRefresh,
}: {
  fetchedAt?: string;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manoj Wheels • Real-time business intelligence
          {fetchedAt && ` • Updated ${format(new Date(fetchedAt), "PP p")}`}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={async () => {
            await signOut();
            navigate({ to: "/auth" });
          }}
        >
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

function DashboardBody({ data }: { data: AdminDataset }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const stats = useMemo(() => {
    const newUsersToday = data.users.filter((u) => {
      const d = tryParseDate(pick(u, ["createdAt", "created_at", "Created At", "Signup Date", "Date", "Timestamp"]));
      return d && format(d, "yyyy-MM-dd") === todayStr;
    }).length;
    const newContactsToday = data.contacts.filter((c) => {
      const d = tryParseDate(pick(c, ["createdAt", "Created At", "Date", "Timestamp"]));
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

/* -------------------- USERS -------------------- */
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

      if (q && ![name, email, phone].some((v) => v.toLowerCase().includes(q.toLowerCase())))
        return false;
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFile(toCSV(filtered), "users.csv")}
          >
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportPDF("Users Report", filtered.slice(0, 100))}
          >
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

/* -------------------- LOGINS -------------------- */
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
    return Array.from(map, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
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
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#lg)" />
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
              <Bar dataKey="logins" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- CONTACTS -------------------- */
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
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Contacts</CardTitle>
            <Button size="sm" variant="outline" onClick={() => downloadFile(toCSV(rows), "contacts.csv")}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
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

/* -------------------- SERVICES -------------------- */
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
            <Button size="sm" variant="outline" onClick={() => downloadFile(toCSV(rows), "services.csv")}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
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
                <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* -------------------- PDF EXPORT -------------------- */
function exportPDF(title: string, rows: Record<string, string>[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.text(`Manoj Wheels — ${title}`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), "PP p")} • ${rows.length} records`, 14, 22);

  if (!rows.length) {
    doc.text("No data.", 14, 32);
    doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    return;
  }
  const headers = Object.keys(rows[0]).slice(0, 6);
  const colW = (297 - 28) / headers.length;
  let y = 32;
  doc.setFont("helvetica", "bold");
  headers.forEach((h, i) => doc.text(String(h).slice(0, 20), 14 + i * colW, y));
  doc.setFont("helvetica", "normal");
  y += 6;
  rows.forEach((r) => {
    if (y > 195) {
      doc.addPage();
      y = 16;
    }
    headers.forEach((h, i) => {
      const v = String(r[h] ?? "").slice(0, 28);
      doc.text(v, 14 + i * colW, y);
    });
    y += 6;
  });
  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
