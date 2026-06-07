import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, FileText, CalendarDays, Download, Trash2, LogOut, ScanLine, Phone, Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchMyProfile, fetchMyReports, fetchMyBookings, deleteReport, updateMyProfile,
  type StoredReport,
} from "@/lib/reports-client";
import { generateTyreReportPDF } from "@/lib/tyre-report-pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard | Manoj Wheels" },
      { name: "description", content: "View your tyre report history, bookings, and re-download PDFs anytime." },
    ],
  }),
  component: DashboardPage,
});

type Profile = { id: string; full_name: string | null; phone: string | null; email: string | null; avatar_url: string | null };
type Booking = {
  id: string; full_name: string; service_needed: string | null; vehicle_type: string | null;
  preferred_date: string | null; preferred_time: string | null; status: string; created_at: string;
};

function fmtDate(s: string) {
  return new Date(s).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    (async () => {
      const [p, r, b] = await Promise.all([fetchMyProfile(), fetchMyReports(), fetchMyBookings()]);
      setProfile(p as Profile | null);
      setReports(r);
      setBookings(b as unknown as Booking[]);
      if (p) {
        setFullName((p as Profile).full_name ?? "");
        setPhone((p as Profile).phone ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  async function handleSaveProfile() {
    const next = await updateMyProfile({ full_name: fullName, phone });
    if (next) {
      setProfile(next as Profile);
      setEditing(false);
      toast.success("Profile updated");
    } else toast.error("Could not update profile");
  }

  function reDownload(r: StoredReport) {
    generateTyreReportPDF(r.result, r.image_url, { save: true });
    toast.success("PDF re-downloaded");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this report?")) return;
    await deleteReport(id);
    setReports(reports.filter((x) => x.id !== id));
    toast.success("Report deleted");
  }

  const lastReportDate = reports[0]?.created_at;
  const lastBookingDate = bookings[0]?.created_at;
  const lastService = [lastReportDate, lastBookingDate].filter(Boolean).sort().reverse()[0];

  if (loading) {
    return <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">Loading your dashboard…</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold">My <span className="text-gradient-primary">Dashboard</span></h1>
          <p className="mt-1 text-muted-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}.</p>
        </div>
        <Button variant="outline" onClick={handleSignOut}><LogOut className="w-4 h-4 mr-2" /> Sign out</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <StatCard icon={<FileText className="w-5 h-5" />} label="Tyre Reports" value={reports.length} />
        <StatCard icon={<CalendarDays className="w-5 h-5" />} label="Bookings" value={bookings.length} />
        <StatCard icon={<ScanLine className="w-5 h-5" />} label="Last Score" value={reports[0]?.score ?? "—"} suffix={reports[0] ? "/100" : ""} />
        <StatCard icon={<User className="w-5 h-5" />} label="Last Service" value={lastService ? fmtDate(lastService).split(",")[0] : "—"} />
      </div>

      {/* Profile */}
      <Card className="mt-8 p-6 bg-card/60">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2"><User className="w-5 h-5" /> Profile</h2>
          {!editing && <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>}
        </div>
        {editing ? (
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="fn">Full name</Label>
              <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="ph">Phone</Label>
              <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button variant="hero" onClick={handleSaveProfile}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
            <Row label="Name" value={profile?.full_name || "—"} />
            <Row label="Email" value={profile?.email || "—"} icon={<Mail className="w-4 h-4" />} />
            <Row label="Phone" value={profile?.phone || "—"} icon={<Phone className="w-4 h-4" />} />
          </div>
        )}
      </Card>

      {/* Reports */}
      <Card className="mt-6 p-6 bg-card/60">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2"><FileText className="w-5 h-5" /> Tyre Report History</h2>
          <Button asChild variant="hero" size="sm"><Link to="/ai-check">New Check</Link></Button>
        </div>
        {reports.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No reports yet. Run your first AI tyre check to see it here.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                <div className="w-12 h-12 rounded-md bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold">
                  {r.score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.recommendation}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmtDate(r.created_at)} · Tread {r.tread ?? "—"}% · {r.cracks ?? "—"} cracks · ~{(r.remaining_km ?? 0).toLocaleString()} km left
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => reDownload(r)}>
                  <Download className="w-4 h-4 mr-1.5" /> PDF
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)} aria-label="Delete report">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Bookings / Recent Activity */}
      <Card className="mt-6 p-6 bg-card/60">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Recent Bookings</h2>
          <Button asChild variant="hero" size="sm"><Link to="/book">Book Service</Link></Button>
        </div>
        {bookings.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{b.service_needed || "Service"} · {b.vehicle_type || ""}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.preferred_date ? `${b.preferred_date} ${b.preferred_time ?? ""}` : ""} · Booked {fmtDate(b.created_at)}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-accent capitalize">{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number | string; suffix?: string }) {
  return (
    <Card className="p-4 bg-card/60">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">{icon}{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}<span className="text-base font-normal text-muted-foreground">{suffix}</span></div>
    </Card>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">{icon}{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
